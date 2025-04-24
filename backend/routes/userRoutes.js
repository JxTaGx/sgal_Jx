/* backend/routes/userRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// --- User Routes ---

// POST /user - Registrar un nuevo usuario
router.post('/', userController.registerUser);

// Aquí añadirías otras rutas para usuarios:
// GET /user - Obtener todos los usuarios (requeriría autenticación/autorización)
// router.get('/', authMiddleware.isAdmin, userController.getUsers);

// GET /user/:id - Obtener un usuario por ID
// router.get('/:id', authMiddleware.isAuth, userController.getUserById);

// PUT /user/:id - Actualizar un usuario
// router.put('/:id', authMiddleware.isAuth, userController.updateUser);

// DELETE /user/:id - Eliminar un usuario
// router.delete('/:id', authMiddleware.isAdmin, userController.deleteUser);

module.exports = router;