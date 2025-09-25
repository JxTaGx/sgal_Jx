/* backend/controllers/userController.js */
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importar el pool de la configuración
const jwt = require('jsonwebtoken');

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
        const checkSql = "SELECT id FROM user WHERE documentNumber = ? OR email = ?";
        const [existingUsers] = await db.pool.query(checkSql, [documentNumber, email]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, error: "El número de documento o correo electrónico ya está registrado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertSql = "INSERT INTO user (documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await db.pool.query(insertSql, [documentType, documentNumber, userType, firstName, lastName, phone, hashedPassword, email, confirmEmail]);

        res.status(201).json({ success: true, message: "Usuario registrado exitosamente", id: result.insertId });

    } catch (error) {
        console.error("Error registrando usuario:", error);
        res.status(500).json({ success: false, error: "Error interno del servidor al registrar usuario", details: error.message });
    }
}

// Login de usuario
async function loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: "El correo y la contraseña son obligatorios" });
    }

    try {
        const sql = "SELECT * FROM user WHERE email = ?";
        const [users] = await db.pool.query(sql, [email]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, error: "Credenciales inválidas" });
        }

        const user = users[0];

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, error: "Credenciales inválidas" });
        }

        const token = jwt.sign(
            { id: user.id, userType: user.userType, firstName: user.firstName },
            process.env.JWT_SECRET || 'your_default_secret',
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            message: "Login exitoso",
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                userType: user.userType
            }
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ success: false, error: "Error interno del servidor en el login", details: error.message });
    }
}

// Obtener todos los usuarios
async function getAllUsers(req, res) {
    try {
        const [users] = await db.pool.query("SELECT id, documentType, documentNumber, userType, firstName, lastName, phone, email FROM user");
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ success: false, error: "Error al obtener usuarios" });
    }
}

// Obtener un usuario por ID
async function getUserById(req, res) {
    const { id } = req.params;
    try {
        const [user] = await db.pool.query("SELECT id, documentType, documentNumber, userType, firstName, lastName, phone, email FROM user WHERE id = ?", [id]);
        if (user.length === 0) {
            return res.status(404).json({ success: false, error: "Usuario no encontrado" });
        }
        res.status(200).json({ success: true, data: user[0] });
    } catch (error) {
        console.error("Error al obtener usuario:", error);
        res.status(500).json({ success: false, error: "Error al obtener usuario" });
    }
}

// Actualizar un usuario
async function updateUser(req, res) {
    const { id } = req.params;
    const { documentType, documentNumber, userType, firstName, lastName, phone, email } = req.body;

    if (!documentType || !documentNumber || !userType || !firstName || !lastName || !phone || !email) {
        return res.status(400).json({ success: false, error: "Todos los campos son obligatorios" });
    }

    try {
        const sql = "UPDATE user SET documentType = ?, documentNumber = ?, userType = ?, firstName = ?, lastName = ?, phone = ?, email = ?, confirmEmail = ? WHERE id = ?";
        const [result] = await db.pool.query(sql, [documentType, documentNumber, userType, firstName, lastName, phone, email, email, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Usuario no encontrado para actualizar" });
        }
        res.status(200).json({ success: true, message: "Usuario actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ success: false, error: "Error al actualizar usuario" });
    }
}

// Eliminar un usuario
async function deleteUser(req, res) {
    const { id } = req.params;
    try {
        const [result] = await db.pool.query("DELETE FROM user WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Usuario no encontrado para eliminar" });
        }
        res.status(200).json({ success: true, message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ success: false, error: "Error al eliminar usuario" });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};