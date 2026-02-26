/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { JournalForm } from './components/JournalForm';
import { History } from './components/History';
import { Penilaian } from './components/Penilaian';
import { Students } from './components/Students';
import { Login } from './components/Login';
import { Akun } from './components/Akun';
import { Monitoring } from './components/Monitoring';
import { useJournals } from './hooks/useJournals';
import { useStudents } from './hooks/useStudents';
import { useUsers } from './hooks/useUsers';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('jurnal-guru-current-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { journals, addJournal, updateJournal, deleteJournal } = useJournals();
  const { students, addStudent, addStudents, deleteStudent, deleteClass } = useStudents();
  const { users, addUser, updateUser, deleteUser } = useUsers();

  useEffect(() => {
    if (user) {
      localStorage.setItem('jurnal-guru-current-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('jurnal-guru-current-user');
    }
  }, [user]);

  // Set default tab based on role when user changes
  useEffect(() => {
    if (user) {
      setActiveTab(user.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    }
  }, [user]);

  // Get unique classes from students
  const classes = Array.from(new Set(students.map(s => s.className))).sort() as string[];

  const handleAddJournal = (entry: any) => {
    addJournal({
      ...entry,
      teacherId: user!.id,
      teacherName: user!.name,
    });
    setActiveTab('history');
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  // Filter journals for guru (only their own)
  const guruJournals = journals.filter(j => j.teacherId === user.id);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={handleLogout}>
      {/* Guru Routes */}
      {user.role === 'guru' && (
        <>
          {activeTab === 'dashboard' && (
            <Dashboard journals={guruJournals} onNavigate={setActiveTab} />
          )}
          {activeTab === 'add' && (
            <JournalForm 
              onSubmit={handleAddJournal} 
              onCancel={() => setActiveTab('dashboard')}
              classes={classes}
              students={students}
            />
          )}
          {activeTab === 'penilaian' && (
            <Penilaian 
              students={students} 
              journals={guruJournals} 
              onUpdateJournal={updateJournal} 
            />
          )}
          {activeTab === 'students' && (
            <Students 
              students={students} 
              onAdd={addStudent} 
              onAddStudents={addStudents}
              onDelete={deleteStudent} 
              onDeleteClass={deleteClass}
            />
          )}
          {activeTab === 'history' && (
            <History journals={guruJournals} onDelete={deleteJournal} />
          )}
        </>
      )}

      {/* Admin Routes */}
      {user.role === 'admin' && (
        <>
          {activeTab === 'admin-dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col space-y-1">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h2>
                <p className="text-slate-500">Selamat datang, {user.name}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Guru</h3>
                  <p className="text-3xl font-black text-slate-900">{users.filter(u => u.role === 'guru').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Jurnal</h3>
                  <p className="text-3xl font-black text-slate-900">{journals.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Siswa</h3>
                  <p className="text-3xl font-black text-slate-900">{students.length}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'monitoring' && (
            <Monitoring journals={journals} />
          )}
          {activeTab === 'akun' && (
            <Akun 
              users={users} 
              onAdd={addUser} 
              onUpdate={updateUser} 
              onDelete={deleteUser} 
            />
          )}
        </>
      )}
    </Layout>
  );
}

