/* backend/controllers/userController.js */
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importar el pool de la configuración

// Registrar un nuevo usuario
async function registerUser(req, res) {
    const { documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail } = req.body;

    // Validaciones básicas
    if (!documentType || !documentNumber || !userType || !firstName || !lastName || !phone || !password || !email || !confirmEmail) {
        return res.status(400).json({ success: false, error: "Todos los campos son obligatorios" });
    }
    if (email !== confirmEmail) {
        return res.status(400).json({ success: false, error: "Los correos electrónicos no coinciden" });
    }

    try {
        // Verificar si el usuario (documento o email) ya existe
        const checkSql = "SELECT id FROM user WHERE documentNumber = ? OR email = ?";
        const [existingUsers] = await db.pool.query(checkSql, [documentNumber, email]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, error: "El número de documento o correo electrónico ya está registrado." });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario
        const insertSql = "INSERT INTO user (documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await db.pool.query(insertSql, [documentType, documentNumber, userType, firstName, lastName, phone, hashedPassword, email, confirmEmail]);

        res.status(201).json({ success: true, message: "Usuario registrado exitosamente", id: result.insertId });

    } catch (error) {
        console.error("Error registrando usuario:", error);
        res.status(500).json({ success: false, error: "Error interno del servidor al registrar usuario", details: error.message });
    }
}

// Obtener todos los usuarios
async function getAllUsers(req, res) {
    try {
        // Seleccionamos campos específicos para no exponer datos sensibles como la contraseña
        const sql = "SELECT id, documentType, documentNumber, userType, firstName, lastName, phone, email, created_at, updated_at FROM user ORDER BY created_at DESC";
        const [users] = await db.pool.query(sql);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ success: false, error: "Error interno del servidor al obtener usuarios", details: error.message });
    }
}

// Obtener un usuario por su ID
async function getUserById(req, res) {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de usuario inválido." });
    }

    try {
        // De nuevo, excluimos la contraseña del resultado
        const sql = "SELECT id, documentType, documentNumber, userType, firstName, lastName, phone, email, created_at, updated_at FROM user WHERE id = ?";
        const [users] = await db.pool.query(sql, [id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: "Usuario no encontrado." });
        }
        res.status(200).json({ success: true, data: users[0] });
    } catch (error) {
        console.error(`Error al obtener usuario por ID ${id}:`, error);
        res.status(500).json({ success: false, error: "Error interno del servidor al obtener el usuario.", details: error.message });
    }
}

// Actualizar un usuario por su ID
async function updateUser(req, res) {
    const { id } = req.params;
    const { documentType, documentNumber, userType, firstName, lastName, phone, email } = req.body;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de usuario inválido." });
    }

    // Opcional: Validar que los datos necesarios para la actualización están presentes
    if (!documentType || !documentNumber || !userType || !firstName || !lastName || !phone || !email) {
        return res.status(400).json({ success: false, error: "Todos los campos son requeridos para la actualización." });
    }

    try {
        // Nota: Esta actualización no modifica la contraseña.
        // Si se quisiera modificar, se necesitaría una lógica aparte y más segura.
        const sql = `
            UPDATE user SET
                documentType = ?,
                documentNumber = ?,
                userType = ?,
                firstName = ?,
                lastName = ?,
                phone = ?,
                email = ?,
                confirmEmail = ?
            WHERE id = ?`;
        
        const params = [documentType, documentNumber, userType, firstName, lastName, phone, email, email, id];
        const [result] = await db.pool.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Usuario no encontrado para actualizar." });
        }

        res.status(200).json({ success: true, message: "Usuario actualizado exitosamente.", id: id });

    } catch (error) {
        console.error(`Error al actualizar usuario ${id}:`, error);
        // Manejar errores de duplicados (ej. email o documentNumber)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "El correo electrónico o número de documento ya está en uso por otro usuario." });
        }
        res.status(500).json({ success: false, error: "Error interno del servidor al actualizar el usuario.", details: error.message });
    }
}


module.exports = {
    registerUser,
    getAllUsers,
    getUserById,
    updateUser
};