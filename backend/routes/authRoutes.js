/* backend/routes/authRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// --- Auth Routes ---
router.post('/login', userController.loginUser);

// --- Password Recovery Routes ---
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);


module.exports = router;