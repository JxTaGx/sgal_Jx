/* backend/routes/insumoRoutes.js */
const express = require('express');
const insumoController = require('../controllers/insumoController');

const router = express.Router();

// --- Rutas del Módulo Insumo ---
// El prefijo base /api/v1/supplies se define en server.js

// POST / - Crear un nuevo insumo
router.post('/', insumoController.createInsumo);

// GET / - Obtener todos los insumos
router.get('/', insumoController.getAllInsumos);

// GET /search - Buscar insumos por término (ruta estandarizada desde /buscar)
// Debe definirse antes de /:id
router.get('/search', insumoController.searchInsumos);

// GET /:id - Obtener un insumo por su ID (PK autoincremental)
router.get('/:id', insumoController.getInsumoById);

// PUT /:id - Actualizar un insumo por su ID (PK autoincremental)
router.put('/:id', insumoController.updateInsumo);

// DELETE /:id - Eliminar un insumo por su ID (PK autoincremental)
router.delete('/:id', insumoController.deleteInsumo);

module.exports = router;