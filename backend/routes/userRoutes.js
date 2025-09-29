/* backend/routes/userRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');
const { userValidationRules, handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

router.post('/', 
    verifyToken, 
    authorize(['SADMIN']), 
    userValidationRules(), 
    handleValidationErrors, 
    userController.registerUser
);

router.put('/:id', 
    verifyToken, 
    authorize(['SADMIN', 'ADMIN']), 
    userValidationRules(), 
    handleValidationErrors, 
    userController.updateUser
);

// Las rutas GET y DELETE no necesitan validación del body
router.get('/', verifyToken, authorize(['SADMIN', 'ADMIN']), userController.getAllUsers);
router.get('/:id', verifyToken, authorize(['SADMIN', 'ADMIN']), userController.getUserById);
router.delete('/:id', verifyToken, authorize(['SADMIN']), userController.deleteUser);

module.exports = router;