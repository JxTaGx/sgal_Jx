/* backend/controllers/sensorController.js */
const db = require('../config/db'); // Pool de conexiones
const path = require('path');
const fs = require('fs').promises; // Usar promesas para operaciones de archivo

// Crear un nuevo Sensor
async function createSensor(req, res) {
    // Asegúrate que los nombres coincidan con los enviados desde el frontend (create-sensor.html)
    const { tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion } = req.body;

    // Validación básica
    if (!tipo_sensor || !nombre_sensor || !identificador || !referencia_sensor || !unidad_medida || !tiempo_escaneo || !estado) {
         if (req.file) {
            try { await fs.unlink(req.file.path); console.log('Archivo temporal eliminado:', req.file.path); }
            catch (unlinkErr) { console.error('Error al eliminar archivo temporal:', unlinkErr); }
        }
        return res.status(400).json({ success: false, error: "Todos los campos son obligatorios excepto la descripción y fotografía" });
    }

    let ruta_fotografia = null;
    if (req.file) {
        ruta_fotografia = `/uploads/sensores/${req.file.filename}`;
    }

    const sql = `INSERT INTO sensores (tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion, ruta_fotografia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await db.pool.execute(sql, [tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion || null, ruta_fotografia]);
        res.status(201).json({ success: true, message: "Sensor creado exitosamente", id: result.insertId });
    } catch (err) {
        console.error("Error al crear sensor:", err);
         if (req.file) {
            try { await fs.unlink(req.file.path); console.log('Archivo temporal eliminado por error de DB:', req.file.path); }
            catch (unlinkErr) { console.error('Error al eliminar archivo temporal tras error de DB:', unlinkErr); }
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "El identificador del sensor ya existe." });
        }
        res.status(500).json({ success: false, error: "Error al crear sensor", details: err.message });
    }
}

// Obtener todos los Sensores
async function getAllSensores(req, res) {
    const sql = "SELECT * FROM sensores ORDER BY fecha_creacion DESC";
    try {
        const [results] = await db.pool.query(sql);
        res.status(200).json({ success: true, data: results }); // Enviar respuesta consistente
    } catch (err) {
        console.error("Error al obtener sensores:", err);
        res.status(500).json({ success: false, error: "Error al obtener sensores", details: err.message });
    }
}

// Obtener un Sensor por ID (PK autoincremental)
async function getSensorById(req, res) {
    const id = req.params.id; // ID numérico autoincremental
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de sensor inválido" });
    }
    const sql = "SELECT * FROM sensores WHERE id = ?";
    try {
        const [results] = await db.pool.execute(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Sensor no encontrado" });
        }
        res.status(200).json({ success: true, data: results[0] });
    } catch (err) {
        console.error("Error al obtener sensor:", err);
        res.status(500).json({ success: false, error: "Error al obtener sensor", details: err.message });
    }
}

// Actualizar un Sensor por ID (PK autoincremental)
async function updateSensor(req, res) {
    const id = req.params.id; // ID numérico autoincremental
    const { tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion } = req.body;
    let connection;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de sensor inválido para actualizar" });
    }
     if (!tipo_sensor && !nombre_sensor && !identificador && !referencia_sensor && !unidad_medida && !tiempo_escaneo && !estado && !descripcion && !req.file) {
         return res.status(400).json({ success: false, error: "No se proporcionaron datos para actualizar." });
     }

    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        let oldPhotoPath = null;
        if (req.file) {
            const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM sensores WHERE id = ?", [id]);
            if (selectResults.length > 0) {
                oldPhotoPath = selectResults[0].ruta_fotografia;
            }
        }

        let sqlUpdate = `UPDATE sensores SET tipo_sensor = ?, nombre_sensor = ?, identificador = ?, referencia_sensor = ?, unidad_medida = ?, tiempo_escaneo = ?, estado = ?, descripcion = ?`;
        let sqlParams = [tipo_sensor, nombre_sensor, identificador, referencia_sensor, unidad_medida, tiempo_escaneo, estado, descripcion || null];

        if (req.file) {
            const ruta_fotografia = `/uploads/sensores/${req.file.filename}`;
            sqlUpdate += `, ruta_fotografia = ?`;
            sqlParams.push(ruta_fotografia);
        }
        sqlUpdate += ` WHERE id = ?`;
        sqlParams.push(id);

        const [result] = await connection.execute(sqlUpdate, sqlParams);

        if (result.affectedRows === 0) {
            await connection.rollback();
            if (req.file) {
                try { await fs.unlink(req.file.path); } catch (e) { console.error("Error eliminando archivo tras fallo de actualización", e); }
            }
            return res.status(404).json({ success: false, error: "Sensor no encontrado para actualizar" });
        }

        if (req.file && oldPhotoPath) {
            const fullOldPath = path.join(__dirname, '..', oldPhotoPath);
            try {
                await fs.unlink(fullOldPath);
                console.log("Foto antigua de sensor eliminada:", fullOldPath);
            } catch (fileErr) {
                console.error("Error eliminando foto antigua de sensor:", fileErr);
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Sensor actualizado exitosamente", id: id });

    } catch (err) {
        console.error("Error al actualizar sensor:", err);
        if (connection) await connection.rollback();
        if (req.file) {
             try { await fs.unlink(req.file.path); } catch (e) { console.error("Error eliminando archivo tras fallo de actualización", e); }
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "El identificador del sensor ya existe." });
        }
        res.status(500).json({ success: false, error: "Error al actualizar sensor", details: err.message });
    } finally {
        if (connection) connection.release();
    }
}

// Eliminar un Sensor por ID (PK autoincremental)
async function deleteSensor(req, res) {
    const id = req.params.id; // ID numérico autoincremental
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de sensor inválido para eliminar" });
    }
    let connection;
    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        // 1. Obtener ruta de foto
        const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM sensores WHERE id = ?", [id]);
        const photoPath = selectResults.length > 0 ? selectResults[0].ruta_fotografia : null;

        // 2. Eliminar registro
        const [deleteResult] = await connection.execute("DELETE FROM sensores WHERE id = ?", [id]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: "Sensor no encontrado para eliminar" });
        }

        // 3. Eliminar archivo de foto
        if (photoPath) {
            const fullPath = path.join(__dirname, '..', photoPath);
            try {
                await fs.unlink(fullPath);
                console.log("Archivo de foto de sensor eliminado:", fullPath);
            } catch (fileErr) {
                console.error("Error eliminando archivo de foto de sensor:", fileErr);
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Sensor eliminado exitosamente", id: id });

    } catch (err) {
        console.error("Error al eliminar sensor:", err);
        if (connection) await connection.rollback();
         // Manejar error de clave foránea si los sensores son referenciados en 'productions'
         if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ success: false, error: 'No se puede eliminar el sensor porque está asociado a una producción.' });
         }
        res.status(500).json({ success: false, error: "Error al eliminar sensor", details: err.message });
    } finally {
        if (connection) connection.release();
    }
}

// Buscar Sensores
async function searchSensores(req, res) {
    const { termino } = req.query;
    if (!termino) {
        return res.status(400).json({ error: "Se requiere un término de búsqueda" });
    }
    const sql = `SELECT * FROM sensores WHERE tipo_sensor LIKE ? OR nombre_sensor LIKE ? OR identificador LIKE ? ORDER BY fecha_creacion DESC`;
    const searchTerm = `%${termino}%`;
    try {
        const [results] = await db.pool.query(sql, [searchTerm, searchTerm, searchTerm]);
        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.error("Error al buscar sensores:", err);
        res.status(500).json({ error: "Error al buscar sensores", details: err.message });
    }
}

module.exports = {
    createSensor,
    getAllSensores,
    getSensorById,
    updateSensor,
    deleteSensor,
    searchSensores,
};