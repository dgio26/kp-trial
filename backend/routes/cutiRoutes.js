const express = require('express');
const router = express.Router();
const cutiController = require('../controllers/cutiController');

router.post('/', cutiController.ajukanCuti);
router.get('/karyawan/:id', cutiController.getPengajuanByKaryawan);
router.get('/:id', cutiController.getDetailPengajuan);
router.put('/:id', cutiController.updatePengajuan);
router.post('/:id/action', cutiController.handleCutiAction); // New route for approve/reject
router.delete('/:id', cutiController.hapusPengajuan);
router.get('/dashboard-forms/:id', cutiController.getDashboardForms); // New route for fetching dashboard forms

module.exports = router;
