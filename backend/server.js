// server.js (Complete and Updated)

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise"); // Using promise version
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // File system module

const app = express();
app.use(cors());
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded (needed for form data possibly with Multer)

// --- Database Connection Pool ---
const db = mysql.createPool({
    connectionLimit: 10, // Adjust as needed
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "sgal_db",
    waitForConnections: true,
    queueLimit: 0
});

// Test connection on startup
db.getConnection()
  .then(connection => {
    console.log("✅ Conectado a la base de datos MySQL (Pool)");
    connection.release();
  })
  .catch(err => {
    console.error("❌ Error conectando a la base de datos:", err);
    process.exit(1); // Exit if DB connection fails
  });

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir;
        const baseUrl = req.originalUrl.split('?')[0]; // Get route path without query params

        // Determine the upload directory based on the route
        if (baseUrl.startsWith('/cultivo') && !baseUrl.startsWith('/ciclo-cultivo')) {
            uploadDir = path.join(__dirname, 'uploads', 'cultivos');
        } else if (baseUrl.startsWith('/sensor')) {
            uploadDir = path.join(__dirname, 'uploads', 'sensores');
        } else if (baseUrl.startsWith('/ciclo-cultivo')) {
            uploadDir = path.join(__dirname, 'uploads', 'ciclos');
        } else {
            uploadDir = path.join(__dirname, 'uploads', 'otros'); // Default fallback
        }

        // Create the directory if it doesn't exist
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
            if (err) {
                console.error("Error creando directorio de subida:", uploadDir, err);
                return cb(err); // Pass error to Multer
            }
            cb(null, uploadDir); // Directory ready
        });
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        let prefix = 'file-'; // Default prefix

        const baseUrl = req.originalUrl.split('?')[0];
        if (baseUrl.startsWith('/cultivo') && !baseUrl.startsWith('/ciclo-cultivo')) prefix = "cultivo-";
        else if (baseUrl.startsWith('/sensor')) prefix = "sensor-";
        else if (baseUrl.startsWith('/ciclo-cultivo')) prefix = "ciclo-";

        cb(null, prefix + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size (e.g., 5MB)
    fileFilter: function (req, file, cb) {
        // Accept image files only
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)"));
    }
}); // Note: .single(), .array(), .fields() will be applied per route

// Middleware to handle Multer errors specifically
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    console.error("Multer Error:", err);
    return res.status(400).json({ error: `Error de subida: ${err.message}` });
  } else if (err) {
    // An unknown error occurred (e.g., fileFilter error).
    console.error("File Upload Error:", err);
    return res.status(400).json({ error: err.message || "Error al subir el archivo" });
  }
  // Everything went fine, pass control to the next middleware
  next();
});

// --- User Routes (Original Logic - Callback based) ---
// It's recommended to refactor these to async/await like the Production routes
app.post("/user", async (req, res) => { // This one was already async
    const { documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail } = req.body;

    if (!documentType || !documentNumber || !userType || !firstName || !lastName || !phone || !password || !email || !confirmEmail) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    if (email !== confirmEmail) {
        return res.status(400).json({ error: "Los correos electrónicos no coinciden" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const sql = "INSERT INTO user (documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        // Use pool.query with await (refactored part)
        const [result] = await db.query(sql, [documentType, documentNumber, userType, firstName, lastName, phone, hashedPassword, email, confirmEmail]);
        res.status(201).json({ message: "Usuario registrado exitosamente", id: result.insertId });

    } catch (error) {
        console.error("Error registrando usuario o encriptando:", error);
         // Check for specific errors like duplicate entry
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ error: "El número de documento o correo electrónico ya está registrado." }); // 409 Conflict
        }
        res.status(500).json({ error: "Error interno del servidor al registrar usuario", details: error.message });
    }
});

