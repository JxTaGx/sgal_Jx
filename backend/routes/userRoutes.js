/* backend/routes/userRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- User Routes ---

// RF-SADMIN 02: Solo el Súper Administrador puede crear usuarios.
router.post('/', verifyToken, authorize(['SADMIN']), userController.registerUser);

// RF-SADMIN 06 y RF-ADMIN 02: Listar usuarios para SADMIN y ADMIN.
// (Asumimos que la misma función de controlador puede listar usuarios).
// Se necesita una función en userController para esto, por ahora protegemos la ruta.
// router.get('/', verifyToken, authorize(['SADMIN', 'ADMIN']), userController.getAllUsers);

module.exports = router;