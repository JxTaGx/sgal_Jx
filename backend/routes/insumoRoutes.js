/* backend/routes/insumoRoutes.js */
const express = require('express');
const insumoController = require('../controllers/insumoController');
// Insumos no parece requerir Multer

const router = express.Router();

// --- Insumo Routes ---

// POST / - Crear un nuevo insumo
// Si `insumoRoutes` se monta en `/api/insumos`, esta ruta será `POST /api/insumos`
router.post('/', insumoController.createInsumo);

// GET / - Obtener todos los insumos
// Si `insumoRoutes` se monta en `/api/insumos`, esta ruta será `GET /api/insumos`
router.get('/', insumoController.getAllInsumos);

// GET /buscar - Buscar insumos por término
// Si `insumoRoutes` se monta en `/api/insumos`, esta ruta será `GET /api/insumos/buscar`
router.get('/buscar', insumoController.searchInsumos); // Nota: '/buscar' antes de '/:id'

// GET /:id - Obtener un insumo por ID (PK autoincremental)
// Si `insumoRoutes` se monta en `/api/insumos`, esta ruta será `GET /api/insumos/:id`
router.get('/:id', insumoController.getInsumoById);

// PUT /:id - Actualizar un insumo por ID (PK autoincremental)
// Si `insumoRoutes` se monta en `/api/insumos`, esta ruta será `PUT /api/insumos/:id`
router.put('/:id', insumoController.updateInsumo);

// DELETE /:id - Eliminar un insumo por ID (PK autoincremental)
// Si `insumoRoutes` se monta en `/api/insumos`, esta ruta será `DELETE /api/insumos/:id`
router.delete('/:id', insumoController.deleteInsumo);

module.exports = router;