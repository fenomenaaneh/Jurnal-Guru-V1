import { useState, useEffect, useCallback } from 'react';
import { redis } from '../lib/redis';
import { v4 as uuidv4 } from 'uuid';

// Satu baris mapel dalam satu kelas
export type MapelKelas = {
  id: string;
  namaMapel: string;      // dari DAFTAR_MAPEL
  jamPerMinggu: number;   // total jam per minggu (mis. 4 = 2x pertemuan × 2 jam)
  pertemuanPerMinggu: number; // berapa kali pertemuan/minggu (1 atau 2)
};

// Satu kelas dengan daftar mapel yang diajar guru di kelas itu
export type KelasItem = {
  id: string;
  namaKelas: string;
  mapel: MapelKelas[];
};

// Semua tugas satu guru (kumpulan kelas)
export type TugasGuru = {
  guruId: string;
  guruName: string;
  kelas: KelasItem[];
};

const STORAGE_KEY = 'jurnal-guru:tugas';

export function useTugas() {
  const [tugasList, setTugasList] = useState<TugasGuru[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    redis.get<TugasGuru[]>(STORAGE_KEY)
      .then(data => {
        if (!cancelled) {
          // Migrasi: buang data lama yang tidak punya field `kelas` (struktur lama pakai `mapel`)
          const valid = (data ?? []).filter(t => Array.isArray(t.kelas));
          setTugasList(valid);
          // Jika ada data yang dibuang, persist data yang sudah bersih
          if (data && valid.length !== data.length) {
            redis.set(STORAGE_KEY, valid).catch(console.error);
          }
          setError(null);
        }
      })
      .catch(err => {
        if (!cancelled) { console.error('[useTugas]', err); setError('Gagal memuat data tugas.'); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback(async (updated: TugasGuru[]) => {
    try { await redis.set(STORAGE_KEY, updated); }
    catch (err) { console.error('[useTugas] Gagal simpan:', err); setError('Gagal menyimpan data tugas.'); }
  }, []);

  const setTugasGuru = useCallback((guruId: string, guruName: string, kelas: KelasItem[]) => {
    setTugasList(prev => {
      const exists  = prev.find(t => t.guruId === guruId);
      const updated = exists
        ? prev.map(t => t.guruId === guruId ? { ...t, guruName, kelas } : t)
        : [...prev, { guruId, guruName, kelas }];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const getTugasGuru = useCallback(
    (guruId: string): TugasGuru | undefined => tugasList.find(t => t.guruId === guruId),
    [tugasList]
  );

  const deleteTugasGuru = useCallback((guruId: string) => {
    setTugasList(prev => {
      const updated = prev.filter(t => t.guruId !== guruId);
      persist(updated);
      return updated;
    });
  }, [persist]);

  return { tugasList, loading, error, setTugasGuru, getTugasGuru, deleteTugasGuru, newId: () => uuidv4() };
}