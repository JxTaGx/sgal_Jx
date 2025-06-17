/* backend/controllers/insumoController.js */
const db = require('../config/db'); // Pool de conexiones

// Crear un nuevo Insumo
async function createInsumo(req, res) {
    const { id_insumo, tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado } = req.body;

    // Validación básica
    if (!id_insumo || !tipo_insumo || !nombre_insumo || !unidad_medida) {
        return res.status(400).json({ success: false, error: "El ID, tipo, nombre y unidad de medida del insumo son obligatorios." });
    }
    
    // Validaciones numéricas
    const numCantidad = parseFloat(cantidad);
    const numValorUnitario = parseFloat(valor_unitario);
    if (isNaN(numCantidad) || numCantidad < 0) {
         return res.status(400).json({ success: false, error: "La cantidad debe ser un número no negativo." });
    }
    if (isNaN(numValorUnitario) || numValorUnitario < 0) {
         return res.status(400).json({ success: false, error: "El valor unitario debe ser un número no negativo." });
    }

    const sql = `INSERT INTO insumos (id_insumo, tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await db.pool.execute(sql, [id_insumo, tipo_insumo, nombre_insumo, descripcion || null, unidad_medida, numCantidad, numValorUnitario, estado || 'Disponible']);
        res.status(201).json({ success: true, message: "Insumo creado exitosamente.", id: result.insertId, displayId: id_insumo });
    } catch (err) {
        console.error("Error al crear insumo:", err);
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, error: "El ID del insumo ya existe." });
        }
        res.status(500).json({ success: false, error: "Error al crear el insumo.", details: err.message });
    }
}

// Obtener todos los Insumos
async function getAllInsumos(req, res) {
    const sql = "SELECT * FROM insumos ORDER BY fecha_creacion DESC";
    try {
        const [results] = await db.pool.query(sql);
        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.error("Error al obtener insumos:", err);
        res.status(500).json({ success: false, error: "Error al obtener los insumos.", details: err.message });
    }
}

// Obtener un Insumo por su ID (PK autoincremental)
async function getInsumoById(req, res) {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de insumo inválido." });
    }
    const sql = "SELECT * FROM insumos WHERE id = ?";
    try {
        const [results] = await db.pool.execute(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Insumo no encontrado." });
        }
        res.status(200).json({ success: true, data: results[0] });
    } catch (err) {
        console.error("Error al obtener insumo:", err);
        res.status(500).json({ success: false, error: "Error al obtener el insumo.", details: err.message });
    }
}

// Actualizar un Insumo por su ID (PK autoincremental)
async function updateInsumo(req, res) {
    const { id } = req.params;
    const { tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado } = req.body;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de insumo inválido para actualizar." });
    }
    
    const numCantidad = parseFloat(cantidad);
    const numValorUnitario = parseFloat(valor_unitario);
    if (cantidad !== undefined && (isNaN(numCantidad) || numCantidad < 0)) {
         return res.status(400).json({ success: false, error: "La cantidad debe ser un número no negativo." });
    }
    if (valor_unitario !== undefined && (isNaN(numValorUnitario) || numValorUnitario < 0)) {
         return res.status(400).json({ success: false, error: "El valor unitario debe ser un número no negativo." });
    }

    const sql = `UPDATE insumos SET tipo_insumo = ?, nombre_insumo = ?, descripcion = ?, unidad_medida = ?, cantidad = ?, valor_unitario = ?, estado = ? WHERE id = ?`;

    try {
        const [result] = await db.pool.execute(sql, [tipo_insumo, nombre_insumo, descripcion || null, unidad_medida, numCantidad, numValorUnitario, estado || 'Disponible', id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Insumo no encontrado para actualizar." });
        }
        if (result.changedRows === 0 && result.affectedRows === 1) {
            return res.status(200).json({ success: true, message: "No se realizaron cambios (datos iguales).", id: id });
        }
        res.status(200).json({ success: true, message: "Insumo actualizado exitosamente.", id: id });
    } catch (err) {
        console.error("Error al actualizar insumo:", err);
        res.status(500).json({ success: false, error: "Error al actualizar el insumo.", details: err.message });
    }
}

// Eliminar un Insumo por su ID (PK autoincremental)
async function deleteInsumo(req, res) {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de insumo inválido para eliminar." });
    }
    const sql = "DELETE FROM insumos WHERE id = ?";
    try {
        const [result] = await db.pool.execute(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Insumo no encontrado para eliminar." });
        }
        res.status(200).json({ success: true, message: "Insumo eliminado exitosamente.", id: id });
    } catch (err) {
        console.error("Error al eliminar insumo:", err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ success: false, error: 'Conflicto: No se puede eliminar el insumo porque está asociado a una producción.' });
        }
        res.status(500).json({ success: false, error: "Error al eliminar el insumo.", details: err.message });
    }
}

// Buscar Insumos
async function searchInsumos(req, res) {
    const { termino } = req.query;
    if (!termino) {
        return res.status(400).json({ success: false, error: "Se requiere un término de búsqueda." });
    }
    const sql = `SELECT * FROM insumos WHERE tipo_insumo LIKE ? OR nombre_insumo LIKE ? OR id_insumo LIKE ? ORDER BY fecha_creacion DESC`;
    const searchTerm = `%${termino}%`;
    try {
        const [results] = await db.pool.query(sql, [searchTerm, searchTerm, searchTerm]);
        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.error("Error al buscar insumos:", err);
        res.status(500).json({ success: false, error: "Error al buscar insumos.", details: err.message });
    }
}

module.exports = {
    createInsumo,
    getAllInsumos,
    getInsumoById,
    updateInsumo,
    deleteInsumo,
    searchInsumos,
};