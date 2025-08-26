/* backend/routes/sensorRoutes.js */
const express = require('express');
const sensorController = require('../controllers/sensorController');
const { upload } = require('../config/multerConfig');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Sensor Routes ---

// RF-ADMIN 04: Crear. (Permitido para SADMIN y ADMIN)
router.post('/', verifyToken, authorize(['SADMIN', 'ADMIN']), upload.single('fotografia'), sensorController.createSensor);

// RF-ADMIN 08: Listar. (Permitido para SADMIN, ADMIN, PAP, VTE)
router.get('/s', verifyToken, authorize(['SADMIN', 'ADMIN', 'PAP', 'VTE']), sensorController.getAllSensores);

// Buscar. (Permitido para SADMIN, ADMIN, PAP, VTE)
router.get('/buscar', verifyToken, authorize(['SADMIN', 'ADMIN', 'PAP', 'VTE']), sensorController.searchSensores);

// RF-ADMIN 05: Obtener uno. (Permitido para SADMIN, ADMIN, PAP, VTE)
router.get('/:id', verifyToken, authorize(['SADMIN', 'ADMIN', 'PAP', 'VTE']), sensorController.getSensorById);

// RF-ADMIN 06 & RF-PAP 06: Actualizar. (Permitido para SADMIN, ADMIN, PAP)
router.put('/:id', verifyToken, authorize(['SADMIN', 'ADMIN', 'PAP']), upload.single('fotografia'), sensorController.updateSensor);

// RF-ADMIN 07: Eliminar. (Permitido para SADMIN y ADMIN)
router.delete('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), sensorController.deleteSensor);

module.exports = router;