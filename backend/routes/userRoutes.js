/* backend/routes/userRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// --- User Routes ---
// El prefijo base (/api/v1/users) se define en server.js

// POST / - Registrar un nuevo usuario
router.post('/', userController.registerUser);

// GET / - Obtener todos los usuarios
router.get('/', userController.getAllUsers);

// GET /:id - Obtener un usuario por ID
router.get('/:id', userController.getUserById);

// PUT /:id - Actualizar un usuario por ID
router.put('/:id', userController.updateUser);

// DELETE /:id - (Pendiente) Eliminar un usuario
// router.delete('/:id', authMiddleware.isAdmin, userController.deleteUser);

module.exports = router;