/* backend/controllers/userController.js */
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importar el pool de la configuración

// Registrar un nuevo usuario
async function registerUser(req, res) {
    const { documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail } = req.body;

    // Validaciones básicas (puedes moverlas a un middleware de validación si prefieres)
    if (!documentType || !documentNumber || !userType || !firstName || !lastName || !phone || !password || !email || !confirmEmail) {
        return res.status(400).json({ success: false, error: "Todos los campos son obligatorios" });
    }
    if (email !== confirmEmail) {
        return res.status(400).json({ success: false, error: "Los correos electrónicos no coinciden" });
    }
    // Añadir más validaciones si es necesario (longitud, formato, etc.)

    try {
        // Verificar si el usuario (documento o email) ya existe
        const checkSql = "SELECT id FROM user WHERE documentNumber = ? OR email = ?";
        const [existingUsers] = await db.pool.query(checkSql, [documentNumber, email]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, error: "El número de documento o correo electrónico ya está registrado." }); // 409 Conflict
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10); // Usar salt rounds (e.g., 10)

        // Insertar el nuevo usuario
        const insertSql = "INSERT INTO user (documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await db.pool.query(insertSql, [documentType, documentNumber, userType, firstName, lastName, phone, hashedPassword, email, confirmEmail]);

        res.status(201).json({ success: true, message: "Usuario registrado exitosamente", id: result.insertId });

    } catch (error) {
        console.error("Error registrando usuario:", error);
        res.status(500).json({ success: false, error: "Error interno del servidor al registrar usuario", details: error.message });
    }
}

// Aquí podrías añadir más funciones para login, obtener usuarios, actualizar, eliminar, etc.
// async function loginUser(req, res) { ... }
// async function getUsers(req, res) { ... }
// async function getUserById(req, res) { ... }
// async function updateUser(req, res) { ... }
// async function deleteUser(req, res) { ... }

module.exports = {
    registerUser,
    // Exporta las otras funciones que añadas
};