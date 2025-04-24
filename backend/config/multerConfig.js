/* backend/config/multerConfig.js */
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir;
        const baseUrl = req.originalUrl.split('?')[0]; // Obtener ruta base sin query params

        // Determinar directorio basado en la ruta
        // Asegúrate que las rutas coincidan con cómo las definirás en tus archivos de rutas
        if (baseUrl.includes('/cultivo') && !baseUrl.includes('/ciclo-cultivo')) {
            uploadDir = path.join(__dirname, '..', 'uploads', 'cultivos'); // __dirname apunta a /config, salimos uno
        } else if (baseUrl.includes('/sensor')) {
            uploadDir = path.join(__dirname, '..', 'uploads', 'sensores');
        } else if (baseUrl.includes('/ciclo-cultivo')) {
            uploadDir = path.join(__dirname, '..', 'uploads', 'ciclos');
        } else {
            uploadDir = path.join(__dirname, '..', 'uploads', 'otros'); // Directorio por defecto
        }

        // Crear directorio si no existe
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
            if (err) {
                console.error("Error creando directorio de subida:", uploadDir, err);
                return cb(err); // Pasar error a Multer
            }
            cb(null, uploadDir); // Directorio listo
        });
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        let prefix = 'file-'; // Prefijo por defecto

        const baseUrl = req.originalUrl.split('?')[0];
        // Ajustar prefijo basado en la ruta (igual que en destination)
        if (baseUrl.includes('/cultivo') && !baseUrl.includes('/ciclo-cultivo')) prefix = "cultivo-";
        else if (baseUrl.includes('/sensor')) prefix = "sensor-";
        else if (baseUrl.includes('/ciclo-cultivo')) prefix = "ciclo-";

        cb(null, prefix + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite 5MB
    fileFilter: function (req, file, cb) {
        // Aceptar solo imágenes
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        // Rechazar archivo con un error específico
        cb(new Error("Error: Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)"));
    }
});

// Middleware para manejar errores específicos de Multer
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Error conocido de Multer (ej: límite de tamaño)
    console.error("Multer Error:", err.code, err.message);
    return res.status(400).json({ success: false, error: `Error de subida (${err.code}): ${err.message}` });
  } else if (err) {
    // Otro error durante la subida (ej: fileFilter)
    console.error("File Upload Error:", err.message);
    return res.status(400).json({ success: false, error: err.message || "Error al subir el archivo" });
  }
  // Si no hay error de Multer, pasa al siguiente middleware
  next();
}


module.exports = {
    upload,
    handleMulterError // Exportamos también el manejador de errores
};