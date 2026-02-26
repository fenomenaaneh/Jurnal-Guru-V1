import { useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'jurnal-guru-data';

export function useJournals() {
  const [journals, setJournals] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse journals from local storage', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
  }, [journals]);

  const addJournal = (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setJournals((prev) => [newEntry, ...prev]);
  };

  const updateJournal = (id: string, updatedEntry: Partial<JournalEntry>) => {
    setJournals((prev) =>
      prev.map((journal) => (journal.id === id ? { ...journal, ...updatedEntry } : journal))
    );
  };

  const deleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((journal) => journal.id !== id));
  };

  return {
    journals,
    addJournal,
    updateJournal,
    deleteJournal,
  };
}
