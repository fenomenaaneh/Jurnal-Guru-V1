/**
 * useWaliKelasSync
 *
 * Hook untuk wali kelas: mengambil semua jurnal + rekap kehadiran + nilai
 * dari SEMUA guru mapel yang mengajar di kelas walinya.
 *
 * Auto-refresh setiap 60 detik supaya tetap sinkron.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JournalEntry } from '../types';

type TeacherInfo = {
  teacherId: string;
  teacherName: string;
};

type SubjectSummary = {
  subject: string;
  teacherName: string;
  teacherId: string;
  totalPertemuan: number;
  lastDate: string;
};

type StudentAttendanceSummary = {
  studentId: string;
  studentName: string;
  nis: string;
  bySubject: Record<string, {          // key: subject name
    teacherName: string;
    teacherId: string;                 // ← TAMBAH field ini
    present: number;
    sick: number;
    permission: number;
    absent: number;
    total: number;
    pct: number;
  }>;
  totalPresent: number;
  totalAbsent: number;                 // alpa lintas mapel
};

type WaliKelasData = {
  journals: (JournalEntry & { teacherId: string; teacherName?: string })[];
  subjects: SubjectSummary[];
  teachers: TeacherInfo[];
  attendanceSummary: StudentAttendanceSummary[];
  lastUpdated: Date | null;
};

type UseWaliKelasSync = {
  data: WaliKelasData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const REFRESH_INTERVAL = 60_000; // 60 detik

// Cache nama guru berdasarkan teacherId (dipopulasi dari data journal)
const teacherNameCache: Record<string, string> = {};

function buildAttendanceSummary(
  journals: (JournalEntry & { teacherId: string })[],
  students: { id: string; name: string; nis: string }[]
): StudentAttendanceSummary[] {
  return students.map(student => {
    const bySubject: StudentAttendanceSummary['bySubject'] = {};
    let totalPresent = 0, totalAbsent = 0;

    // Kelompokkan jurnal per mapel
    const bySubjectJournals: Record<string, (JournalEntry & { teacherId: string })[]> = {};
    for (const j of journals) {
      if (!bySubjectJournals[j.subject]) bySubjectJournals[j.subject] = [];
      bySubjectJournals[j.subject].push(j);
    }

    for (const [subject, subJournals] of Object.entries(bySubjectJournals)) {
      const teacherId   = subJournals[0]?.teacherId ?? '';
      const teacherName = teacherNameCache[teacherId] ?? teacherId;

      let present = 0, sick = 0, permission = 0, absent = 0;
      for (const j of subJournals) {
        const status = j.studentAttendance?.[student.id];
        if (status === 'present')         present++;
        else if (status === 'sick')       sick++;
        else if (status === 'permission') permission++;
        else if (status === 'absent')     absent++;
      }
      const total = subJournals.length;
      const pct   = total > 0 ? Math.round((present / total) * 100) : 0;

      // teacherId sekarang ada di tipe, tidak akan error lagi
      bySubject[subject] = { teacherName, teacherId, present, sick, permission, absent, total, pct };
      totalPresent += present;
      totalAbsent  += absent;
    }

    return { studentId: student.id, studentName: student.name, nis: student.nis, bySubject, totalPresent, totalAbsent };
  });
}

export function useWaliKelasSync(
  waliKelas: string | undefined,
  students: { id: string; name: string; nis: string }[]
): UseWaliKelasSync {
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [journals, setJournals]             = useState<(JournalEntry & { teacherId: string })[]>([]);
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null);
  const intervalRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!waliKelas) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/class-journals?className=${encodeURIComponent(waliKelas)}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      const raw: (JournalEntry & { teacherId: string })[] = json.journals ?? [];

      // Populasi cache nama guru dari data yang ada
      for (const j of raw) {
        if (j.teacherId && j.teacherName) {
          teacherNameCache[j.teacherId] = j.teacherName;
        }
      }

      setJournals(raw);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Gagal mengambil data kelas');
    } finally {
      setLoading(false);
    }
  }, [waliKelas]);

  // Fetch awal + auto-refresh
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Derived data
  const subjects: SubjectSummary[] = (() => {
    const map: Record<string, SubjectSummary> = {};
    for (const j of journals) {
      if (!map[j.subject]) {
        map[j.subject] = {
          subject: j.subject,
          teacherName: teacherNameCache[j.teacherId] ?? j.teacherId,
          teacherId: j.teacherId,
          totalPertemuan: 0,
          lastDate: j.date,
        };
      }
      map[j.subject].totalPertemuan++;
      if (j.date > map[j.subject].lastDate) map[j.subject].lastDate = j.date;
    }
    return Object.values(map).sort((a, b) => a.subject.localeCompare(b.subject, 'id'));
  })();

  const teachers: TeacherInfo[] = (() => {
    const seen = new Set<string>();
    return journals
      .filter(j => { if (seen.has(j.teacherId)) return false; seen.add(j.teacherId); return true; })
      .map(j => ({ teacherId: j.teacherId, teacherName: teacherNameCache[j.teacherId] ?? j.teacherId }));
  })();

  const attendanceSummary = buildAttendanceSummary(journals, students);

  return {
    data: { journals, subjects, teachers, attendanceSummary, lastUpdated },
    loading,
    error,
    refresh: fetchData,
  };
}