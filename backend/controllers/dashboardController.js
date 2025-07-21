const db = require('../config/database');

exports.jumlahKaryawan = async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM karyawan');
    res.json({ jumlah_karyawan: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil jumlah karyawan' });
  }
};

exports.jumlahPengajuanCuti = async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM cuti');
    res.json({ jumlah_pengajuan: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil jumlah pengajuan cuti' });
  }
};

exports.pengajuanTerbaru = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, k.nama 
      FROM cuti c
      JOIN karyawan k ON c.karyawan_id = k.id 
      ORDER BY c.created_at DESC 
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pengajuan terbaru' });
  }
};
