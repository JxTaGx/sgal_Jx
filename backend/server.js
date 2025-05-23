/* backend/server.js */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Importar configuración de BD y test de conexión
const db = require('./config/db');
// Importar manejador de errores de Multer
const { handleMulterError } = require('./config/multerConfig');

// Importar Routers
const userRoutes = require('./routes/userRoutes');
const cicloCultivoRoutes = require('./routes/cicloCultivoRoutes');
const cultivoRoutes = require('./routes/cultivoRoutes');
const insumoRoutes = require('./routes/insumoRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const productionRoutes = require('./routes/productionRoutes');
const integracionRoutes = require('./routes/integracionRoutes');

const app = express();

// --- Middlewares Esenciales ---
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(bodyParser.json()); // Para parsear JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Para parsear URL-encoded bodies

// --- Servir Archivos Estáticos ---
// Servir archivos desde el directorio 'uploads' bajo la ruta '/uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Montaje de Rutas ---
// Montar cada router en su ruta base correspondiente
app.use('/user', userRoutes); // Rutas: POST /, GET /, GET /:id, PUT /:id
app.use('/ciclo-cultivo', cicloCultivoRoutes); // Rutas: POST /, GET /, GET /:id, PUT /:id, DELETE /:id
app.use('/cultivo', cultivoRoutes); // Rutas: POST /, GET /s, GET /:id, PUT /:id, DELETE /:id
// app.use('/insumo', insumoRoutes); // Se recomienda eliminar esta línea si /api/insumos es la ruta principal
app.use('/sensor', sensorRoutes);   // Rutas: POST /, GET /s, GET /buscar, GET /:id, PUT /:id, DELETE /:id
app.use('/api/productions', productionRoutes); // Rutas para producción bajo /api/productions
app.use('/api/integracion', integracionRoutes); // Rutas para integración bajo /api/integracion
app.use('/api/insumos', insumoRoutes); // Montaje en /api/insumos (POST /, GET /, GET /buscar, GET /:id, etc.)

// --- Middleware de Manejo de Errores de Multer ---
// Debe ir DESPUÉS de montar las rutas que usan 'upload'
app.use(handleMulterError);

// --- Manejo de Errores General (Opcional pero recomendado) ---
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err.stack || err);
  res.status(500).json({ success: false, error: 'Algo salió mal en el servidor', details: err.message });
});

// --- Iniciar Servidor ---
const PORT = process.env.PORT || 3000;

// Verificar conexión a la BD antes de iniciar el servidor
db.testConnection().then(isConnected => {
    if (isConnected) {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } else {
        console.error("❌ No se pudo iniciar el servidor debido a un error en la conexión a la base de datos.");
        process.exit(1); // Terminar el proceso si no hay conexión a BD
    }
}).catch(err => {
    console.error("❌ Error durante el test de conexión a la BD:", err);
    process.exit(1);
});