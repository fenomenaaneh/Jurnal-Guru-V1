import { useState, useEffect } from 'react';
import { Users, Calendar, Save, CheckCircle2 } from 'lucide-react';
import { Student } from '../hooks/useStudents';

type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

type PresensiProps = {
  students: Student[];
};

export function Presensi({ students }: PresensiProps) {
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  // Get unique classes from students
  const classes = Array.from(new Set(students.map(s => s.className))).sort();

  // If no class is selected but classes exist, select the first one
  if (!selectedClass && classes.length > 0) {
    setSelectedClass(classes[0]);
  }

  // Filter students by selected class
  const classStudents = students.filter(s => s.className === selectedClass);

  // Initialize attendance when class changes
  useEffect(() => {
    const initialAttendance: Record<string, AttendanceStatus> = {};
    classStudents.forEach(student => {
      initialAttendance[student.id] = 'H';
    });
    setAttendance(initialAttendance);
    setSaved(false);
  }, [selectedClass, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const handleSave = () => {
    // In a real app, save to database
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const stats = {
    H: Object.values(attendance).filter(s => s === 'H').length,
    S: Object.values(attendance).filter(s => s === 'S').length,
    I: Object.values(attendance).filter(s => s === 'I').length,
    A: Object.values(attendance).filter(s => s === 'A').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Presensi Siswa</h2>
        <p className="text-slate-500">Catat kehadiran siswa untuk setiap pertemuan.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
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
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <span className="block text-xs font-medium text-emerald-600 mb-1">Hadir</span>
          <span className="block text-xl font-bold text-emerald-700">{stats.H}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <span className="block text-xs font-medium text-amber-600 mb-1">Sakit</span>
          <span className="block text-xl font-bold text-amber-700">{stats.S}</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <span className="block text-xs font-medium text-blue-600 mb-1">Izin</span>
          <span className="block text-xl font-bold text-blue-700">{stats.I}</span>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
          <span className="block text-xs font-medium text-rose-600 mb-1">Alpa</span>
          <span className="block text-xl font-bold text-rose-700">{stats.A}</span>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {classStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">Tidak ada data siswa</h3>
              <p className="mt-1 text-sm text-slate-500">
                {classes.length === 0 
                  ? "Silakan buat kelas dan tambahkan siswa di menu Data Siswa."
                  : `Silakan tambahkan siswa untuk kelas ${selectedClass} di menu Data Siswa.`}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">NIS</th>
                  <th className="px-4 py-3 font-medium">Nama Siswa</th>
                  <th className="px-4 py-3 font-medium text-center">Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{student.nis}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        {(['H', 'S', 'I', 'A'] as AttendanceStatus[]).map((status) => {
                          const isSelected = attendance[student.id] === status;
                          let colorClass = '';
                          if (status === 'H') colorClass = isSelected ? 'bg-emerald-500 text-white border-emerald-500' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50';
                          if (status === 'S') colorClass = isSelected ? 'bg-amber-500 text-white border-amber-500' : 'text-amber-600 border-amber-200 hover:bg-amber-50';
                          if (status === 'I') colorClass = isSelected ? 'bg-blue-500 text-white border-blue-500' : 'text-blue-600 border-blue-200 hover:bg-blue-50';
                          if (status === 'A') colorClass = isSelected ? 'bg-rose-500 text-white border-rose-500' : 'text-rose-600 border-rose-200 hover:bg-rose-50';

                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(student.id, status)}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border font-bold text-xs sm:text-sm transition-all ${colorClass}`}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end items-center">
          {saved && (
            <span className="text-emerald-600 text-sm font-medium flex items-center mr-4">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Tersimpan
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={classStudents.length === 0}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Simpan Presensi
          </button>
        </div>
      </div>
    </div>
  );
}
