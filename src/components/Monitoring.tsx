import { useState } from 'react';
import { JournalEntry } from '../types';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookOpen, Calendar, Clock, Users, Search, Filter } from 'lucide-react';
import { Student } from '../hooks/useStudents';

type MonitoringProps = {
  journals: JournalEntry[];
  students: Student[];
};

export function Monitoring({ journals, students }: MonitoringProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const teachers = Array.from(new Set(journals.map(j => j.teacherName || 'Guru Tidak Diketahui'))).sort();

  const filteredJournals = journals.filter(journal => {
    const matchesSearch = (journal.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (journal.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (journal.className || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeacher = selectedTeacher ? (journal.teacherName || 'Guru Tidak Diketahui') === selectedTeacher : true;

    return matchesSearch && matchesTeacher;
  });

  const getStudentNamesByStatus = (journal: JournalEntry, status: 'sick' | 'permission' | 'absent') => {
    if (!journal.studentAttendance) return [];
    
    return Object.entries(journal.studentAttendance)
      .filter(([_, studentStatus]) => studentStatus === status)
      .map(([studentId, _]) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : 'Siswa Tidak Diketahui';
      });
  };

  const getAbsentNames = (journal: JournalEntry) => {
    if (journal.studentAttendance) {
      return getStudentNamesByStatus(journal, 'absent');
    }
    return journal.absentStudentNames ? journal.absentStudentNames.split(',').map(s => s.trim()).filter(Boolean) : [];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Jurnal</h2>
        <p className="text-slate-500">Pantau jurnal pembelajaran yang diinput oleh semua guru.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari berdasarkan mata pelajaran atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="relative sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none bg-white"
          >
            <option value="">Semua Guru</option>
            {teachers.map(teacher => (
              <option key={teacher} value={teacher}>{teacher}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredJournals.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium text-lg">Tidak ada jurnal ditemukan.</p>
            </div>
          ) : (
            filteredJournals.map((journal) => {
              const sickStudents = getStudentNamesByStatus(journal, 'sick');
              const permissionStudents = getStudentNamesByStatus(journal, 'permission');
              const absentStudents = getAbsentNames(journal);
              const hasAbsences = sickStudents.length > 0 || permissionStudents.length > 0 || absentStudents.length > 0;

              return (
                <div key={journal.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        {format(parseISO(journal.date), 'MMM', { locale: id })}
                      </span>
                      <span className="text-2xl font-black text-indigo-700 leading-none mt-1">
                        {format(parseISO(journal.date), 'dd')}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-500 mt-1">
                        {format(parseISO(journal.date), 'yyyy')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                              {journal.className}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{journal.subject}</span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mt-1">{journal.teacherName || 'Guru Tidak Diketahui'}</h4>
                          <p className="text-sm text-slate-600 mt-1 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            Jam ke {journal.startTime} s/d {journal.endTime}
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Kehadiran</h5>
                            <div className="flex space-x-3 text-center">
                              <div>
                                <span className="block text-[10px] text-emerald-600 font-bold">H</span>
                                <span className="block text-sm font-black text-emerald-700">{journal.attendance.present}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-amber-600 font-bold">S</span>
                                <span className="block text-sm font-black text-amber-700">{journal.attendance.sick}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-blue-600 font-bold">I</span>
                                <span className="block text-sm font-black text-blue-700">{journal.attendance.permission}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-rose-600 font-bold">A</span>
                                <span className="block text-sm font-black text-rose-700">{journal.attendance.absent}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Topik Pembelajaran</h5>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{journal.topic}</p>
                      </div>

                      {hasAbsences && (
                        <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detail Ketidakhadiran</h5>
                          <div className="space-y-2">
                            {sickStudents.length > 0 && (
                              <div className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold mr-2 flex-shrink-0">S</span>
                                <span className="text-sm text-slate-700">{sickStudents.join(', ')}</span>
                              </div>
                            )}
                            {permissionStudents.length > 0 && (
                              <div className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold mr-2 flex-shrink-0">I</span>
                                <span className="text-sm text-slate-700">{permissionStudents.join(', ')}</span>
                              </div>
                            )}
                            {absentStudents.length > 0 && (
                              <div className="flex items-start">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold mr-2 flex-shrink-0">A</span>
                                <span className="text-sm text-slate-700">{absentStudents.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {journal.photoUrl && (
                        <div className="mt-4">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Foto Pembelajaran</h5>
                          <div className="rounded-xl overflow-hidden border border-slate-200">
                            <img src={journal.photoUrl} alt="Foto Pembelajaran" className="w-full h-auto max-h-96 object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
