import { useState, useMemo } from 'react';
import { Users, BookOpen, Save, CheckCircle2, Star, Calculator, Download } from 'lucide-react';
import { Student } from '../hooks/useStudents';
import { JournalEntry } from '../types';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

type PenilaianProps = {
  students: Student[];
  journals: JournalEntry[];
  onUpdateJournal: (id: string, updatedEntry: Partial<JournalEntry>) => void;
};

export function Penilaian({ students, journals, onUpdateJournal }: PenilaianProps) {
  const [activeTab, setActiveTab] = useState<'harian' | 'semester'>('harian');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedJournalId, setSelectedJournalId] = useState('');
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);

  // Get unique classes from students
  const classes = Array.from(new Set(students.map(s => s.className))).sort();

  // If no class is selected but classes exist, select the first one
  if (!selectedClass && classes.length > 0) {
    setSelectedClass(classes[0]);
  }

  // Filter students by selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);

  // Filter journals by selected class
  const classJournals = useMemo(() => {
    return journals.filter(j => j.className === selectedClass).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journals, selectedClass]);

  // If no journal is selected but journals exist for the class, select the first one
  if (!selectedJournalId && classJournals.length > 0) {
    setSelectedJournalId(classJournals[0].id);
  } else if (selectedJournalId && !classJournals.find(j => j.id === selectedJournalId)) {
    // If selected journal is not in the current class, reset
    setSelectedJournalId(classJournals.length > 0 ? classJournals[0].id : '');
  }

  const selectedJournal = classJournals.find(j => j.id === selectedJournalId);

  // Initialize grades when journal changes
  useMemo(() => {
    if (selectedJournal) {
      setGrades(selectedJournal.grades || {});
    } else {
      setGrades({});
    }
    setSaved(false);
  }, [selectedJournal]);

  const handleGradeChange = (studentId: string, value: string) => {
    const numValue = parseInt(value, 10);
    setGrades(prev => {
      const newGrades = { ...prev };
      if (isNaN(numValue)) {
        delete newGrades[studentId];
      } else {
        newGrades[studentId] = Math.min(100, Math.max(0, numValue));
      }
      return newGrades;
    });
    setSaved(false);
  };

  const handleSave = () => {
    if (selectedJournalId) {
      onUpdateJournal(selectedJournalId, { grades });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Calculate semester grades
  const semesterGrades = useMemo(() => {
    const result: Record<string, { total: number; count: number; average: number }> = {};
    
    classStudents.forEach(student => {
      result[student.id] = { total: 0, count: 0, average: 0 };
    });

    classJournals.forEach(journal => {
      if (journal.grades) {
        Object.entries(journal.grades).forEach(([studentId, grade]) => {
          if (result[studentId] && typeof grade === 'number') {
            result[studentId].total += grade;
            result[studentId].count += 1;
          }
        });
      }
    });

    Object.keys(result).forEach(studentId => {
      const data = result[studentId];
      result[studentId].average = data.count > 0 ? Math.round(data.total / data.count) : 0;
    });

    return result;
  }, [classStudents, classJournals]);

  const handleDownloadCSV = () => {
    if (classStudents.length === 0) return;

    const headers = ['No', 'Nama Siswa', 'Jumlah Nilai', 'Rata-rata'];
    const rows = classStudents.map((student, index) => {
      const data = semesterGrades[student.id];
      return [
        index + 1,
        student.name,
        data.count,
        data.average > 0 ? data.average : '-'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Nilai_Semester_${selectedClass}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Penilaian Siswa</h2>
        <p className="text-slate-500">Kelola nilai harian dan rekap nilai semester siswa.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('harian')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'harian'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2" />
            Penilaian Harian
          </div>
        </button>
        <button
          onClick={() => setActiveTab('semester')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'semester'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Penilaian Semester
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={classes.length === 0}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none disabled:opacity-50"
            >
              {classes.length > 0 ? (
                classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))
              ) : (
                <option value="">Belum ada kelas</option>
              )}
            </select>
          </div>
        </div>

        {activeTab === 'harian' && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pertemuan (Jurnal)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpen className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={selectedJournalId}
                onChange={(e) => setSelectedJournalId(e.target.value)}
                disabled={classJournals.length === 0}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none disabled:opacity-50"
              >
                {classJournals.length > 0 ? (
                  classJournals.map(j => (
                    <option key={j.id} value={j.id}>
                      {format(parseISO(j.date), 'dd MMM yyyy', { locale: id })} - {j.subject}
                    </option>
                  ))
                ) : (
                  <option value="">Belum ada jurnal</option>
                )}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'harian' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {classJournals.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Belum ada jurnal untuk kelas ini.</p>
              <p className="text-sm text-slate-400 mt-1">Silakan isi jurnal terlebih dahulu untuk memberikan penilaian.</p>
            </div>
          ) : classStudents.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Belum ada siswa di kelas ini.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Input Nilai Harian</h3>
                  {selectedJournal && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{selectedJournal.topic}</p>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    saved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  }`}
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tersimpan
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Nilai
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Nilai (0-100)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((student, index) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 text-center">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                              {student.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-slate-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={grades[student.id] !== undefined ? grades[student.id] : ''}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="w-full px-3 py-2 text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-900"
                            placeholder="-"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {classStudents.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Belum ada siswa di kelas ini.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rekap Nilai Semester</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Rata-rata dari {classJournals.length} pertemuan</p>
                </div>
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Jml Nilai</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">Rata-rata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((student, index) => {
                      const data = semesterGrades[student.id];
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-500 text-center">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                                {student.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-slate-600">{data.count}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold ${
                              data.average >= 80 ? 'bg-emerald-100 text-emerald-700' :
                              data.average >= 60 ? 'bg-amber-100 text-amber-700' :
                              data.average > 0 ? 'bg-rose-100 text-rose-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {data.average > 0 ? data.average : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
