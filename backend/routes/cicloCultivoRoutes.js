/* backend/routes/cicloCultivoRoutes.js */
const express = require('express');
const cicloCultivoController = require('../controllers/cicloCultivoController');
const { upload } = require('../config/multerConfig');

const router = express.Router();

// --- Rutas del Módulo Ciclo Cultivo ---
// El prefijo base /api/v1/cycles se define en server.js

// POST / - Crear un nuevo ciclo de cultivo (con subida de foto opcional)
// El 'name' del input file en el formulario debe ser 'fotografia'.
router.post('/', upload.single('fotografia'), cicloCultivoController.createCicloCultivo);

// GET / - Obtener todos los ciclos de cultivo
router.get('/', cicloCultivoController.getAllCiclosCultivo);

// GET /:id - Obtener un ciclo de cultivo específico por su ID
router.get('/:id', cicloCultivoController.getCicloCultivoById);

// PUT /:id - Actualizar un ciclo de cultivo (con subida de foto opcional)
router.put('/:id', upload.single('fotografia'), cicloCultivoController.updateCicloCultivo);

// DELETE /:id - Eliminar un ciclo de cultivo
router.delete('/:id', cicloCultivoController.deleteCicloCultivo);

module.exports = router;