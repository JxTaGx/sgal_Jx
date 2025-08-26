/* backend/routes/insumoRoutes.js */
const express = require('express');
const insumoController = require('../controllers/insumoController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Insumo Routes ---

// RF-ADMIN 11: Crear. (Permitido para SADMIN y ADMIN)
router.post('/', verifyToken, authorize(['SADMIN', 'ADMIN']), insumoController.createInsumo);

// RF-ADMIN 15: Listar. (Permitido para SADMIN y ADMIN)
router.get('/api/insumos', verifyToken, authorize(['SADMIN', 'ADMIN']), insumoController.getAllInsumos);
router.get('/', verifyToken, authorize(['SADMIN', 'ADMIN']), insumoController.getAllInsumos);

// Buscar. (Permitido para SADMIN y ADMIN)
router.get('/buscar', verifyToken, authorize(['SADMIN', 'ADMIN']), insumoController.searchInsumos);

// RF-ADMIN 12: Visualizar. (Permitido para SADMIN y ADMIN)
router.get('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), insumoController.getInsumoById);

// RF-ADMIN 13: Actualizar. (Permitido para SADMIN y ADMIN)
router.put('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), insumoController.updateInsumo);

// RF-ADMIN 14: Eliminar. (Permitido para SADMIN y ADMIN)
router.delete('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), insumoController.deleteInsumo);

module.exports = router;