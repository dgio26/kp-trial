const db = require('../config/database');
const bcrypt = require('bcrypt');

exports.getAllKaryawan = async (req, res) => {
  try {
    const result = await db.query('SELECT id, nama, email, departemen_id, jabatan_id, sisa_cuti FROM karyawan ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data karyawan' });
  }
};

exports.getKaryawanByDepartemen = async (req, res) => {
  const { departemenId } = req.params;
  try {
    const result = await db.query(
      `SELECT k.id, k.nama, j.nama_jabatan, k.sisa_cuti AS jabatan
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
    const result = await db.query('SELECT id, nama, email, departemen_id, jabatan_id, sisa_cuti FROM karyawan WHERE id = $1', [id]);
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
      `INSERT INTO karyawan (nama, email, password, departemen_id, jabatan_id, sisa_cuti)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nama, email, hashedPassword, departemen_id, jabatan_id, sisa_cuti]
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
      `UPDATE karyawan SET nama=$1, email=$2, departemen_id=$3, jabatan_id=$4, sisa_cuti=$6, updated_at=NOW()
       WHERE id=$5`,
      [nama, email, departemen_id, jabatan_id, id, sisa_cuti]
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

exports.updateSisaCuti = async (req, res) => {
  const { id } = req.params;
  const { sisa_cuti, reason } = req.body;
  
  try {
    // First check if karyawan exists
    const checkResult = await db.query('SELECT nama, sisa_cuti FROM karyawan WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }

    const oldBalance = checkResult.rows[0].sisa_cuti;
    
    const result = await db.query(
      `UPDATE karyawan 
       SET sisa_cuti = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING nama, sisa_cuti`,
      [sisa_cuti, id]
    );
    
    console.log(`Leave balance updated for ${result.rows[0].nama}: ${oldBalance} → ${sisa_cuti}. Reason: ${reason || 'Manual adjustment'}`);
    
    res.json({ 
      message: `Sisa cuti ${result.rows[0].nama} berhasil diperbarui`,
      data: {
        nama: result.rows[0].nama,
        old_balance: oldBalance,
        new_balance: result.rows[0].sisa_cuti
      }
    });
  } catch (error) {
    console.error('Error in updateSisaCuti:', error);
    res.status(500).json({ error: 'Gagal memperbarui sisa cuti karyawan' });
  }
};
