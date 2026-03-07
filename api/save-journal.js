/**
 * api/save-journal.js  (UPDATED)
 *
 * PATCH: Saat guru mapel simpan jurnal, sistem otomatis tulis index
 * class-journals:{className} sehingga wali kelas bisa mengakses data tersebut.
 *
 * Tambahan dari versi sebelumnya:
 *   1. Simpan teacherName di dalam data jurnal (untuk ditampilkan di wali kelas)
 *   2. Tambah ref ke Set class-journals:{className}
 *   3. Hapus ref dari Set lama jika className berubah (edit jurnal)
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    teacherId,
    teacherName,   // ← WAJIB dikirim dari frontend
    journal,       // objek JournalEntry lengkap
    previousClassName, // opsional: jika edit jurnal dan className berubah
  } = req.body;

  if (!teacherId || !journal?.id || !journal?.className) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  const journalKey = `journal:${teacherId}:${journal.id}`;
  const teacherSetKey = `journals:${teacherId}`;
  const classSetKey = `class-journals:${journal.className}`;
  const ref = `${teacherId}:${journal.id}`;

  try {
    const pipeline = redis.pipeline();

    // 1. Simpan data jurnal (sertakan teacherName agar wali kelas bisa tampilkan)
    pipeline.hset(journalKey, {
      ...journal,
      teacherId,
      teacherName: teacherName ?? '',
      updatedAt: new Date().toISOString(),
    });

    // 2. Tambah ke index guru
    pipeline.sadd(teacherSetKey, journal.id);

    // 3. Tambah ke index kelas (untuk wali kelas)
    pipeline.sadd(classSetKey, ref);

    // 4. Jika edit & className berubah → hapus dari index kelas lama
    if (previousClassName && previousClassName !== journal.className) {
      const oldClassSetKey = `class-journals:${previousClassName}`;
      pipeline.srem(oldClassSetKey, ref);
    }

    await pipeline.exec();

    return res.status(200).json({ success: true, journalId: journal.id });
  } catch (err) {
    console.error('save-journal error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan jurnal' });
  }
}