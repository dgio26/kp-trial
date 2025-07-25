const db = require('../config/database');
const bcrypt = require('bcrypt');

// Controller untuk Register
exports.register = async (req, res) => {
    const { nama, email, departemen, jabatan, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Password dan konfirmasi password tidak cocok' });
  }

  try {
    // Cek apakah email sudah digunakan
    const existing = await db.query('SELECT * FROM karyawan WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email sudah digunakan' });
    }

    // Ambil ID departemen dan jabatan berdasarkan nama
    const departemenResult = await db.query('SELECT id FROM departemen WHERE nama_departemen = $1', [departemen]);
    const jabatanResult = await db.query('SELECT id FROM jabatan WHERE nama_jabatan = $1', [jabatan]);

    if (departemenResult.rows.length === 0) {
        return res.status(400).json({ error: 'Departemen tidak valid' });
    }
    if (jabatanResult.rows.length === 0) {
        return res.status(400).json({ error: 'Jabatan tidak valid' });
    }

    const departemenId = departemenResult.rows[0].id;
    const jabatanId = jabatanResult.rows[0].id;

    // Enkripsi kata sandi
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan data ke tabel karyawan menggunakan ID
    const result = await db.query(
      `INSERT INTO karyawan (nama, email, password, departemen_id, jabatan_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [nama, email, hashedPassword, departemenId, jabatanId]
    );

    const idKaryawan = result.rows[0].id;

    res.status(201).json({ message: 'Pendaftaran berhasil' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Gagal mendaftar', detail: error.message });
  }
};

// Controller untuk Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cek apakah user ada dan ambil ID departemen/jabatan
    const result = await db.query(
      `SELECT k.*, d.nama_departemen, j.nama_jabatan
       FROM karyawan k
       LEFT JOIN departemen d ON k.departemen_id = d.id
       LEFT JOIN jabatan j ON k.jabatan_id = j.id
       WHERE k.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email tidak ditemukan' });
    }

    const user = result.rows[0];

    // Bandingkan password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Password salah' });
    }

    // Kirim data user dengan nama departemen dan jabatan
    res.status(200).json({
      message: 'Login berhasil',
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        departemen: user.nama_departemen,
        jabatan: user.nama_jabatan,
        departemen_id: user.departemen_id,
        jabatan_id: user.jabatan_id
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat login', detail: error.message });
  }
};
