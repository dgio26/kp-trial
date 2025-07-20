const express = require('express');
const router = express.Router();
const karyawanController = require('../controllers/karyawanController');

router.get('/', karyawanController.getAllKaryawan);
router.get('/:id', karyawanController.getKaryawanById);
router.post('/', karyawanController.addKaryawan);
router.put('/:id', karyawanController.updateKaryawan);
router.delete('/:id', karyawanController.deleteKaryawan);

module.exports = router;
