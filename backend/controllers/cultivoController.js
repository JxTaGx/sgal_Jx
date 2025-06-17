/* backend/controllers/cultivoController.js */
const db = require('../config/db'); // Pool de conexiones
const path = require('path');
const fs = require('fs').promises; // Usar promesas para operaciones de archivo

// Crear un nuevo Cultivo
async function createCultivo(req, res) {
    const { id_cultivo, tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion } = req.body;

    // Validación básica de campos obligatorios
    if (!id_cultivo || !tipo_cultivo || !nombre_cultivo) {
        if (req.file) {
            try { await fs.unlink(req.file.path); }
            catch (unlinkErr) { console.error('Error al eliminar archivo temporal:', unlinkErr); }
        }
        return res.status(400).json({ success: false, error: "El ID, tipo y nombre del cultivo son obligatorios." });
    }

    let ruta_fotografia = req.file ? `/uploads/cultivos/${req.file.filename}` : null;

    const sql = `INSERT INTO cultivos (id_cultivo, tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion, ruta_fotografia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await db.pool.execute(sql, [id_cultivo, tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion, ruta_fotografia]);
        res.status(201).json({ success: true, message: "Cultivo creado exitosamente.", id: id_cultivo, db_id: result.insertId });
    } catch (err) {
        console.error("Error al crear cultivo:", err);
        if (req.file) {
            try { await fs.unlink(req.file.path); }
            catch (unlinkErr) { console.error('Error al eliminar archivo temporal tras error de DB:', unlinkErr); }
        }
         if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, error: "El ID del cultivo ya existe." });
        }
        res.status(500).json({ success: false, error: "Error al crear el cultivo.", details: err.message });
    }
}

// Obtener todos los Cultivos
async function getAllCultivos(req, res) {
    const sql = "SELECT * FROM cultivos ORDER BY fecha_creacion DESC";
    try {
        const [results] = await db.pool.query(sql);
        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.error("Error al obtener cultivos:", err);
        res.status(500).json({ success: false, error: "Error al obtener los cultivos.", details: err.message });
    }
}

// Obtener un Cultivo por su ID de negocio (id_cultivo)
async function getCultivoById(req, res) {
    const { id } = req.params; // El parámetro de ruta es el id_cultivo
     if (!id) {
        return res.status(400).json({ success: false, error: "No se proporcionó un ID de cultivo." });
    }
    const sql = "SELECT * FROM cultivos WHERE id_cultivo = ?";
    try {
        const [results] = await db.pool.execute(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Cultivo no encontrado." });
        }
        res.status(200).json({ success: true, data: results[0] });
    } catch (err) {
        console.error("Error al obtener cultivo:", err);
        res.status(500).json({ success: false, error: "Error al obtener el cultivo.", details: err.message });
    }
}

// Actualizar un Cultivo
async function updateCultivo(req, res) {
    const { id } = req.params; // El parámetro de ruta es el id_cultivo
    const { tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion } = req.body;
    let connection;

     if (!id) {
        return res.status(400).json({ success: false, error: "No se proporcionó un ID de cultivo para actualizar." });
    }
     if (!tipo_cultivo && !nombre_cultivo && !tamano && !ubicacion && !estado && !descripcion && !req.file) {
         return res.status(400).json({ success: false, error: "No se proporcionaron datos para actualizar." });
     }

    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        let oldPhotoPath = null;
        if (req.file) {
            const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM cultivos WHERE id_cultivo = ?", [id]);
            if (selectResults.length > 0 && selectResults[0].ruta_fotografia) {
                oldPhotoPath = selectResults[0].ruta_fotografia;
            }
        }

        let sqlUpdate = `UPDATE cultivos SET tipo_cultivo = ?, nombre_cultivo = ?, tamano = ?, ubicacion = ?, estado = ?, descripcion = ?`;
        let sqlParams = [tipo_cultivo, nombre_cultivo, tamano, ubicacion, estado, descripcion];

        if (req.file) {
            const ruta_fotografia = `/uploads/cultivos/${req.file.filename}`;
            sqlUpdate += `, ruta_fotografia = ?`;
            sqlParams.push(ruta_fotografia);
        }
        sqlUpdate += ` WHERE id_cultivo = ?`;
        sqlParams.push(id);

        const [result] = await connection.execute(sqlUpdate, sqlParams);

        if (result.affectedRows === 0) {
            await connection.rollback();
            if (req.file) { try { await fs.unlink(req.file.path); } catch (e) { console.error("Error eliminando archivo tras fallo de actualización", e); } }
            return res.status(404).json({ success: false, error: "Cultivo no encontrado para actualizar." });
        }

        if (req.file && oldPhotoPath) {
            const fullOldPath = path.join(__dirname, '..', oldPhotoPath);
            try {
                await fs.unlink(fullOldPath);
                console.log("Foto antigua de cultivo eliminada:", fullOldPath);
            } catch (fileErr) {
                console.error("Error eliminando foto antigua de cultivo:", fileErr);
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Cultivo actualizado exitosamente.", id: id });

    } catch (err) {
        if (connection) await connection.rollback();
        if (req.file) { try { await fs.unlink(req.file.path); } catch (e) { console.error("Error eliminando archivo tras fallo de actualización", e); } }
        console.error("Error al actualizar cultivo:", err);
        res.status(500).json({ success: false, error: "Error al actualizar el cultivo.", details: err.message });
    } finally {
        if (connection) connection.release();
    }
}

// Eliminar un Cultivo
async function deleteCultivo(req, res) {
    const { id } = req.params; // El parámetro de ruta es el id_cultivo
    if (!id) {
        return res.status(400).json({ success: false, error: "No se proporcionó un ID de cultivo para eliminar." });
    }
    let connection;
    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        const [selectResults] = await connection.execute("SELECT ruta_fotografia FROM cultivos WHERE id_cultivo = ?", [id]);
        const photoPath = selectResults.length > 0 ? selectResults[0].ruta_fotografia : null;

        const [deleteResult] = await connection.execute("DELETE FROM cultivos WHERE id_cultivo = ?", [id]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: "Cultivo no encontrado para eliminar." });
        }

        if (photoPath) {
            const fullPath = path.join(__dirname, '..', photoPath);
            try {
                await fs.unlink(fullPath);
                console.log("Archivo de foto de cultivo eliminado:", fullPath);
            } catch (fileErr) {
                console.error("Error eliminando archivo de foto de cultivo:", fileErr);
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Cultivo eliminado exitosamente.", id: id });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error al eliminar cultivo:", err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, error: 'Conflicto: No se puede eliminar el cultivo porque está asociado a una producción.' });
        }
        res.status(500).json({ success: false, error: "Error al eliminar el cultivo.", details: err.message });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    createCultivo,
    getAllCultivos,
    getCultivoById,
    updateCultivo,
    deleteCultivo,
};