const express = require('express');
const reportesController = require('../controllers/reportesController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:module/:format', verifyToken, authorize(['SADMIN', 'ADMIN']), reportesController.generateReport);

module.exports = router;