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
const insumoRoutes = require('./routes/insumoRoutes');const sensorRoutes = require('./routes/sensorRoutes');
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
app.use('/user', userRoutes);
app.use('/ciclo-cultivo', cicloCultivoRoutes);
app.use('/cultivo', cultivoRoutes); // Rutas como POST /, GET /s, GET /:id, PUT /:id, DELETE /:id
app.use('/insumo', insumoRoutes);   // Rutas como POST /, GET /api/insumos, GET /buscar, GET /:id, PUT /:id, DELETE /:id
app.use('/sensor', sensorRoutes);   // Rutas como POST /, GET /s, GET /buscar, GET /:id, PUT /:id, DELETE /:id
app.use('/api/productions', productionRoutes); // Rutas para producción bajo /api/productions
app.use('/api/integracion', integracionRoutes); // Rutas para integración bajo /api/integracion
// ***** LÍNEA MODIFICADA (Correcta según última corrección) *****
app.use('/api/insumos', insumoRoutes); // <-- Montaje en /api/insumos

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

// ESTO ES UNA PRUEBA PARA LOS LISTAR
// Listar todos los cultivos
const { pool } = require('./config/db');

app.get('/cultivos', async (req, res) => {
    try {
        const [resultados] = await pool.query('SELECT * FROM cultivos');
        res.json(resultados);
    } catch (error) {
        console.error('Error al listar cultivos:', error);
        res.status(500).send('Error al listar cultivos');
    }
});

app.get('/ciclo_cultivo', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ciclo_cultivo');
        res.json(rows);
    } catch (err) {
        console.error('Error al listar ciclos:', err);
        res.status(500).json({ error: 'Error al obtener los ciclos de cultivo' });
    }
});

app.get('/sensores', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM sensores');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener sensores:', error);
        res.status(500).json({ error: 'Error al obtener sensores' });
    }
});

app.get('/insumos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM insumos');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener insumos:', error);
        res.status(500).json({ error: 'Error al obtener insumos' });
    }
});

app.get('/user', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM user');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario:' });
    }
});

// ESTO ES UNA PRUEBA PARA LOS VISUALIZAR
app.get('/ciclo_cultivo/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM ciclo_cultivo WHERE id_ciclo = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ciclo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener ciclo:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/cultivo/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM cultivo WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cultivo no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener cultivo:', err);
        res.status(500).json({ error: 'Error al obtener el cultivo' });
    }
});

// ESTO ES UNA PRUEBA PARA LOS EDITAR
app.put('/ciclo_cultivo/:id', async (req, res) => {
    const { id } = req.params; // Aquí era el error
    const { nombre_ciclo, periodo_siembra, novedades, descripcion } = req.body;
  
    try {
      const [resultado] = await pool.query(
        `UPDATE ciclo_cultivo SET nombre_ciclo = ?, periodo_siembra = ?, novedades = ?, descripcion = ? WHERE id_ciclo = ?`,
        [nombre_ciclo, periodo_siembra, novedades, descripcion, id]
      );
  
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Ciclo no encontrado' });
      }
  
      res.json({ mensaje: 'Ciclo actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar ciclo:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  });  

  app.get('/cultivos/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const [resultado] = await pool.query('SELECT * FROM cultivos WHERE id_cultivo = ?', [id]);
  
      if (resultado.length === 0) {
        return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
      }
  
      res.json(resultado[0]); // Envía todos los campos correctamente
    } catch (error) {
      console.error('Error al obtener cultivo:', error);
      res.status(500).send('Error al obtener cultivo');
    }
  });
  
  app.put('/cultivos/:id', async (req, res) => {
    const { id } = req.params;
    const {
      nombre_cultivo,
      tipo_cultivo,
      tamano,
      ubicacion,
      estado,
      descripcion
    } = req.body;
  
    try {
      await pool.query(
        `UPDATE cultivos SET 
          nombre_cultivo = ?, 
          tipo_cultivo = ?, 
          tamano = ?, 
          ubicacion = ?, 
          estado = ?, 
          descripcion = ?
        WHERE id_cultivo = ?`,
        [
          nombre_cultivo,
          tipo_cultivo,
          tamano,
          ubicacion,
          estado,
          descripcion,
          id
        ]
      );
  
      res.send('Cultivo actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar cultivo:', error);
      res.status(500).send('Error al actualizar cultivo');
    }
  });

  app.put('/sensores/:id', async (req, res) => {
    const { id } = req.params;
    const {
      nombre_sensor,
      tipo_sensor,
      identificador,
      referencia_sensor,
      unidad_medida,
      tiempo_escaneo,
      estado,
      descripcion
    } = req.body;
  
    try {
      await pool.query(
        `UPDATE sensores SET
          nombre_sensor = ?,
          tipo_sensor = ?,
          unidad_medida = ?,
          referencia_sensor = ?,
          identificador = ?,
          tiempo_escaneo = ?,
          estado = ?,
          descripcion = ?
        WHERE id = ?`,
        [
          nombre_sensor,
          tipo_sensor,
          unidad_medida,
          identificador,
          referencia_sensor,
          tiempo_escaneo,
          estado,
          descripcion,
          id
        ]
      );
      res.send('Sensor actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar sensor:', error);
      res.status(500).send('Error al actualizar sensor');
    }
  });
  
  app.get('/sensores/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM sensores WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sensor no encontrado' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error al obtener el sensor:', error);
        res.status(500).json({ success: false, message: 'Error al obtener el sensor' });
    }
});

app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
      const [rows] = await pool.query('SELECT * FROM user WHERE id = ?', [userId]);

      if (rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      res.json({ success: true, data: rows[0] });
  } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const {
    documentType,
    documentNumber,
    userType,
    firstName,
    lastName,
    phone,
    email,
    confirmEmail
  } = req.body;

  try {
    await pool.query(
      `UPDATE user SET 
        documentType = ?, 
        documentNumber = ?, 
        userType = ?, 
        firstName = ?, 
        lastName = ?, 
        phone = ?, 
        email = ?, 
        confirmEmail = ?
      WHERE id = ?`,
      [
        documentType,
        documentNumber,
        userType,
        firstName,
        lastName,
        phone,
        email,
        confirmEmail,
        id
      ]
    );

    res.send('Usuario actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).send('Error al actualizar usuario');
  }
});
