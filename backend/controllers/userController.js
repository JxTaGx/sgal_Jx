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

// Obtener todos los usuarios
async function getAllUsers(req, res) {
    try {
        // Excluir campos sensibles como la contraseña
        const [rows] = await db.pool.query('SELECT id, documentType, documentNumber, userType, firstName, lastName, phone, email FROM user ORDER BY firstName, lastName');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ success: false, error: 'Error al obtener usuarios', details: error.message });
    }
}

// Obtener un usuario por ID
async function getUserById(req, res) {
    const userId = req.params.id;
    try {
        // Excluir campos sensibles como la contraseña
        const [rows] = await db.pool.query('SELECT id, documentType, documentNumber, userType, firstName, lastName, phone, email FROM user WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener usuario por ID', details: error.message });
    }
}

// Actualizar un usuario por ID
async function updateUser(req, res) {
    const { id } = req.params;
    const {
        documentType, documentNumber, userType, firstName, lastName, phone, email, confirmEmail
    } = req.body;

    // Validar que el email y confirmEmail coincidan si ambos se proporcionan
    if (email && confirmEmail && email !== confirmEmail) {
        return res.status(400).json({ success: false, error: "Los correos electrónicos proporcionados no coinciden." });
    }
    // Si solo se envía email (y no confirmEmail), o viceversa, podríamos considerarlo un error o simplemente ignorar confirmEmail.
    // Para esta implementación, si se actualiza el email, se asume que confirmEmail ya no es relevante para la actualización directa en BD
    // a menos que la lógica de negocio exija su validación aquí también.

    try {
        // Verificar duplicados si se cambian campos únicos como email o documentNumber
        if (email) {
            const [existingEmail] = await db.pool.query('SELECT id FROM user WHERE email = ? AND id != ?', [email, id]);
            if (existingEmail.length > 0) {
                return res.status(409).json({ success: false, error: "El correo electrónico ya está en uso por otro usuario." });
            }
        }
        if (documentNumber) {
            const [existingDoc] = await db.pool.query('SELECT id FROM user WHERE documentNumber = ? AND id != ?', [documentNumber, id]);
            if (existingDoc.length > 0) {
                return res.status(409).json({ success: false, error: "El número de documento ya está en uso por otro usuario." });
            }
        }

        let updateFields = [];
        const queryParams = [];

        // Construir la consulta dinámicamente
        if (documentType !== undefined) { updateFields.push('documentType = ?'); queryParams.push(documentType); }
        if (documentNumber !== undefined) { updateFields.push('documentNumber = ?'); queryParams.push(documentNumber); }
        if (userType !== undefined) { updateFields.push('userType = ?'); queryParams.push(userType); }
        if (firstName !== undefined) { updateFields.push('firstName = ?'); queryParams.push(firstName); }
        if (lastName !== undefined) { updateFields.push('lastName = ?'); queryParams.push(lastName); }
        if (phone !== undefined) { updateFields.push('phone = ?'); queryParams.push(phone); }
        if (email !== undefined) {
            updateFields.push('email = ?'); queryParams.push(email);
            // Si 'confirmEmail' es una columna real en tu DB y debe ser igual a 'email':
            // updateFields.push('confirmEmail = ?'); queryParams.push(email);
            // O si solo es para validación, no lo incluyas en el SET. El `server.js` original lo incluía.
            // Asumiendo que `confirmEmail` es una columna que debe actualizarse:
            if (req.body.hasOwnProperty('confirmEmail')) { // Solo actualiza si se provee explícitamente
                 updateFields.push('confirmEmail = ?'); queryParams.push(email); // Debe ser el mismo que el email
            }
        }


        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No se proporcionaron campos para actualizar.' });
        }

        queryParams.push(id);
        const sql = `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`;

        const [result] = await db.pool.query(sql, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado para actualizar' });
        }
        if (result.changedRows === 0 && result.affectedRows === 1) { // affectedRows puede ser 1 si el ID existe, pero changedRows 0 si los datos son iguales
            return res.json({ success: true, message: "No se realizaron cambios (los datos eran iguales).", id: id });
        }

        res.json({ success: true, message: 'Usuario actualizado correctamente', id: id });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "Error de duplicidad: el correo electrónico o número de documento ya existe para otro usuario." });
        }
        res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar usuario', details: error.message });
    }
}


module.exports = {
    registerUser,
    getAllUsers,
    getUserById,
    updateUser,
};