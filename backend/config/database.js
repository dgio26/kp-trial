const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

pool.connect();

// pool.query('Select * from karyawan', (err, res) => {
//   if (err) {
//     console.error('Error executing query', err.stack);
//   } else {
//     console.log('Connected to the database');
//     console.log('Hasil query:', res.rows);
//   }
//   pool.end();
// })

module.exports = pool;
