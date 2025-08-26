/* backend/routes/cultivoRoutes.js */
const express = require('express');
const cultivoController = require('../controllers/cultivoController');
const { upload } = require('../config/multerConfig');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Cultivo Routes ---

// RF-ADMIN 17: Crear. (Permitido para SADMIN y ADMIN)
router.post('/', verifyToken, authorize(['SADMIN', 'ADMIN']), upload.single('fotografia'), cultivoController.createCultivo);

// RF-ADMIN 21: Listar. (Permitido para SADMIN, ADMIN, VTE)
router.get('/s', verifyToken, authorize(['SADMIN', 'ADMIN', 'VTE']), cultivoController.getAllCultivos);

// RF-ADMIN 18: Obtener uno. (Permitido para SADMIN, ADMIN, VTE)
router.get('/:id', verifyToken, authorize(['SADMIN', 'ADMIN', 'VTE']), cultivoController.getCultivoById);

// RF-ADMIN 19: Actualizar. (Permitido para SADMIN y ADMIN)
router.put('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), upload.single('fotografia'), cultivoController.updateCultivo);

// RF-ADMIN 20: Eliminar. (Permitido para SADMIN y ADMIN)
router.delete('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), cultivoController.deleteCultivo);

module.exports = router;