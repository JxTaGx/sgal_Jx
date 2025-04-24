/* backend/controllers/cicloCultivoController.js */
const db = require('../config/db'); // Pool de conexiones
const path = require('path');
const fs = require('fs').promises; // Usar promesas para operaciones de archivo

// Crear un nuevo Ciclo de Cultivo
async function createCicloCultivo(req, res) {
    const { id_ciclo, nombre_ciclo, descripcion, periodo_siembra, novedades, estado } = req.body;

    // Validación básica
    if (!id_ciclo || !nombre_ciclo) {
        // Si hay un archivo subido, intentar eliminarlo ya que la operación falló
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
                console.log('Archivo temporal eliminado por error de validación:', req.file.path);
            } catch (unlinkErr) {
                console.error('Error al eliminar archivo temporal:', unlinkErr);
            }
        }
        return res.status(400).json({ success: false, error: "El ID y nombre del ciclo son obligatorios" });
    }

    let ruta_fotografia = null;
    if (req.file) {
        // Guardar ruta relativa accesible desde el servidor estático
        // Asumiendo que 'uploads' se sirve estáticamente en el servidor principal
        ruta_fotografia = `/uploads/ciclos/${req.file.filename}`;
    }

    const sql = `INSERT INTO ciclo_cultivo (id_ciclo, nombre_ciclo, descripcion, ruta_fotografia, periodo_siembra, novedades, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await db.pool.execute(sql, [id_ciclo, nombre_ciclo, descripcion, ruta_fotografia, periodo_siembra, novedades, estado || 'pendiente']);
        res.status(201).json({ success: true, message: "Ciclo de cultivo creado exitosamente", id: id_ciclo });
    } catch (err) {
        console.error("Error al crear ciclo de cultivo:", err);
         // Intentar eliminar archivo subido si la inserción falla
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
                console.log('Archivo temporal eliminado por error de DB:', req.file.path);
            } catch (unlinkErr) {
                console.error('Error al eliminar archivo temporal tras error de DB:', unlinkErr);
            }
        }
        // Manejar error de duplicado de ID
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, error: "El ID del ciclo de cultivo ya existe." });
        }
        res.status(500).json({ success: false, error: "Error al crear ciclo de cultivo", details: err.message });
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
        res.status(500).json({ success: false, error: "Error al obtener ciclos de cultivo", details: err.message });
    }
}

// Obtener un Ciclo de Cultivo por ID
async function getCicloCultivoById(req, res) {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ success: false, error: "ID de ciclo no proporcionado" });
    }
    const sql = "SELECT * FROM ciclo_cultivo WHERE id_ciclo = ?";
    try {
        const [results] = await db.pool.execute(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Ciclo de cultivo no encontrado" });
        }
        res.status(200).json({ success: true, data: results[0] });
    } catch (err) {
        console.error("Error al obtener ciclo de cultivo:", err);
        res.status(500).json({ success: false, error: "Error al obtener ciclo de cultivo", details: err.message });
    }
}

// Actualizar un Ciclo de Cultivo
async function updateCicloCultivo(req, res) {
    const id = req.params.id;
    const { nombre_ciclo, descripcion, periodo_siembra, novedades, estado } = req.body;
    let connection;

    // Validar que el ID exista
    if (!id) {
        return res.status(400).json({ success: false, error: "ID de ciclo no proporcionado para actualizar" });
    }
    // Validar que al menos un campo se esté actualizando (o la imagen)
    if (!nombre_ciclo && !descripcion && !periodo_siembra && !novedades && !estado && !req.file) {
         return res.status(400).json({ success: false, error: "No se proporcionaron datos para actualizar." });
    }

    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        let oldPhotoPath = null;
        // Si se sube una nueva foto, obtener la ruta de la foto anterior para eliminarla
        if (req.file) {
            const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM ciclo_cultivo WHERE id_ciclo = ?", [id]);
            if (selectResults.length > 0) {
                oldPhotoPath = selectResults[0].ruta_fotografia;
            }
        }

        let sqlUpdate = `UPDATE ciclo_cultivo SET nombre_ciclo = ?, descripcion = ?, periodo_siembra = ?, novedades = ?, estado = ?`;
        let sqlParams = [nombre_ciclo, descripcion, periodo_siembra, novedades, estado];

        if (req.file) {
            const ruta_fotografia = `/uploads/ciclos/${req.file.filename}`;
            sqlUpdate += `, ruta_fotografia = ?`;
            sqlParams.push(ruta_fotografia);
        }
        sqlUpdate += ` WHERE id_ciclo = ?`;
        sqlParams.push(id);

        const [result] = await connection.execute(sqlUpdate, sqlParams);

        if (result.affectedRows === 0) {
            await connection.rollback();
             // Si se subió un archivo pero no se encontró el registro, eliminar el archivo subido
            if (req.file) {
                try { await fs.unlink(req.file.path); } catch (e) { console.error("Error eliminando archivo tras fallo de actualización", e); }
            }
            return res.status(404).json({ success: false, error: "Ciclo de cultivo no encontrado para actualizar" });
        }

        // Si se actualizó y había una foto anterior, eliminarla
        if (req.file && oldPhotoPath) {
            const fullOldPath = path.join(__dirname, '..', oldPhotoPath); // Ajustar ruta relativa
            try {
                await fs.unlink(fullOldPath);
                console.log("Foto antigua eliminada:", fullOldPath);
            } catch (fileErr) {
                console.error("Error eliminando foto antigua:", fileErr);
                // No fallar la operación principal por error al eliminar archivo viejo
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Ciclo de cultivo actualizado exitosamente", id: id });

    } catch (err) {
        console.error("Error al actualizar ciclo de cultivo:", err);
        if (connection) await connection.rollback();
        // Si se subió un archivo pero la actualización falló, eliminar el archivo nuevo
        if (req.file) {
            try { await fs.unlink(req.file.path); } catch (e) { console.error("Error eliminando archivo tras fallo de actualización", e); }
        }
        res.status(500).json({ success: false, error: "Error al actualizar ciclo de cultivo", details: err.message });
    } finally {
        if (connection) connection.release();
    }
}

// Eliminar un Ciclo de Cultivo
async function deleteCicloCultivo(req, res) {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ success: false, error: "ID de ciclo no proporcionado para eliminar" });
    }
    let connection;
    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        // 1. Obtener ruta de la foto antes de eliminar
        const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM ciclo_cultivo WHERE id_ciclo = ?", [id]);
        const photoPath = selectResults.length > 0 ? selectResults[0].ruta_fotografia : null;

        // 2. Eliminar registro de la BD
        const [deleteResult] = await connection.execute("DELETE FROM ciclo_cultivo WHERE id_ciclo = ?", [id]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: "Ciclo de cultivo no encontrado para eliminar" });
        }

        // 3. Eliminar archivo de foto si existe
        if (photoPath) {
            const fullPath = path.join(__dirname, '..', photoPath); // Ajustar ruta relativa
            try {
                await fs.unlink(fullPath);
                console.log("Archivo de foto de ciclo eliminado:", fullPath);
            } catch (fileErr) {
                console.error("Error eliminando archivo de foto de ciclo:", fileErr);
                // Loguear el error pero no fallar la operación principal
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Ciclo de cultivo eliminado exitosamente", id: id });

    } catch (err) {
        console.error("Error al eliminar ciclo de cultivo:", err);
        if (connection) await connection.rollback();
        // Revisar si el error es por clave foránea (si está vinculado a producciones)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, error: 'No se puede eliminar el ciclo porque está asociado a una producción.' });
        }
        res.status(500).json({ success: false, error: "Error al eliminar ciclo de cultivo", details: err.message });
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