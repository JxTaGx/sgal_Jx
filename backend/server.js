require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); // 🔐 Para encriptar contraseñas

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "sgal_db",
});

db.connect((err) => {
    if (err) {
        console.error("Error conectando a la base de datos:", err);
    } else {
        console.log("✅ Conectado a la base de datos MySQL");
    }
});

app.post("/user", async (req, res) => {
    const { documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail } = req.body;

    if (!documentType || !documentNumber || !userType || !firstName || !lastName || !phone || !password || !email || !confirmEmail) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (email !== confirmEmail) {
        return res.status(400).json({ error: "Los correos electrónicos no coinciden" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // 🔐 Encriptar la contraseña

        const sql = "INSERT INTO user (documentType, documentNumber, userType, firstName, lastName, phone, password, email, confirmEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        db.query(sql, [documentType, documentNumber, userType, firstName, lastName, phone, hashedPassword, email, confirmEmail], (err, result) => {
            if (err) {
                console.error("Error al registrar usuario:", err);
                return res.status(500).json({ error: "Error al registrar usuario", details: err.message });
            }
            res.status(201).json({ message: "Usuario registrado exitosamente", id: result.insertId });
        });
    } catch (error) {
        console.error("Error encriptando contraseña:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// Agregar estas importaciones si necesitas manejar la subida de archivos
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuración para subir archivos (fotografías)  
// Modificar la configuración de multer para incluir sensores
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir;
        
        // Determinar la carpeta según la ruta
        if (req.originalUrl.includes('/cultivo') && !req.originalUrl.includes('/ciclo-cultivo')) {
            uploadDir = "./uploads/cultivos";
        } else if (req.originalUrl.includes('/sensor')) {
            uploadDir = "./uploads/sensores";
        } else {
            uploadDir = "./uploads/ciclos";
        }
        
        // Crear el directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        
        // Generar nombre de archivo según la ruta
        if (req.originalUrl.includes('/cultivo') && !req.originalUrl.includes('/ciclo-cultivo')) {
            cb(null, "cultivo-" + uniqueSuffix + path.extname(file.originalname));
        } else if (req.originalUrl.includes('/sensor')) {
            cb(null, "sensor-" + uniqueSuffix + path.extname(file.originalname));
        } else {
            cb(null, "ciclo-" + uniqueSuffix + path.extname(file.originalname));
        }
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Solo se permiten archivos de imagen"));
    }
});

// Añadir esta ruta a tu server.js
// Ruta para crear un nuevo ciclo de cultivo
app.post("/ciclo-cultivo", upload.single("fotografia"), (req, res) => {
    // Extraer los datos del formulario
    const { 
        id_ciclo, 
        nombre_ciclo, 
        descripcion, 
        periodo_siembra, 
        novedades, 
        estado 
    } = req.body;

    // Validar campos obligatorios
    if (!id_ciclo || !nombre_ciclo) {
        return res.status(400).json({ 
            error: "El ID y nombre del ciclo son obligatorios" 
        });
    }

    // Ruta de la fotografía (si se subió un archivo)
    let ruta_fotografia = null;
    if (req.file) {
        ruta_fotografia = `/uploads/ciclos/${req.file.filename}`;
    }

    // Consulta SQL para insertar el nuevo ciclo
    const sql = `
        INSERT INTO ciclo_cultivo 
        (id_ciclo, nombre_ciclo, descripcion, ruta_fotografia, periodo_siembra, novedades, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta
    db.query(
        sql, 
        [id_ciclo, nombre_ciclo, descripcion, ruta_fotografia, periodo_siembra, novedades, estado || 'pendiente'],
        (err, result) => {
            if (err) {
                console.error("Error al crear ciclo de cultivo:", err);
                return res.status(500).json({ 
                    error: "Error al crear ciclo de cultivo", 
                    details: err.message 
                });
            }
            
            res.status(201).json({ 
                message: "Ciclo de cultivo creado exitosamente", 
                id: id_ciclo,
                result: result
            });
        }
    );
});

// Ruta para obtener todos los ciclos de cultivo
app.get("/ciclos-cultivo", (req, res) => {
    const sql = "SELECT * FROM ciclo_cultivo ORDER BY fecha_creacion DESC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener ciclos de cultivo:", err);
            return res.status(500).json({ 
                error: "Error al obtener ciclos de cultivo", 
                details: err.message 
            });
        }
        
        res.status(200).json(results);
    });
});

// Ruta para obtener un ciclo de cultivo específico por ID
app.get("/ciclo-cultivo/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM ciclo_cultivo WHERE id_ciclo = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error al obtener ciclo de cultivo:", err);
            return res.status(500).json({ 
                error: "Error al obtener ciclo de cultivo", 
                details: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Ciclo de cultivo no encontrado" });
        }
        
        res.status(200).json(results[0]);
    });
});

// Ruta para actualizar un ciclo de cultivo
app.put("/ciclo-cultivo/:id", upload.single("fotografia"), (req, res) => {
    const id = req.params.id;
    const { nombre_ciclo, descripcion, periodo_siembra, novedades, estado } = req.body;

    // Verificar si se está actualizando la fotografía
    let sqlPhoto = '';
    let sqlParams = [nombre_ciclo, descripcion, periodo_siembra, novedades, estado, id];

    if (req.file) {
        const ruta_fotografia = `/uploads/ciclos/${req.file.filename}`;
        sqlPhoto = ', ruta_fotografia = ?';
        sqlParams = [nombre_ciclo, descripcion, periodo_siembra, novedades, estado, ruta_fotografia, id];
    }

    const sql = `
        UPDATE ciclo_cultivo 
        SET nombre_ciclo = ?, descripcion = ?, periodo_siembra = ?, 
            novedades = ?, estado = ? ${sqlPhoto}
        WHERE id_ciclo = ?
    `;

    db.query(sql, sqlParams, (err, result) => {
        if (err) {
            console.error("Error al actualizar ciclo de cultivo:", err);
            return res.status(500).json({ 
                error: "Error al actualizar ciclo de cultivo", 
                details: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Ciclo de cultivo no encontrado" });
        }
        
        res.status(200).json({ 
            message: "Ciclo de cultivo actualizado exitosamente",
            id: id
        });
    });
});

// Ruta para eliminar un ciclo de cultivo
app.delete("/ciclo-cultivo/:id", (req, res) => {
    const id = req.params.id;
    
    // Primero obtener la información para eliminar la foto si existe
    db.query("SELECT ruta_fotografia FROM ciclo_cultivo WHERE id_ciclo = ?", [id], (err, results) => {
        if (err) {
            console.error("Error al buscar ciclo de cultivo:", err);
            return res.status(500).json({ 
                error: "Error al eliminar ciclo de cultivo", 
                details: err.message 
            });
        }
        
        // Eliminar de la base de datos
        db.query("DELETE FROM ciclo_cultivo WHERE id_ciclo = ?", [id], (err, result) => {
            if (err) {
                console.error("Error al eliminar ciclo de cultivo:", err);
                return res.status(500).json({ 
                    error: "Error al eliminar ciclo de cultivo", 
                    details: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Ciclo de cultivo no encontrado" });
            }
            
            // Eliminar la foto si existe
            if (results.length > 0 && results[0].ruta_fotografia) {
                const filePath = path.join(__dirname, results[0].ruta_fotografia);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            res.status(200).json({ 
                message: "Ciclo de cultivo eliminado exitosamente",
                id: id
            });
        });
    });
});

// Para servir los archivos estáticos (fotos subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta para crear un nuevo cultivo
app.post("/cultivo", upload.single("fotografia"), (req, res) => {
    // Extraer los datos del formulario
    const { 
        id_cultivo, 
        tipo_cultivo,
        nombre_cultivo, 
        tamano,
        ubicacion,
        estado,
        descripcion 
    } = req.body;

    // Validar campos obligatorios
    if (!id_cultivo || !tipo_cultivo || !nombre_cultivo) {
        return res.status(400).json({ 
            error: "El ID, tipo y nombre del cultivo son obligatorios" 
        });
    }

    // Ruta de la fotografía (si se subió un archivo)
    let ruta_fotografia = null;
    if (req.file) {
        ruta_fotografia = `/uploads/cultivos/${req.file.filename}`;
    }

    // Consulta SQL para insertar el nuevo cultivo
    const sql = `
        INSERT INTO cultivos 
        (id_cultivo, tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion, ruta_fotografia) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta
    db.query(
        sql, 
        [id_cultivo, tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion, ruta_fotografia],
        (err, result) => {
            if (err) {
                console.error("Error al crear cultivo:", err);
                return res.status(500).json({ 
                    error: "Error al crear cultivo", 
                    details: err.message 
                });
            }
            
            res.status(201).json({ 
                message: "Cultivo creado exitosamente", 
                id: id_cultivo,
                result: result
            });
        }
    );
});

// Ruta para obtener todos los cultivos
app.get("/cultivos", (req, res) => {
    const sql = "SELECT * FROM cultivos ORDER BY fecha_creacion DESC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener cultivos:", err);
            return res.status(500).json({ 
                error: "Error al obtener cultivos", 
                details: err.message 
            });
        }
        
        res.status(200).json(results);
    });
});

