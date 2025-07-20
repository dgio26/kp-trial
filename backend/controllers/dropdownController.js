const db = require('../config/database'); // Assuming you have a database connection setup

exports.getDepartemen = (req, res) => {
    const sql = 'SELECT * FROM departemen';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching departments:', err);
            return res.status(500).json({ message: 'Error fetching departments', error: err.message });
        }
        res.json(results);
    });
};

exports.getJabatan = (req, res) => {
    const sql = 'SELECT * FROM jabatan';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching job titles:', err);
            return res.status(500).json({ message: 'Error fetching job titles', error: err.message });
        }
        res.json(results);
    });
};
