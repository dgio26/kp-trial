require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const karyawanRoutes = require('./routes/karyawanRoutes');
const cutiRoutes = require('./routes/cutiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const dropdownRoutes = require('./routes/dropdownRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/karyawan', karyawanRoutes);
app.use('/api/cuti', cutiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', dropdownRoutes); // e.g., /api/departemen

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
