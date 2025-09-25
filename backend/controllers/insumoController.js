/* backend/controllers/insumoController.js */
const db = require('../config/db');

// --- VALIDACIONES ---
function validarInsumo(data) {
    const { id_insumo, tipo_insumo, nombre_insumo, unidad_medida, cantidad, valor_unitario } = data;
    if (!id_insumo || !tipo_insumo || !nombre_insumo || !unidad_medida) {
        return "El ID, tipo, nombre y unidad de medida son obligatorios.";
    }
    if (cantidad === undefined || valor_unitario === undefined) {
         return "La cantidad y el valor unitario son obligatorios.";
    }
    const numCantidad = parseFloat(cantidad);
    const numValorUnitario = parseFloat(valor_unitario);
    if (isNaN(numCantidad) || numCantidad < 0) {
        return "La cantidad debe ser un número no negativo.";
    }
    if (isNaN(numValorUnitario) || numValorUnitario < 0) {
        return "El valor unitario debe ser un número no negativo.";
    }
    return null; // No hay errores
}

async function createInsumo(req, res) {
    const error = validarInsumo(req.body);
    if (error) {
        return res.status(400).json({ success: false, error });
    }
    
    const { id_insumo, tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado } = req.body;
    const sql = `INSERT INTO insumos (id_insumo, tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await db.pool.execute(sql, [id_insumo, tipo_insumo, nombre_insumo, descripcion || null, unidad_medida, parseFloat(cantidad), parseFloat(valor_unitario), estado || 'Disponible']);
        res.status(201).json({ success: true, message: "Insumo creado exitosamente", id: result.insertId });
    } catch (err) {
        console.error("Error al crear insumo:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: "El ID del insumo ya existe." });
        }
        res.status(500).json({ success: false, error: "Error interno al crear el insumo." });
    }
}

async function updateInsumo(req, res) {
    const error = validarInsumo(req.body);
    if (error) {
        return res.status(400).json({ success: false, error });
    }

    const { id } = req.params;
    const { tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado } = req.body;
    const sql = `UPDATE insumos SET tipo_insumo = ?, nombre_insumo = ?, descripcion = ?, unidad_medida = ?, cantidad = ?, valor_unitario = ?, estado = ? WHERE id = ?`;

    try {
        const [result] = await db.pool.execute(sql, [tipo_insumo, nombre_insumo, descripcion || null, unidad_medida, parseFloat(cantidad), parseFloat(valor_unitario), estado || 'Disponible', id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Insumo no encontrado para actualizar." });
        }
        res.status(200).json({ success: true, message: "Insumo actualizado exitosamente." });
    } catch (err) {
        console.error("Error al actualizar insumo:", err);
        res.status(500).json({ success: false, error: "Error interno al actualizar el insumo." });
    }
}

// ... (El resto de las funciones como getAllInsumos, getInsumoById, deleteInsumo se mantienen igual)
// ... (Asegúrate de copiar el resto de las funciones desde tu archivo original aquí)
async function getAllInsumos(req, res) {
    const sql = "SELECT *, id as pk_id FROM insumos ORDER BY fecha_creacion DESC";
    try {
        const [results] = await db.pool.query(sql);
         const formattedResults = results.map(insumo => ({
             ...insumo,
             id: insumo.pk_id
         }));
        res.status(200).json({ success: true, data: formattedResults });
    } catch (err) {
        console.error("Error al obtener insumos (/api/insumos):", err);
        res.status(500).json({ success: false, error: "Error al obtener insumos", details: err.message });
    }
}
async function getInsumoById(req, res) {
    const id = req.params.id; 
     if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de insumo inválido" });
    }
    const sql = "SELECT * FROM insumos WHERE id = ?";
    try {
        const [results] = await db.pool.execute(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Insumo no encontrado" });
        }
        res.status(200).json({ success: true, data: results[0] });
    } catch (err) {
        console.error("Error al obtener insumo:", err);
        res.status(500).json({ success: false, error: "Error al obtener insumo", details: err.message });
    }
}
async function deleteInsumo(req, res) {
    const id = req.params.id; 
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de insumo inválido para eliminar" });
    }
    const sql = "DELETE FROM insumos WHERE id = ?";
    try {
        const [result] = await db.pool.execute(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Insumo no encontrado para eliminar" });
        }
        res.status(200).json({ success: true, message: "Insumo eliminado exitosamente", id: id });
    } catch (err) {
        console.error("Error al eliminar insumo:", err);
         if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ success: false, error: 'No se puede eliminar el insumo porque está asociado a una producción.' });
         }
        res.status(500).json({ success: false, error: "Error al eliminar insumo", details: err.message });
    }
}
async function searchInsumos(req, res) {
    const { termino } = req.query;
    if (!termino) {
        return res.status(400).json({ error: "Se requiere un término de búsqueda" });
    }
    const sql = `SELECT * FROM insumos WHERE tipo_insumo LIKE ? OR nombre_insumo LIKE ? OR id_insumo LIKE ? ORDER BY fecha_creacion DESC`;
    const searchTerm = `%${termino}%`;
    try {
        const [results] = await db.pool.query(sql, [searchTerm, searchTerm, searchTerm]);
        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.error("Error al buscar insumos:", err);
        res.status(500).json({ error: "Error al buscar insumos", details: err.message });
    }
}


module.exports = {
    createInsumo,
    updateInsumo,
    getAllInsumos,
    getInsumoById,
    deleteInsumo,
    searchInsumos,
};