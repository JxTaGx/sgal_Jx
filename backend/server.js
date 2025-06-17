/* backend/server.js */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// --- Importaciones del Proyecto ---
// Configuración de la Base de Datos
const db = require('./config/db');
// Middleware para manejo de errores de subida de archivos
const { handleMulterError } = require('./config/multerConfig');

// Enrutadores de los Módulos
const userRoutes = require('./routes/userRoutes');
const cicloCultivoRoutes = require('./routes/cicloCultivoRoutes');
const cultivoRoutes = require('./routes/cultivoRoutes');
const insumoRoutes = require('./routes/insumoRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const productionRoutes = require('./routes/productionRoutes');
const integracionRoutes = require('./routes/integracionRoutes');

// --- Inicialización de la App Express ---
const app = express();

// --- Middlewares Esenciales ---
app.use(cors()); // Habilita CORS para todas las rutas
app.use(bodyParser.json()); // Parsea bodies de tipo JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parsea bodies de URL-encoded

// --- Servidor de Archivos Estáticos ---
// Sirve los archivos subidos (imágenes) desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Montaje de Rutas de la API ---
// Se estandariza un prefijo base '/api/v1' para todas las rutas.
// Esto mejora la organización y facilita el versionamiento futuro.
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cycles', cicloCultivoRoutes);
app.use('/api/v1/crops', cultivoRoutes);
app.use('/api/v1/supplies', insumoRoutes);
app.use('/api/v1/sensors', sensorRoutes);
app.use('/api/v1/productions', productionRoutes);
app.use('/api/v1/integration', integracionRoutes); // Para datos de dropdowns en el frontend

// --- Middlewares de Manejo de Errores ---
// 1. Manejador de errores específico de Multer.
//    Debe ir DESPUÉS de montar las rutas que usan 'upload'.
app.use(handleMulterError);

// 2. Manejador de errores general (catch-all).
//    Este se ejecuta si cualquier ruta anterior arroja un error.
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err.stack || err);
  // Evitar enviar detalles del error en producción por seguridad
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Algo salió mal en el servidor.' 
    : err.message;
  res.status(500).json({ success: false, error: 'Error Interno del Servidor', details: errorMessage });
});

// --- Inicio del Servidor ---
const PORT = process.env.PORT || 3000;

// Se verifica la conexión a la BD antes de iniciar el servidor.
// Este es un excelente patrón que ya tenías implementado.
db.testConnection().then(isConnected => {
    if (isConnected) {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📚 Rutas de la API disponibles en http://localhost:${PORT}/api/v1`);
        });
    } else {
        console.error("❌ No se pudo iniciar el servidor. Error de conexión con la base de datos.");
        process.exit(1); // Termina el proceso si la BD no está disponible
    }
}).catch(err => {
     console.error("❌ Error catastrófico durante la prueba de conexión a la BD:", err);
     process.exit(1);
});

/********************************************************************************/
/* */
/* TODA LA LÓGICA DE RUTAS DE PRUEBA HA SIDO ELIMINADA DE ESTE ARCHIVO.     */
/* Su funcionalidad ahora es responsabilidad exclusiva de los archivos     */
/* en las carpetas /routes y /controllers, manteniendo así la              */
/* separación de conceptos (Separation of Concerns).                       */
/* */
/********************************************************************************/