// --- Ciclo Cultivo Routes (Original Logic - Callback based) ---
// TODO: Refactor to async/await
app.post("/ciclo-cultivo", upload.single("fotografia"), (req, res) => {
    const { id_ciclo, nombre_ciclo, descripcion, periodo_siembra, novedades, estado } = req.body;

    if (!id_ciclo || !nombre_ciclo) {
        return res.status(400).json({ error: "El ID y nombre del ciclo son obligatorios" });
    }

    let ruta_fotografia = null;
    if (req.file) {
        // Store relative path accessible via static serving
        ruta_fotografia = `/uploads/ciclos/${req.file.filename}`;
    }

    const sql = `INSERT INTO ciclo_cultivo (id_ciclo, nombre_ciclo, descripcion, ruta_fotografia, periodo_siembra, novedades, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    // Using pool.execute which prepares the statement
    db.execute(sql, [id_ciclo, nombre_ciclo, descripcion, ruta_fotografia, periodo_siembra, novedades, estado || 'pendiente'])
      .then(([result]) => {
          res.status(201).json({ message: "Ciclo de cultivo creado exitosamente", id: id_ciclo });
      })
      .catch(err => {
          console.error("Error al crear ciclo de cultivo:", err);
          res.status(500).json({ error: "Error al crear ciclo de cultivo", details: err.message });
      });
});

app.get("/ciclos-cultivo", (req, res) => {
    const sql = "SELECT * FROM ciclo_cultivo ORDER BY fecha_creacion DESC";
    db.query(sql)
      .then(([results]) => {
          res.status(200).json(results);
      })
      .catch(err => {
          console.error("Error al obtener ciclos de cultivo:", err);
          res.status(500).json({ error: "Error al obtener ciclos de cultivo", details: err.message });
      });
});

app.get("/ciclo-cultivo/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM ciclo_cultivo WHERE id_ciclo = ?";
    db.execute(sql, [id])
      .then(([results]) => {
          if (results.length === 0) {
              return res.status(404).json({ error: "Ciclo de cultivo no encontrado" });
          }
          res.status(200).json(results[0]);
      })
      .catch(err => {
          console.error("Error al obtener ciclo de cultivo:", err);
          res.status(500).json({ error: "Error al obtener ciclo de cultivo", details: err.message });
      });
});

app.put("/ciclo-cultivo/:id", upload.single("fotografia"), (req, res) => {
    const id = req.params.id;
    const { nombre_ciclo, descripcion, periodo_siembra, novedades, estado } = req.body;

    let sqlUpdate = `UPDATE ciclo_cultivo SET nombre_ciclo = ?, descripcion = ?, periodo_siembra = ?, novedades = ?, estado = ?`;
    let sqlParams = [nombre_ciclo, descripcion, periodo_siembra, novedades, estado];

    if (req.file) {
        const ruta_fotografia = `/uploads/ciclos/${req.file.filename}`;
        sqlUpdate += `, ruta_fotografia = ?`;
        sqlParams.push(ruta_fotografia);
        // TODO: Consider deleting the old photo if replaced
    }
    sqlUpdate += ` WHERE id_ciclo = ?`;
    sqlParams.push(id);

    db.execute(sqlUpdate, sqlParams)
        .then(([result]) => {
            if (result.affectedRows === 0) {
                 return res.status(404).json({ error: "Ciclo de cultivo no encontrado para actualizar" });
            }
             if (result.changedRows === 0 && result.affectedRows === 1) {
                 return res.status(200).json({ message: "No se realizaron cambios (datos iguales).", id: id });
             }
            res.status(200).json({ message: "Ciclo de cultivo actualizado exitosamente", id: id });
        })
        .catch(err => {
            console.error("Error al actualizar ciclo de cultivo:", err);
            res.status(500).json({ error: "Error al actualizar ciclo de cultivo", details: err.message });
        });
});

app.delete("/ciclo-cultivo/:id", async (req, res) => { // Using async/await here as example
    const id = req.params.id;
    let connection;
    try {
        connection = await db.getConnection(); // Get connection from pool
        await connection.beginTransaction(); // Start transaction

        // 1. Get photo path before deleting DB record
        const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM ciclo_cultivo WHERE id_ciclo = ?", [id]);
        const photoPath = selectResults.length > 0 ? selectResults[0].ruta_fotografia : null;

        // 2. Delete DB record
        const [deleteResult] = await connection.execute("DELETE FROM ciclo_cultivo WHERE id_ciclo = ?", [id]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback(); // Rollback if not found
            return res.status(404).json({ error: "Ciclo de cultivo no encontrado para eliminar" });
        }

        // 3. Delete photo file if it exists
        if (photoPath) {
            const fullPath = path.join(__dirname, photoPath); // Use path.join
             // Use fs.promises for async file operations
             try {
                await fs.promises.unlink(fullPath);
                console.log("Archivo de foto eliminado:", fullPath);
             } catch (fileErr) {
                 // Log error but don't fail the request if file deletion fails
                 console.error("Error eliminando archivo de foto:", fileErr);
                 // Optionally, decide if this should cause a rollback
             }
        }

        await connection.commit(); // Commit transaction
        res.status(200).json({ message: "Ciclo de cultivo eliminado exitosamente", id: id });

    } catch (err) {
        console.error("Error al eliminar ciclo de cultivo:", err);
        if (connection) await connection.rollback(); // Rollback on any error
        res.status(500).json({ error: "Error al eliminar ciclo de cultivo", details: err.message });
    } finally {
        if (connection) connection.release(); // ALWAYS release connection
    }
});


// --- Cultivo Routes (Original Logic - Callback based) ---
// TODO: Refactor to async/await
app.post("/cultivo", upload.single("fotografia"), (req, res) => {
    const { id_cultivo, tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion } = req.body;
    if (!id_cultivo || !tipo_cultivo || !nombre_cultivo) {
        return res.status(400).json({ error: "El ID, tipo y nombre del cultivo son obligatorios" });
    }
    let ruta_fotografia = req.file ? `/uploads/cultivos/${req.file.filename}` : null;
    const sql = `INSERT INTO cultivos (id_cultivo, tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion, ruta_fotografia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.execute(sql, [id_cultivo, tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion, ruta_fotografia])
        .then(([result]) => {
            res.status(201).json({ message: "Cultivo creado exitosamente", id: id_cultivo });
        })
        .catch(err => {
            console.error("Error al crear cultivo:", err);
            res.status(500).json({ error: "Error al crear cultivo", details: err.message });
        });
});

app.get("/cultivos", (req, res) => {
    const sql = "SELECT * FROM cultivos ORDER BY fecha_creacion DESC";
    db.query(sql)
        .then(([results]) => {
             // Mapear id_cultivo a id si es necesario para el frontend
            const formattedResults = results.map(c => ({...c, id: c.id_cultivo}));
            res.status(200).json(formattedResults);
        })
        .catch(err => {
            console.error("Error al obtener cultivos:", err);
            res.status(500).json({ error: "Error al obtener cultivos", details: err.message });
        });
});

app.get("/cultivo/:id", (req, res) => {
    const id = req.params.id; // This might be id_cultivo (e.g., "CULT-001")
    const sql = "SELECT * FROM cultivos WHERE id_cultivo = ?";
    db.execute(sql, [id])
        .then(([results]) => {
            if (results.length === 0) {
                return res.status(404).json({ error: "Cultivo no encontrado" });
            }
            res.status(200).json(results[0]);
        })
        .catch(err => {
            console.error("Error al obtener cultivo:", err);
            res.status(500).json({ error: "Error al obtener cultivo", details: err.message });
        });
});

app.put("/cultivo/:id", upload.single("fotografia"), (req, res) => {
    const id = req.params.id; // This is likely id_cultivo
    const { tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion } = req.body;

    let sqlUpdate = `UPDATE cultivos SET tipo_cultivo = ?, nombre_cultivo = ?, tamano = ?, ubicacion = ?, estado = ?, descripcion = ?`;
    let sqlParams = [tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion];

    if (req.file) {
        const ruta_fotografia = `/uploads/cultivos/${req.file.filename}`;
        sqlUpdate += `, ruta_fotografia = ?`;
        sqlParams.push(ruta_fotografia);
         // TODO: Delete old photo
    }
    sqlUpdate += ` WHERE id_cultivo = ?`;
    sqlParams.push(id);

    db.execute(sqlUpdate, sqlParams)
        .then(([result]) => {
            if (result.affectedRows === 0) {
                 return res.status(404).json({ error: "Cultivo no encontrado para actualizar" });
            }
             if (result.changedRows === 0 && result.affectedRows === 1) {
                 return res.status(200).json({ message: "No se realizaron cambios (datos iguales).", id: id });
             }
            res.status(200).json({ message: "Cultivo actualizado exitosamente", id: id });
        })
        .catch(err => {
            console.error("Error al actualizar cultivo:", err);
            res.status(500).json({ error: "Error al actualizar cultivo", details: err.message });
        });
});

app.delete("/cultivo/:id", async (req, res) => { // Example async/await refactor
    const id = req.params.id; // id_cultivo
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM cultivos WHERE id_cultivo = ?", [id]);
        const photoPath = selectResults.length > 0 ? selectResults[0].ruta_fotografia : null;

        const [deleteResult] = await connection.execute("DELETE FROM cultivos WHERE id_cultivo = ?", [id]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Cultivo no encontrado para eliminar" });
        }

        if (photoPath) {
            const fullPath = path.join(__dirname, photoPath);
            try { await fs.promises.unlink(fullPath); }
            catch (fileErr) { console.error("Error eliminando archivo de foto de cultivo:", fileErr); }
        }

        await connection.commit();
        res.status(200).json({ message: "Cultivo eliminado exitosamente", id: id });
    } catch (err) {
        console.error("Error al eliminar cultivo:", err);
        if (connection) await connection.rollback();
        // Check for foreign key constraint error if productions depend on cultivos
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar el cultivo porque está asociado a una producción.' });
        }
        res.status(500).json({ error: "Error al eliminar cultivo", details: err.message });
    } finally {
        if (connection) connection.release();
    }
});


