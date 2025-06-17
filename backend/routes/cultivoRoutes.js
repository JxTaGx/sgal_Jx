/* backend/routes/cultivoRoutes.js */
const express = require('express');
const cultivoController = require('../controllers/cultivoController');
const { upload } = require('../config/multerConfig');

const router = express.Router();

// --- Rutas del Módulo Cultivo ---
// El prefijo base /api/v1/crops se define en server.js

// POST / - Crear un nuevo cultivo (con subida de foto opcional)
// El 'name' del input file debe ser 'fotografia'.
router.post('/', upload.single('fotografia'), cultivoController.createCultivo);

// GET / - Obtener todos los cultivos (ruta estandarizada desde /s)
router.get('/', cultivoController.getAllCultivos);

// GET /:id - Obtener un cultivo específico por su id_cultivo
router.get('/:id', cultivoController.getCultivoById);

// PUT /:id - Actualizar un cultivo (con subida de foto opcional)
router.put('/:id', upload.single('fotografia'), cultivoController.updateCultivo);

// DELETE /:id - Eliminar un cultivo
router.delete('/:id', cultivoController.deleteCultivo);

module.exports = router;