/* backend/routes/sensorRoutes.js */
const express = require('express');
const sensorController = require('../controllers/sensorController');
const { upload } = require('../config/multerConfig');

const router = express.Router();

// --- Rutas del Módulo Sensor ---
// El prefijo base /api/v1/sensors se define en server.js

// POST / - Crear un nuevo sensor (con subida de foto opcional)
router.post('/', upload.single('fotografia'), sensorController.createSensor);

// GET / - Obtener todos los sensores (ruta estandarizada desde /s)
router.get('/', sensorController.getAllSensores);

// GET /search - Buscar sensores por término de búsqueda (ruta estandarizada desde /buscar)
// Debe definirse antes de /:id para evitar que "search" sea interpretado como un ID.
router.get('/search', sensorController.searchSensores);

// GET /:id - Obtener un sensor por su ID (PK autoincremental)
router.get('/:id', sensorController.getSensorById);

// PUT /:id - Actualizar un sensor (con subida de foto opcional)
router.put('/:id', upload.single('fotografia'), sensorController.updateSensor);

// DELETE /:id - Eliminar un sensor
router.delete('/:id', sensorController.deleteSensor);

module.exports = router;