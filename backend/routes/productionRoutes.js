/* backend/routes/productionRoutes.js */
const express = require('express');
const productionController = require('../controllers/productionController');
// Productions no requiere Multer

const router = express.Router();

// --- Production Routes --- (Prefijo /api/productions se añadirá en server.js)

// POST / - Crear una nueva producción
router.post('/', productionController.createProduction);

// GET / - Obtener todas las producciones
router.get('/', productionController.getAllProductions);

// GET /:id - Obtener una producción específica por ID (PK numérico)
router.get('/:id', productionController.getProductionById);

// PUT /:id - Actualizar una producción por ID (PK numérico)
router.put('/:id', productionController.updateProduction);

// DELETE /:id - Eliminar una producción por ID (PK numérico)
router.delete('/:id', productionController.deleteProduction);

module.exports = router;