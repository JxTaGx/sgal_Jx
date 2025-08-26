/* backend/routes/integracionRoutes.js */
const express = require('express');
const integracionController = require('../controllers/integracionController');
const { verifyToken, authorize } = require('../middleware/authMiddleware'); // Importar middlewares

const router = express.Router();

// --- Integración Routes --- (Prefijo /api/integracion se añadirá en server.js)

// GET /data - Obtener datos para desplegables. (Permitido para SADMIN y ADMIN)
router.get('/data', verifyToken, authorize(['SADMIN', 'ADMIN']), integracionController.getIntegrationData);

module.exports = router;