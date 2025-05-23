/* backend/routes/userRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');
// const authMiddleware = require('../middlewares/authMiddleware'); // Descomentar si se implementa autenticación

const router = express.Router();

// --- User Routes ---

// POST /user - Registrar un nuevo usuario
router.post('/', userController.registerUser);

// GET /user - Obtener todos los usuarios
// Ejemplo con middleware de autorización (si lo tuvieras): router.get('/', authMiddleware.isAdmin, userController.getAllUsers);
router.get('/', userController.getAllUsers);

// GET /user/:id - Obtener un usuario por ID
// Ejemplo con middleware de autorización: router.get('/:id', authMiddleware.isAuth, userController.getUserById);
router.get('/:id', userController.getUserById);

// PUT /user/:id - Actualizar un usuario
// Ejemplo con middleware de autorización: router.put('/:id', authMiddleware.isAuth, userController.updateUser);
router.put('/:id', userController.updateUser);

// DELETE /user/:id - Eliminar un usuario (puedes añadir esto luego si es necesario)
// router.delete('/:id', authMiddleware.isAdmin, userController.deleteUser);

module.exports = router;