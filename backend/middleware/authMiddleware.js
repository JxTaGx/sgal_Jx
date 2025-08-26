/* backend/middleware/authMiddleware.js */
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // El token viene en el formato "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Acceso denegado. No se proporcionó un token.' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Token inválido o expirado.' });
        }
        // El payload decodificado (con id, userType, firstName) se adjunta al objeto request
        req.user = decoded;
        next();
    });
};

const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.userType)) {
            return res.status(403).json({ success: false, error: 'No tienes permiso para realizar esta acción.' });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    authorize
};