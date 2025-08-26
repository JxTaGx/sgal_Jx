/* backend/routes/authRoutes.js */
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// --- Auth Routes ---
router.post('/login', userController.loginUser);

module.exports = router;