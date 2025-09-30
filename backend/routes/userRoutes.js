/* backend/routes/userRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');
// Importamos AMBAS reglas de validación
const { userValidationRules, userUpdateValidationRules, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

// La ruta de CREACIÓN (POST) sigue usando las reglas originales
router.post('/', 
    verifyToken, 
    authorize(['SADMIN']), 
    userValidationRules(), 
    handleValidationErrors, 
    userController.registerUser
);

// La ruta de ACTUALIZACIÓN (PUT) ahora usa las NUEVAS reglas
router.put('/:id', 
    verifyToken, 
    authorize(['SADMIN', 'ADMIN']), 
    userUpdateValidationRules(), // <-- ¡AQUÍ ESTÁ EL CAMBIO CLAVE!
    handleValidationErrors, 
    userController.updateUser
);

// Las rutas GET y DELETE se mantienen igual
router.get('/', verifyToken, authorize(['SADMIN', 'ADMIN']), userController.getAllUsers);
router.get('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), userController.getUserById);
router.delete('/:id', verifyToken, authorize(['SADMIN']), userController.deleteUser);

module.exports = router;