// --- Insumo Routes (Adapted slightly to async/await) ---
app.post("/insumo", async (req, res) => {
    const { id_insumo, tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado } = req.body;
    if (!id_insumo || !tipo_insumo || !nombre_insumo || !unidad_medida) {
        return res.status(400).json({ error: "El ID, tipo, nombre y unidad de medida del insumo son obligatorios" });
    }
    const sql = `INSERT INTO insumos (id_insumo, tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        const [result] = await db.execute(sql, [id_insumo, tipo_insumo, nombre_insumo, descripcion || null, unidad_medida, cantidad || 0, valor_unitario || 0, estado || 'Disponible']);
        res.status(201).json({ message: "Insumo creado exitosamente", id: result.insertId, displayId: id_insumo }); // Return both IDs if useful
    } catch (err) {
        console.error("Error al crear insumo:", err);
        res.status(500).json({ error: "Error al crear insumo", details: err.message });
    }
});

// This is the correct route based on frontend calls
app.get("/api/insumos", async (req, res) => {
    const sql = "SELECT *, id as pk_id FROM insumos ORDER BY fecha_creacion DESC"; // Alias the PK 'id' if needed
    try {
        const [results] = await db.query(sql);
        // Map to ensure 'id' field exists if frontend expects it based on PK
         const formattedResults = results.map(insumo => ({
             ...insumo,
             id: insumo.pk_id // Use the aliased primary key
         }));
        res.status(200).json({ success: true, data: formattedResults });
    } catch (err) {
        console.error("Error al obtener insumos (/api/insumos):", err);
        res.status(500).json({ success: false, error: "Error al obtener insumos", details: err.message });
    }
});

app.get("/insumo/:id", async (req, res) => {
    const id = req.params.id; // This could be id_insumo OR the primary key 'id'
    // Decide which ID to use for lookup. Let's assume it's the primary key 'id'.
    const sql = "SELECT * FROM insumos WHERE id = ?";
    try {
        const [results] = await db.execute(sql, [id]);
        if (results.length === 0) {
             // Maybe try searching by id_insumo as a fallback?
             const sqlFallback = "SELECT * FROM insumos WHERE id_insumo = ?";
             const [fallbackResults] = await db.execute(sqlFallback, [id]);
             if (fallbackResults.length === 0) {
                return res.status(404).json({ error: "Insumo no encontrado" });
             }
             res.status(200).json(fallbackResults[0]);
        } else {
            res.status(200).json(results[0]);
        }
    } catch (err) {
        console.error("Error al obtener insumo:", err);
        res.status(500).json({ error: "Error al obtener insumo", details: err.message });
    }
});

app.put("/insumo/:id", async (req, res) => {
    const id = req.params.id; // Assume PK 'id'
    const { tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado } = req.body;
    const sql = `UPDATE insumos SET tipo_insumo = ?, nombre_insumo = ?, descripcion = ?, unidad_medida = ?, cantidad = ?, valor_unitario = ?, estado = ? WHERE id = ?`;
    try {
        const [result] = await db.execute(sql, [tipo_insumo, nombre_insumo, descripcion || null, unidad_medida, cantidad || 0, valor_unitario || 0, estado || 'Disponible', id]);
        if (result.affectedRows === 0) {
             return res.status(404).json({ error: "Insumo no encontrado para actualizar" });
        }
        if (result.changedRows === 0 && result.affectedRows === 1) {
            return res.status(200).json({ message: "No se realizaron cambios (datos iguales).", id: id });
        }
        res.status(200).json({ message: "Insumo actualizado exitosamente", id: id });
    } catch (err) {
        console.error("Error al actualizar insumo:", err);
        res.status(500).json({ error: "Error al actualizar insumo", details: err.message });
    }
});

app.delete("/insumo/:id", async (req, res) => {
    const id = req.params.id; // Assume PK 'id'
    const sql = "DELETE FROM insumos WHERE id = ?";
    try {
        const [result] = await db.execute(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Insumo no encontrado para eliminar" });
        }
        res.status(200).json({ message: "Insumo eliminado exitosamente", id: id });
    } catch (err) {
        console.error("Error al eliminar insumo:", err);
        res.status(500).json({ error: "Error al eliminar insumo", details: err.message });
    }
});

app.get("/insumos/buscar", async (req, res) => {
    const { termino } = req.query;
    if (!termino) {
        return res.status(400).json({ error: "Se requiere un término de búsqueda" });
    }
    const sql = `SELECT * FROM insumos WHERE tipo_insumo LIKE ? OR nombre_insumo LIKE ? ORDER BY fecha_creacion DESC`;
    const searchTerm = `%${termino}%`;
    try {
        const [results] = await db.query(sql, [searchTerm, searchTerm]);
        res.status(200).json(results);
    } catch (err) {
        console.error("Error al buscar insumos:", err);
        res.status(500).json({ error: "Error al buscar insumos", details: err.message });
    }
});

// --- Sensor Routes (Original Logic - Callback based) ---
// TODO: Refactor to async/await
app.post("/sensor", upload.single("fotografia"), (req, res) => {
    const { tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion } = req.body;
    if (!tipo_sensor || !nombre_sensor || !identificador || !referencia_sensor || !unidad_medida || !tiempo_escaneo || !estado) {
        return res.status(400).json({ error: "Todos los campos son obligatorios excepto la descripción y fotografía" });
    }
    let ruta_fotografia = req.file ? `/uploads/sensores/${req.file.filename}` : null;
    const sql = `INSERT INTO sensores (tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion, ruta_fotografia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.execute(sql, [tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion || null, ruta_fotografia])
        .then(([result]) => {
            res.status(201).json({ message: "Sensor creado exitosamente", id: result.insertId });
        })
        .catch(err => {
            console.error("Error al crear sensor:", err);
             if (err.code === 'ER_DUP_ENTRY') { // Handle unique constraint violation for 'identificador'
                return res.status(409).json({ error: "El identificador del sensor ya existe." });
             }
            res.status(500).json({ error: "Error al crear sensor", details: err.message });
        });
});

app.get("/sensores", (req, res) => {
    const sql = "SELECT * FROM sensores ORDER BY fecha_creacion DESC";
    db.query(sql)
        .then(([results]) => {
            res.status(200).json(results); // Frontend expects 'id' which is the PK here
        })
        .catch(err => {
            console.error("Error al obtener sensores:", err);
            res.status(500).json({ error: "Error al obtener sensores", details: err.message });
        });
});

app.get("/sensor/:id", (req, res) => {
    const id = req.params.id; // PK 'id'
    const sql = "SELECT * FROM sensores WHERE id = ?";
    db.execute(sql, [id])
        .then(([results]) => {
            if (results.length === 0) {
                return res.status(404).json({ error: "Sensor no encontrado" });
            }
            res.status(200).json(results[0]);
        })
        .catch(err => {
            console.error("Error al obtener sensor:", err);
            res.status(500).json({ error: "Error al obtener sensor", details: err.message });
        });
});

app.put("/sensor/:id", upload.single("fotografia"), (req, res) => {
    const id = req.params.id; // PK 'id'
    const { tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion } = req.body;

    let sqlUpdate = `UPDATE sensores SET tipo_sensor = ?, nombre_sensor = ?, identificador = ?, referencia_sensor = ?, unidad_medida = ?, tiempo_escaneo = ?, estado = ?, descripcion = ?`;
    let sqlParams = [tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion || null];

    if (req.file) {
        const ruta_fotografia = `/uploads/sensores/${req.file.filename}`;
        sqlUpdate += `, ruta_fotografia = ?`;
        sqlParams.push(ruta_fotografia);
        // TODO: Delete old photo
    }
    sqlUpdate += ` WHERE id = ?`;
    sqlParams.push(id);

    db.execute(sqlUpdate, sqlParams)
        .then(([result]) => {
            if (result.affectedRows === 0) {
                 return res.status(404).json({ error: "Sensor no encontrado para actualizar" });
            }
            if (result.changedRows === 0 && result.affectedRows === 1) {
                 return res.status(200).json({ message: "No se realizaron cambios (datos iguales).", id: id });
             }
            res.status(200).json({ message: "Sensor actualizado exitosamente", id: id });
        })
        .catch(err => {
            console.error("Error al actualizar sensor:", err);
            if (err.code === 'ER_DUP_ENTRY') { // Handle unique constraint violation for 'identificador'
                 return res.status(409).json({ error: "El identificador del sensor ya existe." });
             }
            res.status(500).json({ error: "Error al actualizar sensor", details: err.message });
        });
});

app.delete("/sensor/:id", async (req, res) => { // Example async/await refactor
    const id = req.params.id; // PK 'id'
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM sensores WHERE id = ?", [id]);
        const photoPath = selectResults.length > 0 ? selectResults[0].ruta_fotografia : null;

        const [deleteResult] = await connection.execute("DELETE FROM sensores WHERE id = ?", [id]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Sensor no encontrado para eliminar" });
        }

        if (photoPath) {
            const fullPath = path.join(__dirname, photoPath);
            try { await fs.promises.unlink(fullPath); }
            catch (fileErr) { console.error("Error eliminando archivo de foto de sensor:", fileErr); }
        }

        await connection.commit();
        res.status(200).json({ message: "Sensor eliminado exitosamente", id: id });
    } catch (err) {
        console.error("Error al eliminar sensor:", err);
        if (connection) await connection.rollback();
        res.status(500).json({ error: "Error al eliminar sensor", details: err.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get("/sensores/buscar", async (req, res) => {
    const { termino } = req.query;
    if (!termino) {
        return res.status(400).json({ error: "Se requiere un término de búsqueda" });
    }
    const sql = `SELECT * FROM sensores WHERE tipo_sensor LIKE ? OR nombre_sensor LIKE ? OR identificador LIKE ? ORDER BY fecha_creacion DESC`;
    const searchTerm = `%${termino}%`;
    try {
        const [results] = await db.query(sql, [searchTerm, searchTerm, searchTerm]);
        res.status(200).json(results);
    } catch (err) {
        console.error("Error al buscar sensores:", err);
        res.status(500).json({ error: "Error al buscar sensores", details: err.message });
    }
});

// --- Integración Routes (Adapted to async/await) ---

// Route to get data for dropdowns in the integration module
app.get('/api/integracion/data', async (req, res) => {
    try {
        // Fetch all necessary data in parallel
        const [
            [users],
            [cultivations],
            [cycles],
            [sensors]
            // Insumos are fetched separately via /api/insumos by the frontend now
        ] = await Promise.all([
            db.query("SELECT id, CONCAT(firstName, ' ', lastName) as name FROM user ORDER BY firstName, lastName"),
            db.query("SELECT id_cultivo as id, nombre_cultivo as name FROM cultivos ORDER BY nombre_cultivo"), // Aliased id/name
            db.query("SELECT id_ciclo as id, nombre_ciclo as name FROM ciclo_cultivo ORDER BY nombre_ciclo"), // Aliased id/name
            db.query("SELECT id, CONCAT(nombre_sensor, ' (', tipo_sensor, ')') as name FROM sensores ORDER BY nombre_sensor") // Aliased name
        ]);

        res.json({
            success: true,
            data: { users, cultivations, cycles, sensors } // Return structured data
        });
    } catch (error) {
        console.error('Error fetching integration dropdown data:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos para los selectores de integración',
            details: error.message
        });
    }
});


// --- Production Routes (Using Router and async/await - Updated PUT) ---
const productionRoutes = express.Router();

// POST /api/productions - Create a new production
productionRoutes.post('/', async (req, res) => {
    const { name, responsible, cultivation, cycle, sensors, supplies, startDate, endDate } = req.body;

    // Basic validation
    if (!name || !responsible || !cultivation || !cycle || !startDate || !endDate || !Array.isArray(sensors) || !Array.isArray(supplies)) {
        return res.status(400).json({ error: 'Faltan campos obligatorios o tienen formato incorrecto (sensors/supplies deben ser arrays)' });
    }
    if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
        return res.status(400).json({ error: 'Formato de fecha inválido.' });
    }
    if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }

    const sql = `INSERT INTO productions (name, responsible, cultivation, cycle, sensors, supplies, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`;
    const sensorsStr = sensors.join(',');
    const suppliesStr = supplies.join(',');

    try {
        const [result] = await db.query(sql, [name, responsible, cultivation, cycle, sensorsStr, suppliesStr, startDate, endDate]);
        if (result.affectedRows === 1 && result.insertId) {
            res.status(201).json({ success: true, id: result.insertId, displayId: `prod-${result.insertId}`, message: 'Producción creada exitosamente' });
        } else {
            throw new Error('La producción no pudo ser creada.');
        }
    } catch (err) {
        console.error('Error creating production:', err);
        let userMessage = 'Error al crear producción';
        if (err.code === 'ER_NO_REFERENCED_ROW_2') userMessage = 'Error: El responsable, cultivo o ciclo seleccionado no existe.';
        res.status(500).json({ success: false, error: userMessage, details: err.message });
    }
});

// GET /api/productions - Get all productions
productionRoutes.get('/', async (req, res) => {
    const sql = `
        SELECT p.*,
               CONCAT(u.firstName, ' ', u.lastName) as responsible_name,
               c.nombre_cultivo as cultivation_name,
               cc.nombre_ciclo as cycle_name
        FROM productions p
        LEFT JOIN user u ON p.responsible = u.id
        LEFT JOIN cultivos c ON p.cultivation = c.id_cultivo
        LEFT JOIN ciclo_cultivo cc ON p.cycle = cc.id_ciclo
        ORDER BY p.created_at DESC`;
    try {
        const [results] = await db.query(sql);
        const formattedResults = results.map(prod => ({
            ...prod,
            sensors: prod.sensors ? prod.sensors.split(',') : [],
            supplies: prod.supplies ? prod.supplies.split(',') : []
        }));
        res.json({ success: true, data: formattedResults });
    } catch (err) {
        console.error('Error fetching productions:', err);
        res.status(500).json({ success: false, error: 'Error al obtener producciones', details: err.message });
    }
});

// GET /api/productions/:id - Get a specific production
productionRoutes.get('/:id', async (req, res) => {
    const productionId = req.params.id;
    if (!productionId || isNaN(parseInt(productionId))) {
        return res.status(400).json({ success: false, error: 'ID de producción inválido' });
    }
    const sql = `
        SELECT p.*,
               CONCAT(u.firstName, ' ', u.lastName) as responsible_name,
               c.nombre_cultivo as cultivation_name,
               cc.nombre_ciclo as cycle_name
        FROM productions p
        LEFT JOIN user u ON p.responsible = u.id
        LEFT JOIN cultivos c ON p.cultivation = c.id_cultivo
        LEFT JOIN ciclo_cultivo cc ON p.cycle = cc.id_ciclo
        WHERE p.id = ?`;
    try {
        const [results] = await db.query(sql, [productionId]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'Producción no encontrada' });
        }
        const production = {
            ...results[0],
            sensors: results[0].sensors ? results[0].sensors.split(',') : [],
            supplies: results[0].supplies ? results[0].supplies.split(',') : []
        };
        res.json({ success: true, data: production });
    } catch (err) {
        console.error('Error fetching production:', err);
        res.status(500).json({ success: false, error: 'Error al obtener producción', details: err.message });
    }
});

