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
    const result = await db.query('SELECT COUNT(*) FROM pengajuan_cuti');
    res.json({ jumlah_pengajuan: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil jumlah pengajuan cuti' });
  }
};

exports.pengajuanTerbaru = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pc.*, k.nama 
      FROM pengajuan_cuti pc 
      JOIN karyawan k ON pc.id_karyawan = k.id 
      ORDER BY pc.dibuat_pada DESC 
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pengajuan terbaru' });
  }
};
