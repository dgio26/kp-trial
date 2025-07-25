const express = require('express');
const router = express.Router();
const cutiController = require('../controllers/cutiController');

router.post('/', cutiController.ajukanCuti);
router.get('/karyawan/:karyawan_id', cutiController.getPengajuanByKaryawan);
router.get('/:cuti_id', cutiController.getDetailPengajuan);
router.put('/:cuti_id', cutiController.updatePengajuan);
router.delete('/:cuti_id', cutiController.hapusPengajuan);
router.post('/:cuti_id/action', cutiController.handleCutiAction);
router.get('/dashboard-forms/:id', cutiController.getDashboardForms);
router.get('/sisa-cuti/:karyawan_id', cutiController.getSisaCuti);

module.exports = router;
