/* backend/routes/integracionRoutes.js */
const express = require('express');
const integracionController = require('../controllers/integracionController');

const router = express.Router();

// --- Integración Routes --- (Prefijo /api/integracion se añadirá en server.js)

// GET /data - Obtener datos para desplegables
router.get('/data', integracionController.getIntegrationData);

module.exports = router;