// Ruta para obtener un cultivo específico por ID
app.get("/cultivo/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM cultivos WHERE id_cultivo = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error al obtener cultivo:", err);
            return res.status(500).json({ 
                error: "Error al obtener cultivo", 
                details: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Cultivo no encontrado" });
        }
        
        res.status(200).json(results[0]);
    });
});

// Ruta para actualizar un cultivo
app.put("/cultivo/:id", upload.single("fotografia"), (req, res) => {
    const id = req.params.id;
    const { tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion } = req.body;

    // Verificar si se está actualizando la fotografía
    let sqlPhoto = '';
    let sqlParams = [tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion, id];

    if (req.file) {
        const ruta_fotografia = `/uploads/cultivos/${req.file.filename}`;
        sqlPhoto = ', ruta_fotografia = ?';
        sqlParams = [tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion, ruta_fotografia, id];
    }

    const sql = `
        UPDATE cultivos 
        SET tipo_cultivo = ?, nombre_cultivo = ?, tamano = ?, 
            ubicacion = ?, estado = ?, descripcion = ? ${sqlPhoto}
        WHERE id_cultivo = ?
    `;

    db.query(sql, sqlParams, (err, result) => {
        if (err) {
            console.error("Error al actualizar cultivo:", err);
            return res.status(500).json({ 
                error: "Error al actualizar cultivo", 
                details: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Cultivo no encontrado" });
        }
        
        res.status(200).json({ 
            message: "Cultivo actualizado exitosamente",
            id: id
        });
    });
});

// Ruta para eliminar un cultivo
app.delete("/cultivo/:id", (req, res) => {
    const id = req.params.id;
    
    // Primero obtener la información para eliminar la foto si existe
    db.query("SELECT ruta_fotografia FROM cultivos WHERE id_cultivo = ?", [id], (err, results) => {
        if (err) {
            console.error("Error al buscar cultivo:", err);
            return res.status(500).json({ 
                error: "Error al eliminar cultivo", 
                details: err.message 
            });
        }
        
        // Eliminar de la base de datos
        db.query("DELETE FROM cultivos WHERE id_cultivo = ?", [id], (err, result) => {
            if (err) {
                console.error("Error al eliminar cultivo:", err);
                return res.status(500).json({ 
                    error: "Error al eliminar cultivo", 
                    details: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Cultivo no encontrado" });
            }
            
            // Eliminar la foto si existe
            if (results.length > 0 && results[0].ruta_fotografia) {
                const filePath = path.join(__dirname, results[0].ruta_fotografia);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            res.status(200).json({ 
                message: "Cultivo eliminado exitosamente",
                id: id
            });
        });
    });
});

// ===== RUTAS PARA INSUMOS =====

// Ruta para crear un nuevo insumo
app.post("/insumo", (req, res) => {
    // Extraer los datos del formulario
    const { 
        id_insumo, 
        tipo_insumo, 
        nombre_insumo, 
        descripcion,
        unidad_medida,
        cantidad,
        valor_unitario,
        estado
    } = req.body;

    // Validar campos obligatorios
    if (!id_insumo || !tipo_insumo || !nombre_insumo || !unidad_medida) {
        return res.status(400).json({ 
            error: "El ID, tipo, nombre y unidad de medida del insumo son obligatorios" 
        });
    }

    // Consulta SQL para insertar el nuevo insumo
    // Nota: No necesitamos incluir valor_total en la consulta ya que es un campo calculado
    const sql = `
        INSERT INTO insumos 
        (id_insumo, tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta
    db.query(
        sql, 
        [
            id_insumo, 
            tipo_insumo, 
            nombre_insumo, 
            descripcion || null, 
            unidad_medida,
            cantidad || 0,
            valor_unitario || 0,
            estado || 'Disponible'
        ],
        (err, result) => {
            if (err) {
                console.error("Error al crear insumo:", err);
                return res.status(500).json({ 
                    error: "Error al crear insumo", 
                    details: err.message 
                });
            }
            
            res.status(201).json({ 
                message: "Insumo creado exitosamente", 
                id: id_insumo,
                result: result
            });
        }
    );
});

// Ruta para obtener todos los insumos
app.get("/insumos", (req, res) => {
    const sql = "SELECT * FROM insumos ORDER BY fecha_creacion DESC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener insumos:", err);
            return res.status(500).json({ 
                error: "Error al obtener insumos", 
                details: err.message 
            });
        }
        
        res.status(200).json(results);
    });
});

// Ruta para obtener un insumo específico por ID
app.get("/insumo/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM insumos WHERE id_insumo = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error al obtener insumo:", err);
            return res.status(500).json({ 
                error: "Error al obtener insumo", 
                details: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Insumo no encontrado" });
        }
        
        res.status(200).json(results[0]);
    });
});

// Ruta para actualizar un insumo
app.put("/insumo/:id", (req, res) => {
    const id = req.params.id;
    const { 
        tipo_insumo, 
        nombre_insumo, 
        descripcion,
        unidad_medida,
        cantidad,
        valor_unitario,
        estado
    } = req.body;

    const sql = `
        UPDATE insumos 
        SET tipo_insumo = ?, 
            nombre_insumo = ?, 
            descripcion = ?, 
            unidad_medida = ?, 
            cantidad = ?, 
            valor_unitario = ?, 
            estado = ?
        WHERE id_insumo = ?
    `;

    db.query(
        sql, 
        [
            tipo_insumo, 
            nombre_insumo, 
            descripcion || null, 
            unidad_medida,
            cantidad || 0,
            valor_unitario || 0,
            estado || 'Disponible',
            id
        ], 
        (err, result) => {
            if (err) {
                console.error("Error al actualizar insumo:", err);
                return res.status(500).json({ 
                    error: "Error al actualizar insumo", 
                    details: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Insumo no encontrado" });
            }
            
            res.status(200).json({ 
                message: "Insumo actualizado exitosamente",
                id: id
            });
        }
    );
});

// Ruta para eliminar un insumo
app.delete("/insumo/:id", (req, res) => {
    const id = req.params.id;
    
    const sql = "DELETE FROM insumos WHERE id_insumo = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar insumo:", err);
            return res.status(500).json({ 
                error: "Error al eliminar insumo", 
                details: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Insumo no encontrado" });
        }
        
        res.status(200).json({ 
            message: "Insumo eliminado exitosamente",
            id: id
        });
    });
});

// Ruta para buscar insumos por tipo o nombre
app.get("/insumos/buscar", (req, res) => {
    const { termino } = req.query;
    
    if (!termino) {
        return res.status(400).json({ error: "Se requiere un término de búsqueda" });
    }
    
    const sql = `
        SELECT * FROM insumos 
        WHERE tipo_insumo LIKE ? 
        OR nombre_insumo LIKE ? 
        ORDER BY fecha_creacion DESC
    `;
    
    const searchTerm = `%${termino}%`;
    
    db.query(sql, [searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error("Error al buscar insumos:", err);
            return res.status(500).json({ 
                error: "Error al buscar insumos", 
                details: err.message 
            });
        }
        
        res.status(200).json(results);
    });
});

// ===== RUTAS PARA SENSORES =====

// Ruta para crear un nuevo sensor
app.post("/sensor", upload.single("fotografia"), (req, res) => {
    // Extraer los datos del formulario
    const { 
        tipo_sensor, 
        nombre_sensor, 
        identificador, 
        referencia_sensor,
        unidad_medida,
        tiempo_escaneo,
        estado,
        descripcion 
    } = req.body;

    // Validar campos obligatorios
    if (!tipo_sensor || !nombre_sensor || !identificador || !referencia_sensor || !unidad_medida || !tiempo_escaneo || !estado) {
        return res.status(400).json({ 
            error: "Todos los campos son obligatorios excepto la descripción y fotografía" 
        });
    }

    // Ruta de la fotografía (si se subió un archivo)
    let ruta_fotografia = null;
    if (req.file) {
        ruta_fotografia = `/uploads/sensores/${req.file.filename}`;
    }

    // Consulta SQL para insertar el nuevo sensor
    const sql = `
        INSERT INTO sensores 
        (tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, 
         tiempo_escaneo, estado, descripcion, ruta_fotografia) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta
    db.query(
        sql, 
        [tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, 
         tiempo_escaneo, estado, descripcion || null, ruta_fotografia],
        (err, result) => {
            if (err) {
                console.error("Error al crear sensor:", err);
                return res.status(500).json({ 
                    error: "Error al crear sensor", 
                    details: err.message 
                });
            }
            
            res.status(201).json({ 
                message: "Sensor creado exitosamente", 
                id: result.insertId,
                result: result
            });
        }
    );
});

// Ruta para obtener todos los sensores
app.get("/sensores", (req, res) => {
    const sql = "SELECT * FROM sensores ORDER BY fecha_creacion DESC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener sensores:", err);
            return res.status(500).json({ 
                error: "Error al obtener sensores", 
                details: err.message 
            });
        }
        
        res.status(200).json(results);
    });
});

// Ruta para obtener un sensor específico por ID
app.get("/sensor/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM sensores WHERE id = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error al obtener sensor:", err);
            return res.status(500).json({ 
                error: "Error al obtener sensor", 
                details: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Sensor no encontrado" });
        }
        
        res.status(200).json(results[0]);
    });
});

