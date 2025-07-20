const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/jumlah-karyawan', dashboardController.jumlahKaryawan);
router.get('/jumlah-pengajuan', dashboardController.jumlahPengajuanCuti);
router.get('/pengajuan-terbaru', dashboardController.pengajuanTerbaru);

module.exports = router;
