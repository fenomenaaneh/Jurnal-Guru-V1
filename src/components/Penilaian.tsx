import { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { Student } from '../hooks/useStudents';
import { TugasGuru } from '../hooks/useTugas';
import { Star, Download, Filter, Users, BookOpen, Info, ChevronDown } from 'lucide-react';

type PenilaianProps = {
  students: Student[];
  journals: JournalEntry[];
  onUpdateJournal: (id: string, data: Partial<JournalEntry>) => void;
  tugasGuru?: TugasGuru;
};

type GradeRecord = Record<string, Record<string, string>>; // studentId -> { journalId -> nilai }

export function Penilaian({ students, journals, onUpdateJournal, tugasGuru }: PenilaianProps) {

  // Ambil daftar kelas dari tugasGuru jika ada, fallback ke semua kelas dari jurnal
  const availableKelas = useMemo(() => {
    if (tugasGuru && (tugasGuru.kelas ?? []).length > 0) {
      return (tugasGuru.kelas ?? []).map(k => k.namaKelas).sort();
    }
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [tugasGuru, students]);

  const hasTugas = tugasGuru && (tugasGuru.kelas ?? []).length > 0;

  const [selectedKelas, setSelectedKelas] = useState<string>(availableKelas[0] ?? '');
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [localGrades, setLocalGrades] = useState<GradeRecord>({});
  const [saved, setSaved] = useState(false);

  // Mapel tersedia untuk kelas terpilih
  const mapelOptions = useMemo(() => {
    if (!tugasGuru) return [];
    const kelasItem = (tugasGuru.kelas ?? []).find(k => k.namaKelas === selectedKelas);
    return (kelasItem?.mapel ?? []).map(m => m.namaMapel);
  }, [tugasGuru, selectedKelas]);

  // Jurnal sesuai kelas & mapel
  const filteredJournals = useMemo(() => {
    return journals
      .filter(j => {
        const kelasMatch = j.className === selectedKelas;
        const mapelMatch = selectedMapel ? j.subject === selectedMapel : true;
        return kelasMatch && mapelMatch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [journals, selectedKelas, selectedMapel]);

  // Siswa di kelas terpilih
  const kelasStudents = useMemo(
    () => students.filter(s => s.className === selectedKelas),
    [students, selectedKelas]
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short',
      });
    } catch { return dateStr; }
  };

  // Ambil nilai dari jurnal atau state lokal
  const getGrade = (studentId: string, journalId: string): string => {
    if (localGrades[studentId]?.[journalId] !== undefined) {
      return localGrades[studentId][journalId];
    }
    const journal = journals.find(j => j.id === journalId);
    return (journal?.grades as Record<string, string>)?.[studentId] ?? '';
  };

  const handleGradeChange = (studentId: string, journalId: string, value: string) => {
    // Hanya angka 0-100
    const num = value.replace(/[^0-9]/g, '');
    const clamped = num === '' ? '' : String(Math.min(100, Number(num)));
    setLocalGrades(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [journalId]: clamped },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // Kelompokkan perubahan per jurnal
    const byJournal: Record<string, Record<string, string>> = {};
    for (const [studentId, byJournalId] of Object.entries(localGrades)) {
      for (const [journalId, nilai] of Object.entries(byJournalId)) {
        if (!byJournal[journalId]) byJournal[journalId] = {};
        byJournal[journalId][studentId] = nilai;
      }
    }

    for (const [journalId, gradesMap] of Object.entries(byJournal)) {
      const journal = journals.find(j => j.id === journalId);
      if (!journal) continue;
      const existing = (journal.grades as Record<string, string>) ?? {};
      onUpdateJournal(journalId, { grades: { ...existing, ...gradesMap } });
    }

    setSaved(true);
    setLocalGrades({});
    setTimeout(() => setSaved(false), 3000);
  };

  // Rata-rata nilai per siswa
  const getAverage = (studentId: string): string => {
    const values: number[] = [];
    for (const j of filteredJournals) {
      const g = getGrade(studentId, j.id);
      if (g !== '') values.push(Number(g));
    }
    if (values.length === 0) return '-';
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = ['No', 'NIS', 'Nama', ...filteredJournals.map(j => `${formatDate(j.date)} (${j.subject})`), 'Rata-rata'];
    const rows = kelasStudents.map((s, i) => {
      const avg = getAverage(s.id);
      return [
        i + 1,
        s.nis,
        s.name,
        ...filteredJournals.map(j => getGrade(s.id, j.id) || '-'),
        avg,
      ];
    });

    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `penilaian-${selectedKelas}${selectedMapel ? '-' + selectedMapel : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasUnsaved = Object.keys(localGrades).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Penilaian Siswa
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Input nilai per pertemuan berdasarkan jurnal mengajar.</p>
        </div>
        <div className="flex gap-2">
          {hasUnsaved && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Simpan Nilai
            </button>
          )}
          {filteredJournals.length > 0 && kelasStudents.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          ✓ Nilai berhasil disimpan
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          Filter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kelas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kelas</label>
            {availableKelas.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedKelas}
                  onChange={e => { setSelectedKelas(e.target.value); setSelectedMapel(''); }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 appearance-none"
                >
                  {availableKelas.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <Info className="w-4 h-4 flex-shrink-0" />
                {hasTugas ? 'Belum ada kelas di tugas.' : 'Belum ada kelas tersedia.'}
              </div>
            )}
          </div>

          {/* Mapel */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mata Pelajaran</label>
            {hasTugas && mapelOptions.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedMapel}
                  onChange={e => setSelectedMapel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 appearance-none"
                >
                  <option value="">Semua Mata Pelajaran</option>
                  {mapelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedMapel}
                  onChange={e => setSelectedMapel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 appearance-none"
                >
                  <option value="">Semua Mata Pelajaran</option>
                  {Array.from(new Set(filteredJournals.map(j => j.subject))).filter(Boolean).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Info stats */}
        {selectedKelas && (
          <div className="flex gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {kelasStudents.length} siswa
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {filteredJournals.length} pertemuan
            </span>
          </div>
        )}
      </div>

      {/* Tabel nilai */}
      {kelasStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada siswa di kelas ini.</p>
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada jurnal untuk kelas{selectedMapel ? ` / ${selectedMapel}` : ''} ini.</p>
          <p className="text-slate-400 text-sm mt-1">Isi jurnal terlebih dahulu di menu Isi Jurnal.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 w-8">No</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-8 bg-slate-50 min-w-[160px]">Nama Siswa</th>
                  {filteredJournals.map(j => (
                    <th key={j.id} className="px-2 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[80px]">
                      <div>{formatDate(j.date)}</div>
                      {j.subject && <div className="font-normal text-slate-400 normal-case truncate max-w-[80px]">{j.subject}</div>}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider min-w-[80px]">Rata-rata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kelasStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2.5 text-slate-400 text-xs text-center sticky left-0 bg-white">{idx + 1}</td>
                    <td className="px-3 py-2.5 sticky left-8 bg-white">
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.nis}</p>
                    </td>
                    {filteredJournals.map(j => {
                      const val = getGrade(student.id, j.id);
                      const num = val === '' ? null : Number(val);
                      const colorClass = num === null ? '' :
                        num >= 75 ? 'text-emerald-700' :
                        num >= 60 ? 'text-amber-700' : 'text-rose-700';
                      return (
                        <td key={j.id} className="px-2 py-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={val}
                            onChange={e => handleGradeChange(student.id, j.id, e.target.value)}
                            placeholder="—"
                            className={`w-16 text-center px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm font-semibold transition-colors ${colorClass}`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center">
                      {(() => {
                        const avg = getAverage(student.id);
                        const num = avg === '-' ? null : Number(avg);
                        return (
                          <span className={`text-sm font-bold ${
                            num === null ? 'text-slate-400' :
                            num >= 75 ? 'text-emerald-700' :
                            num >= 60 ? 'text-amber-700' : 'text-rose-700'
                          }`}>{avg}</span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasUnsaved && (
            <div className="px-5 py-4 border-t border-slate-100 bg-amber-50 flex items-center justify-between">
              <p className="text-sm text-amber-700 font-medium">⚠ Ada nilai yang belum disimpan</p>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Simpan Sekarang
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}