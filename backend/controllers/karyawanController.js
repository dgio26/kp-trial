const db = require('../config/database');
const bcrypt = require('bcrypt');

exports.getAllKaryawan = async (req, res) => {
  try {
    const result = await db.query('SELECT id, nama, email, departemen, jabatan, peran FROM karyawan ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data karyawan' });
  }
};

exports.getKaryawanById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT id, nama, email, departemen, jabatan, peran FROM karyawan WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data karyawan' });
  }
};

exports.addKaryawan = async (req, res) => {
  const { nama, email, kata_sandi, konfirmasi_sandi, departemen, jabatan, peran } = req.body;
  if (kata_sandi !== konfirmasi_sandi) {
    return res.status(400).json({ error: 'Konfirmasi sandi tidak sesuai' });
  }
  try {
    const hashedPassword = await bcrypt.hash(kata_sandi, 10);
    await db.query(
      `INSERT INTO karyawan (nama, email, kata_sandi, departemen, jabatan, peran)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nama, email, hashedPassword, departemen, jabatan, peran || 'karyawan']
    );
    res.status(201).json({ message: 'Karyawan berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menambahkan karyawan', detail: error.detail });
  }
};

exports.updateKaryawan = async (req, res) => {
  const { id } = req.params;
  const { nama, email, departemen, jabatan, peran } = req.body;
  try {
    await db.query(
      `UPDATE karyawan SET nama=$1, email=$2, departemen=$3, jabatan=$4, peran=$5, diperbarui_pada=NOW()
       WHERE id=$6`,
      [nama, email, departemen, jabatan, peran, id]
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
