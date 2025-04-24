/* backend/routes/sensorRoutes.js */
const express = require('express');
const sensorController = require('../controllers/sensorController');
const { upload } = require('../config/multerConfig'); // Importar instancia de upload

const router = express.Router();

// --- Sensor Routes ---

// POST /sensor - Crear un nuevo sensor (con carga de foto)
router.post('/', upload.single('fotografia'), sensorController.createSensor);

// GET /sensores - Obtener todos los sensores
router.get('/s', sensorController.getAllSensores); // Usamos /s para listar todos

// GET /sensor/buscar - Buscar sensores por término
router.get('/buscar', sensorController.searchSensores); // Definir antes de /:id

// GET /sensor/:id - Obtener un sensor por ID (PK autoincremental)
router.get('/:id', sensorController.getSensorById);

// PUT /sensor/:id - Actualizar un sensor (con posible carga de foto)
router.put('/:id', upload.single('fotografia'), sensorController.updateSensor);

// DELETE /sensor/:id - Eliminar un sensor
router.delete('/:id', sensorController.deleteSensor);

module.exports = router;