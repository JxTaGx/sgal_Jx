/* backend/routes/productionRoutes.js */
const express = require('express');
const productionController = require('../controllers/productionController');
// Productions no requiere Multer

const router = express.Router();

// --- Production Routes --- (Prefijo /api/productions se añadirá en server.js)

// GET /dashboard/summary - Nueva ruta para los datos del dashboard
router.get('/dashboard/summary', productionController.getDashboardSummary); // <-- NUEVA RUTA

// POST / - Crear una nueva producción
router.post('/', productionController.createProduction);

// GET / - Obtener todas las producciones (para la lista)
router.get('/', productionController.getAllProductions);

// GET /:id - Obtener una producción específica por ID
router.get('/:id', productionController.getProductionById);

// PUT /:id - Actualizar una producción por ID
router.put('/:id', productionController.updateProduction);

// DELETE /:id - Eliminar una producción por ID
router.delete('/:id', productionController.deleteProduction);

module.exports = router;