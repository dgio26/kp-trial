const express = require('express');
const router = express.Router();
const cutiController = require('../controllers/cutiController');

router.post('/', cutiController.ajukanCuti);
router.get('/karyawan/:karyawan_id', cutiController.getPengajuanByKaryawan);
router.get('/:cuti_id', cutiController.getDetailPengajuan);
router.put('/:cuti_id', cutiController.updatePengajuan);
router.delete('/:cuti_id', cutiController.hapusPengajuan);
router.post('/:cuti_id/action', cutiController.handleCutiAction); // New route for approve/reject
router.get('/dashboard-forms/:id', cutiController.getDashboardForms); // New route for fetching dashboard forms

module.exports = router;
