const db = require('../config/database');
const bcrypt = require('bcrypt');

exports.getAllKaryawan = async (req, res) => {
  try {
    const result = await db.query('SELECT id, nama, email, departemen_id, jabatan_id FROM karyawan ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data karyawan' });
  }
};

exports.getKaryawanByDepartemen = async (req, res) => {
  const { departemenId } = req.params;
  try {
    const result = await db.query(
      `SELECT k.id, k.nama, j.nama_jabatan AS jabatan
       FROM karyawan k
       JOIN jabatan j ON k.jabatan_id = j.id
       WHERE k.departemen_id = $1 ORDER BY k.nama`,
      [departemenId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching karyawan by departemen:', error);
    res.status(500).json({ error: 'Gagal mengambil data karyawan berdasarkan departemen' });
  }
};

exports.getKaryawanById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT id, nama, email, departemen_id, jabatan_id FROM karyawan WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data karyawan' });
  }
};

exports.addKaryawan = async (req, res) => {
  const { nama, email, kata_sandi, konfirmasi_sandi, departemen_id, jabatan_id } = req.body;
  if (kata_sandi !== konfirmasi_sandi) {
    return res.status(400).json({ error: 'Konfirmasi sandi tidak sesuai' });
  }
  try {
    const hashedPassword = await bcrypt.hash(kata_sandi, 10);
    await db.query(
      `INSERT INTO karyawan (nama, email, password, departemen_id, jabatan_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [nama, email, hashedPassword, departemen_id, jabatan_id]
    );
    res.status(201).json({ message: 'Karyawan berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menambahkan karyawan', detail: error.detail });
  }
};

exports.updateKaryawan = async (req, res) => {
  const { id } = req.params;
  const { nama, email, departemen_id, jabatan_id } = req.body;
  try {
    await db.query(
      `UPDATE karyawan SET nama=$1, email=$2, departemen_id=$3, jabatan_id=$4, updated_at=NOW()
       WHERE id=$5`,
      [nama, email, departemen_id, jabatan_id, id]
    );
    res.json({ message: 'Data karyawan berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui data karyawan', detail: error.detail });
  }
};

exports.deleteKaryawan = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM karyawan WHERE id = $1', [id]);
    res.json({ message: 'Karyawan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus karyawan' });
  }
};
