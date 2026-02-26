import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { Save, X, Calendar, Clock, BookOpen, Users, FileText } from 'lucide-react';

type JournalFormProps = {
  onSubmit: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  classes: string[];
};

export function JournalForm({ onSubmit, onCancel, classes }: JournalFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '08:30',
    className: classes.length > 0 ? classes[0] : '',
    subject: '',
    topic: '',
    notes: '',
  });

  const [attendance, setAttendance] = useState({
    present: 30,
    sick: 0,
    permission: 0,
    absent: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttendanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAttendance((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className) {
      alert('Silakan pilih atau buat kelas terlebih dahulu di menu Data Siswa.');
      return;
    }
    onSubmit({
      ...formData,
      attendance,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
          Isi Jurnal Baru
        </h2>
        <button 
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Waktu & Kelas */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            Waktu & Kelas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mulai</label>
                <input
                  type="time"
                  name="startTime"
                  required
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Selesai</label>
                <input
                  type="time"
                  name="endTime"
                  required
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Kelas</label>
              <select
                name="className"
                required
                value={formData.className}
                onChange={handleChange}
                disabled={classes.length === 0}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 appearance-none disabled:opacity-50"
              >
                {classes.length > 0 ? (
                  classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))
                ) : (
                  <option value="">Belum ada kelas</option>
                )}
              </select>
              {classes.length === 0 && (
                <p className="mt-1 text-xs text-rose-500">Silakan tambahkan kelas di menu Data Siswa.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mata Pelajaran</label>
              <input
                type="text"
                name="subject"
                required
                placeholder="Contoh: Matematika"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Materi */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <FileText className="w-4 h-4 mr-2 text-slate-400" />
            Materi Pembelajaran
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Topik / Materi</label>
            <textarea
              name="topic"
              required
              rows={3}
              placeholder="Jelaskan materi yang diajarkan hari ini..."
              value={formData.topic}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 resize-none"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Kehadiran */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <Users className="w-4 h-4 mr-2 text-slate-400" />
            Kehadiran Siswa
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <label className="block text-sm font-medium text-emerald-800 mb-2">Hadir</label>
              <input
                type="number"
                name="present"
                min="0"
                value={attendance.present}
                onChange={handleAttendanceChange}
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-emerald-900 font-bold"
              />
            </div>
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
              <label className="block text-sm font-medium text-amber-800 mb-2">Sakit</label>
              <input
                type="number"
                name="sick"
                min="0"
                value={attendance.sick}
                onChange={handleAttendanceChange}
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-amber-900 font-bold"
              />
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-medium text-blue-800 mb-2">Izin</label>
              <input
                type="number"
                name="permission"
                min="0"
                value={attendance.permission}
                onChange={handleAttendanceChange}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-blue-900 font-bold"
              />
            </div>
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
              <label className="block text-sm font-medium text-rose-800 mb-2">Alpa</label>
              <input
                type="number"
                name="absent"
                min="0"
                value={attendance.absent}
                onChange={handleAttendanceChange}
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors text-rose-900 font-bold"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Catatan */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <FileText className="w-4 h-4 mr-2 text-slate-400" />
            Catatan Tambahan
          </h3>
          <div>
            <textarea
              name="notes"
              rows={2}
              placeholder="Catatan khusus, evaluasi, atau kejadian penting..."
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 resize-none"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={classes.length === 0}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Simpan Jurnal
          </button>
        </div>
      </form>
    </div>
  );
}
