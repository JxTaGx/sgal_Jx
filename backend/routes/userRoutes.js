/* backend/routes/userRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');
const { userValidationRules, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// --- User Routes ---

// RF-SADMIN 02: Corregido. Solo el Súper Administrador puede crear usuarios.
router.post('/', verifyToken, authorize(['SADMIN']), userValidationRules(), handleValidationErrors, userController.registerUser);

// RF-SADMIN 06 y RF-ADMIN 02: Listar usuarios para SADMIN y ADMIN.
router.get('/', verifyToken, authorize(['SADMIN', 'ADMIN']), userController.getAllUsers);

// Visualizar un usuario por ID (Permitido para SADMIN y ADMIN)
router.get('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), userController.getUserById);

// RF-SADMIN 04 & RF-ADMIN 03: Actualizar un usuario.
router.put('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), userValidationRules(), handleValidationErrors, userController.updateUser);

// RF-SADMIN 05: Eliminar un usuario (Solo SADMIN).
router.delete('/:id', verifyToken, authorize(['SADMIN']), userController.deleteUser);


module.exports = router;