// Ruta para actualizar un sensor
app.put("/sensor/:id", upload.single("fotografia"), (req, res) => {
    const id = req.params.id;
    const { 
        tipo_sensor, 
        nombre_sensor, 
        identificador, 
        referencia_sensor,
        unidad_medida,
        tiempo_escaneo,
        estado,
        descripcion 
    } = req.body;

    // Verificar si se está actualizando la fotografía
    let sqlPhoto = '';
    let sqlParams = [
        tipo_sensor, 
        nombre_sensor, 
        identificador, 
        referencia_sensor,
        unidad_medida,
        tiempo_escaneo,
        estado,
        descripcion || null, 
        id
    ];

    if (req.file) {
        const ruta_fotografia = `/uploads/sensores/${req.file.filename}`;
        sqlPhoto = ', ruta_fotografia = ?';
        sqlParams = [
            tipo_sensor, 
            nombre_sensor, 
            identificador, 
            referencia_sensor,
            unidad_medida,
            tiempo_escaneo,
            estado,
            descripcion || null, 
            ruta_fotografia,
            id
        ];
    }

    const sql = `
        UPDATE sensores 
        SET tipo_sensor = ?, nombre_sensor = ?, identificador = ?, 
            referencia_sensor = ?, unidad_medida = ?, tiempo_escaneo = ?,
            estado = ?, descripcion = ? ${sqlPhoto}
        WHERE id = ?
    `;

    db.query(sql, sqlParams, (err, result) => {
        if (err) {
            console.error("Error al actualizar sensor:", err);
            return res.status(500).json({ 
                error: "Error al actualizar sensor", 
                details: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Sensor no encontrado" });
        }
        
        res.status(200).json({ 
            message: "Sensor actualizado exitosamente",
            id: id
        });
    });
});

// Ruta para eliminar un sensor
app.delete("/sensor/:id", (req, res) => {
    const id = req.params.id;
    
    // Primero obtener la información para eliminar la foto si existe
    db.query("SELECT ruta_fotografia FROM sensores WHERE id = ?", [id], (err, results) => {
        if (err) {
            console.error("Error al buscar sensor:", err);
            return res.status(500).json({ 
                error: "Error al eliminar sensor", 
                details: err.message 
            });
        }
        
        // Eliminar de la base de datos
        db.query("DELETE FROM sensores WHERE id = ?", [id], (err, result) => {
            if (err) {
                console.error("Error al eliminar sensor:", err);
                return res.status(500).json({ 
                    error: "Error al eliminar sensor", 
                    details: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Sensor no encontrado" });
            }
            
            // Eliminar la foto si existe
            if (results.length > 0 && results[0].ruta_fotografia) {
                const filePath = path.join(__dirname, results[0].ruta_fotografia);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            res.status(200).json({ 
                message: "Sensor eliminado exitosamente",
                id: id
            });
        });
    });
});

// Ruta para buscar sensores por tipo o nombre
app.get("/sensores/buscar", (req, res) => {
    const { termino } = req.query;
    
    if (!termino) {
        return res.status(400).json({ error: "Se requiere un término de búsqueda" });
    }
    
    const sql = `
        SELECT * FROM sensores 
        WHERE tipo_sensor LIKE ? 
        OR nombre_sensor LIKE ? 
        OR identificador LIKE ?
        ORDER BY fecha_creacion DESC
    `;
    
    const searchTerm = `%${termino}%`;
    
    db.query(sql, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error("Error al buscar sensores:", err);
            return res.status(500).json({ 
                error: "Error al buscar sensores", 
                details: err.message 
            });
        }
        
        res.status(200).json(results);
    });
});