/* backend/controllers/userController.js */
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importar el pool de la configuración
const jwt = require('jsonwebtoken');

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

        // Generar el token JWT
        const token = jwt.sign(
            { id: user.id, userType: user.userType, firstName: user.firstName },
            process.env.JWT_SECRET || 'your_default_secret',
            { expiresIn: '1h' } // El token expira en 1 hora
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


module.exports = {
    registerUser,
    loginUser,
};