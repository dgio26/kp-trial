const db = require('../config/database');

exports.getDepartemen = (req, res) => {
  const sql = 'SELECT * FROM departemen ORDER BY id ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching departments:', err);
      return res.status(500).json({ message: 'Error fetching departments', error: err.message });
    }
    res.json(results.rows);
  });
};

exports.getJabatan = (req, res) => {
  const sql = 'SELECT * FROM jabatan ORDER BY id ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching job titles:', err);
      return res.status(500).json({ message: 'Error fetching job titles', error: err.message });
    }
    res.json(results.rows);
  });
};
