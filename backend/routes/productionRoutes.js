/* backend/routes/productionRoutes.js */
const express = require('express');
const productionController = require('../controllers/productionController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Production Routes --- (Prefijo /api/productions se añadirá en server.js)

// RF-ADMIN 29: Crear una nueva producción. (Permitido para SADMIN y ADMIN)
router.post('/', verifyToken, authorize(['SADMIN', 'ADMIN']), productionController.createProduction);

// RF-ADMIN 33: Listar todas las producciones. (Permitido para SADMIN y ADMIN)
router.get('/', verifyToken, authorize(['SADMIN', 'ADMIN']), productionController.getAllProductions);

// RF-ADMIN 30: Visualizar una producción. (Permitido para SADMIN y ADMIN)
router.get('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), productionController.getProductionById);

// RF-ADMIN 31: Actualizar una producción. (Permitido para SADMIN y ADMIN)
router.put('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), productionController.updateProduction);

// Eliminar una producción. (Permitido para SADMIN y ADMIN)
router.delete('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), productionController.deleteProduction);

module.exports = router;