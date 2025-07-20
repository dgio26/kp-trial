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
const dropdownRoutes = require('./routes/dropdownRoutes'); // Import dropdown routes

app.use('/api/auth', authRoutes);
app.use('/api/karyawan', karyawanRoutes);
app.use('/api/cuti', cutiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', dropdownRoutes); // Use dropdown routes

// Jalankan server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
