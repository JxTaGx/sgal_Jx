/* backend/routes/cicloCultivoRoutes.js */
const express = require('express');
const cicloCultivoController = require('../controllers/cicloCultivoController');
const { upload } = require('../config/multerConfig');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Ciclo Cultivo Routes ---

// RF-ADMIN 23: Crear. (Permitido para SADMIN y ADMIN)
router.post('/', verifyToken, authorize(['SADMIN', 'ADMIN']), upload.single('fotografia'), cicloCultivoController.createCicloCultivo);

// RF-ADMIN 27: Listar. (Permitido para SADMIN, ADMIN, VTE)
router.get('/', verifyToken, authorize(['SADMIN', 'ADMIN', 'VTE']), cicloCultivoController.getAllCiclosCultivo);

// RF-ADMIN 24: Visualizar. (Permitido para SADMIN, ADMIN, VTE)
router.get('/:id', verifyToken, authorize(['SADMIN', 'ADMIN', 'VTE']), cicloCultivoController.getCicloCultivoById);

// RF-ADMIN 25: Actualizar. (Permitido para SADMIN y ADMIN)
router.put('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), upload.single('fotografia'), cicloCultivoController.updateCicloCultivo);

// RF-ADMIN 26: Eliminar. (Permitido para SADMIN y ADMIN)
router.delete('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), cicloCultivoController.deleteCicloCultivo);

module.exports = router;