// PUT /api/productions/:id - Update a production (Handles Supplies)
productionRoutes.put('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: 'ID de producción inválido' });
    }

    const {
        name, responsible, cultivation, cycle,
        sensors, supplies, // Expect supplies array
        /* NO start_date */ end_date, status
    } = req.body;

    // Validation
    if (!name || !responsible || !cultivation || !cycle || !end_date || !status || !Array.isArray(sensors) || !Array.isArray(supplies)) { // Check supplies array
        return res.status(400).json({ error: 'Faltan campos obligatorios o tienen formato incorrecto (sensors/supplies deben ser arrays)' });
    }
    if (isNaN(new Date(end_date).getTime())) {
        return res.status(400).json({ error: 'Formato de fecha de fin inválido.' });
    }

    // Convert arrays to strings for DB storage
    const sensorsStr = sensors.join(',');
    const suppliesStr = supplies.join(','); // Convert supplies to string

    // SQL includes supplies field
    const sql = `
        UPDATE productions
        SET name = ?, responsible = ?, cultivation = ?, cycle = ?,
            sensors = ?, supplies = ?, end_date = ?, status = ?
        WHERE id = ?`;

    // Params include suppliesStr
    const params = [
        name, responsible, cultivation, cycle,
        sensorsStr, suppliesStr, end_date, status,
        id
    ];

    try {
        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Producción no encontrada para actualizar' });
        }
        if (result.changedRows === 0) {
            return res.json({ success: true, message: 'No se realizaron cambios (datos iguales).', id: id });
        }
        res.json({ success: true, message: 'Producción actualizada exitosamente', id: id });
    } catch (err) {
        console.error('Error updating production:', err);
        let userMessage = 'Error al actualizar producción';
        if (err.code === 'ER_NO_REFERENCED_ROW_2') userMessage = 'Error: El responsable, cultivo o ciclo seleccionado no existe.';
        else if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') userMessage = 'Error: Formato de fecha inválido.';
        res.status(500).json({ success: false, error: userMessage, details: err.message });
    }
});

// DELETE /api/productions/:id - Delete a production
productionRoutes.delete('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: 'ID de producción inválido' });
    }
    const sql = 'DELETE FROM productions WHERE id = ?';
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Producción no encontrada para eliminar' });
        }
        res.json({ success: true, message: 'Producción eliminada exitosamente' });
    } catch (err) {
        console.error('Error deleting production:', err);
        // Check for foreign key constraint errors if other tables depend on productions
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ success: false, error: 'No se puede eliminar la producción porque está siendo referenciada en otras partes del sistema.' });
        }
        res.status(500).json({ success: false, error: 'Error al eliminar producción', details: err.message });
    }
});

// Mount the production routes
app.use('/api/productions', productionRoutes);

// --- Static File Serving ---
// Serves files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Server Initialization ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});