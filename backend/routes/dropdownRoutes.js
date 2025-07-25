const express = require('express');
const router = express.Router();
const dropdownController = require('../controllers/dropdownController');

router.get('/departemen', dropdownController.getDepartemen);
router.get('/jabatan', dropdownController.getJabatan);

module.exports = router;
