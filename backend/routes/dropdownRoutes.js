const express = require('express');
const router = express.Router();
const dropdownController = require('../controllers/dropdownController');

// Route to get all departments
router.get('/departemen', dropdownController.getDepartemen);

// Route to get all job titles
router.get('/jabatan', dropdownController.getJabatan);

module.exports = router;
