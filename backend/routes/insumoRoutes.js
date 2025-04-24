/* backend/routes/insumoRoutes.js */
const express = require('express');
const insumoController = require('../controllers/insumoController');
// Insumos no parece requerir Multer

const router = express.Router();

// --- Insumo Routes ---

// POST /insumo - Crear un nuevo insumo
router.post('/', insumoController.createInsumo);

// GET /api/insumos - Obtener todos los insumos (Ruta específica usada por frontend)
router.get('/api/insumos', insumoController.getAllInsumos);

router.get('/', insumoController.getAllInsumos); // <--- Ruta relativa '/'

// GET /insumo/buscar - Buscar insumos por término
router.get('/buscar', insumoController.searchInsumos); // Nota: '/buscar' antes de '/:id'

// GET /insumo/:id - Obtener un insumo por ID (PK autoincremental)
router.get('/:id', insumoController.getInsumoById);

// PUT /insumo/:id - Actualizar un insumo por ID (PK autoincremental)
router.put('/:id', insumoController.updateInsumo);

// DELETE /insumo/:id - Eliminar un insumo por ID (PK autoincremental)
router.delete('/:id', insumoController.deleteInsumo);

module.exports = router;