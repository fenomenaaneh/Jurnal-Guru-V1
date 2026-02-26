import { useState, useEffect } from 'react';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'jurnal-guru-users';

const defaultUsers: User[] = [
  { id: '1', username: 'admin', password: 'password', name: 'Administrator', role: 'admin' },
  { id: '2', username: 'guru1', password: 'password', name: 'Guru Pengajar', role: 'guru' },
];

export function useUsers() {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse users from local storage', e);
        return defaultUsers;
      }
    }
    return defaultUsers;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const addUser = (user: Omit<User, 'id'>) => {
    setUsers((prev) => [...prev, { ...user, id: uuidv4() }]);
  };

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updatedUser } : user))
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
  };
}
