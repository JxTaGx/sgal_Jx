/* backend/controllers/cicloCultivoController.js */
const db = require('../config/db'); // Pool de conexiones
const path = require('path');
const fs = require('fs').promises; // Usar promesas para operaciones de archivo

// Crear un nuevo Ciclo de Cultivo
async function createCicloCultivo(req, res) {
    const { id_ciclo, nombre_ciclo, descripcion, periodo_siembra, novedades, estado } = req.body;

    // Validación básica de campos obligatorios
    if (!id_ciclo || !nombre_ciclo) {
        // Si hay un archivo subido, se elimina ya que la operación falló
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
                console.log('Archivo temporal eliminado por error de validación:', req.file.path);
            } catch (unlinkErr) {
                console.error('Error al eliminar archivo temporal:', unlinkErr);
            }
        }
        return res.status(400).json({ success: false, error: "El ID y nombre del ciclo son obligatorios." });
    }

    // Se construye la ruta relativa para acceder a la fotografía desde el frontend
    let ruta_fotografia = req.file ? `/uploads/ciclos/${req.file.filename}` : null;

    const sql = `INSERT INTO ciclo_cultivo (id_ciclo, nombre_ciclo, descripcion, ruta_fotografia, periodo_siembra, novedades, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    try {
        await db.pool.execute(sql, [id_ciclo, nombre_ciclo, descripcion, ruta_fotografia, periodo_siembra, novedades, estado || 'pendiente']);
        res.status(201).json({ success: true, message: "Ciclo de cultivo creado exitosamente.", id: id_ciclo });
    } catch (err) {
        console.error("Error al crear ciclo de cultivo:", err);
         // Si la inserción en la BD falla, también se elimina el archivo subido
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
                console.log('Archivo temporal eliminado por error de DB:', req.file.path);
            } catch (unlinkErr) {
                console.error('Error al eliminar archivo temporal tras error de DB:', unlinkErr);
            }
        }
        // Manejar error de ID duplicado
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, error: "El ID del ciclo de cultivo ya existe." });
        }
        res.status(500).json({ success: false, error: "Error al crear el ciclo de cultivo.", details: err.message });
    }
}

// Obtener todos los Ciclos de Cultivo
async function getAllCiclosCultivo(req, res) {
    const sql = "SELECT * FROM ciclo_cultivo ORDER BY fecha_creacion DESC";
    try {
        const [results] = await db.pool.query(sql);
        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.error("Error al obtener ciclos de cultivo:", err);
        res.status(500).json({ success: false, error: "Error al obtener los ciclos de cultivo.", details: err.message });
    }
}

// Obtener un Ciclo de Cultivo por ID
async function getCicloCultivoById(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, error: "No se proporcionó un ID de ciclo." });
    }
    const sql = "SELECT * FROM ciclo_cultivo WHERE id_ciclo = ?";
    try {
        const [results] = await db.pool.execute(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Ciclo de cultivo no encontrado." });
        }
        res.status(200).json({ success: true, data: results[0] });
    } catch (err) {
        console.error("Error al obtener ciclo de cultivo:", err);
        res.status(500).json({ success: false, error: "Error al obtener el ciclo de cultivo.", details: err.message });
    }
}

// Actualizar un Ciclo de Cultivo
async function updateCicloCultivo(req, res) {
    const { id } = req.params;
    const { nombre_ciclo, descripcion, periodo_siembra, novedades, estado } = req.body;
    let connection;

    if (!id) {
        return res.status(400).json({ success: false, error: "No se proporcionó un ID de ciclo para actualizar." });
    }
    if (!nombre_ciclo && !descripcion && !periodo_siembra && !novedades && !estado && !req.file) {
         return res.status(400).json({ success: false, error: "No se proporcionaron datos para actualizar." });
    }

    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        let oldPhotoPath = null;
        // Si se sube una nueva foto, se busca la ruta de la anterior para eliminarla después
        if (req.file) {
            const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM ciclo_cultivo WHERE id_ciclo = ?", [id]);
            if (selectResults.length > 0 && selectResults[0].ruta_fotografia) {
                oldPhotoPath = selectResults[0].ruta_fotografia;
            }
        }

        // Construcción dinámica de la consulta de actualización
        const fields = { nombre_ciclo, descripcion, periodo_siembra, novedades, estado };
        if (req.file) {
            fields.ruta_fotografia = `/uploads/ciclos/${req.file.filename}`;
        }

        const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
        const sqlParams = [...Object.values(fields), id];
        const sqlUpdate = `UPDATE ciclo_cultivo SET ${setClauses} WHERE id_ciclo = ?`;

        const [result] = await connection.execute(sqlUpdate, sqlParams);

        if (result.affectedRows === 0) {
            await connection.rollback();
            if (req.file) { try { await fs.unlink(req.file.path); } catch (e) { console.error("Error eliminando archivo tras fallo de actualización", e); } }
            return res.status(404).json({ success: false, error: "Ciclo de cultivo no encontrado para actualizar." });
        }

        // Si la actualización fue exitosa y se subió una nueva foto, se elimina la antigua
        if (req.file && oldPhotoPath) {
            const fullOldPath = path.join(__dirname, '..', oldPhotoPath);
            try {
                await fs.unlink(fullOldPath);
                console.log("Foto antigua eliminada:", fullOldPath);
            } catch (fileErr) {
                console.error("Error eliminando foto antigua:", fileErr);
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Ciclo de cultivo actualizado exitosamente.", id: id });

    } catch (err) {
        if (connection) await connection.rollback();
        if (req.file) { try { await fs.unlink(req.file.path); } catch (e) { console.error("Error eliminando archivo tras fallo de actualización", e); } }
        console.error("Error al actualizar ciclo de cultivo:", err);
        res.status(500).json({ success: false, error: "Error al actualizar el ciclo de cultivo.", details: err.message });
    } finally {
        if (connection) connection.release();
    }
}

// Eliminar un Ciclo de Cultivo
async function deleteCicloCultivo(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, error: "No se proporcionó un ID de ciclo para eliminar." });
    }
    let connection;
    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        // 1. Obtener la ruta de la foto antes de eliminar el registro de la BD
        const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM ciclo_cultivo WHERE id_ciclo = ?", [id]);
        const photoPath = selectResults.length > 0 ? selectResults[0].ruta_fotografia : null;

        // 2. Eliminar el registro de la BD
        const [deleteResult] = await connection.execute("DELETE FROM ciclo_cultivo WHERE id_ciclo = ?", [id]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: "Ciclo de cultivo no encontrado para eliminar." });
        }

        // 3. Si existía una foto, eliminar el archivo del servidor
        if (photoPath) {
            const fullPath = path.join(__dirname, '..', photoPath);
            try {
                await fs.unlink(fullPath);
                console.log("Archivo de foto de ciclo eliminado:", fullPath);
            } catch (fileErr) {
                console.error("Error eliminando archivo de foto de ciclo:", fileErr);
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Ciclo de cultivo eliminado exitosamente.", id: id });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error al eliminar ciclo de cultivo:", err);
        // Manejar error de clave foránea si el ciclo está en uso en una producción
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, error: 'Conflicto: No se puede eliminar el ciclo porque está asociado a una producción.' });
        }
        res.status(500).json({ success: false, error: "Error al eliminar el ciclo de cultivo.", details: err.message });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    createCicloCultivo,
    getAllCiclosCultivo,
    getCicloCultivoById,
    updateCicloCultivo,
    deleteCicloCultivo,
};