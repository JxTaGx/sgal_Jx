/* backend/controllers/insumoController.js */
const db = require('../config/db'); // Pool de conexiones

// Crear un nuevo Insumo
async function createInsumo(req, res) {
    // Asegúrate que los nombres coinciden con los enviados desde el frontend (form-crear.js)
    const { id_insumo, tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado } = req.body;

    // Validación básica
    if (!id_insumo || !tipo_insumo || !nombre_insumo || !unidad_medida) {
        return res.status(400).json({ success: false, error: "El ID, tipo, nombre y unidad de medida del insumo son obligatorios" });
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
        res.status(201).json({ success: true, message: "Insumo creado exitosamente", id: result.insertId, displayId: id_insumo });
    } catch (err) {
        console.error("Error al crear insumo:", err);
         if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, error: "El ID del insumo ya existe." });
        }
        res.status(500).json({ success: false, error: "Error al crear insumo", details: err.message });
    }
}

// Obtener todos los Insumos (para API general si es necesario)
async function getAllInsumos(req, res) {
    const sql = "SELECT *, id as pk_id FROM insumos ORDER BY fecha_creacion DESC";
    try {
        const [results] = await db.pool.query(sql);
         const formattedResults = results.map(insumo => ({
             ...insumo,
             id: insumo.pk_id
         }));
        res.status(200).json({ success: true, data: formattedResults }); // <--- Mismo formato de respuesta
    } catch (err) {
        console.error("Error al obtener insumos (/api/insumos):", err);
        res.status(500).json({ success: false, error: "Error al obtener insumos", details: err.message });
    }
}

// Obtener un Insumo por ID (PK autoincremental)
async function getInsumoById(req, res) {
    const id = req.params.id; // ID numérico autoincremental
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

// Actualizar un Insumo por ID (PK autoincremental)
async function updateInsumo(req, res) {
    const id = req.params.id; // ID numérico autoincremental
    const { tipo_insumo, nombre_insumo, descripcion, unidad_medida, cantidad, valor_unitario, estado } = req.body;

     if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: "ID de insumo inválido para actualizar" });
    }
     // Validar campos numéricos
    const numCantidad = parseFloat(cantidad);
    const numValorUnitario = parseFloat(valor_unitario);
     if (cantidad !== undefined && (isNaN(numCantidad) || numCantidad < 0)) {
         return res.status(400).json({ success: false, error: "La cantidad debe ser un número no negativo." });
     }
     if (valor_unitario !== undefined && (isNaN(numValorUnitario) || numValorUnitario < 0)) {
         return res.status(400).json({ success: false, error: "El valor unitario debe ser un número no negativo." });
     }

    // No actualizamos id_insumo aquí, se asume que no cambia.
    // El campo valor_total se calcula automáticamente por la BD.
    const sql = `UPDATE insumos SET tipo_insumo = ?, nombre_insumo = ?, descripcion = ?, unidad_medida = ?, cantidad = ?, valor_unitario = ?, estado = ? WHERE id = ?`;

    try {
        const [result] = await db.pool.execute(sql, [
            tipo_insumo, nombre_insumo, descripcion || null, unidad_medida,
            numCantidad, numValorUnitario, estado || 'Disponible', id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Insumo no encontrado para actualizar" });
        }
         if (result.changedRows === 0 && result.affectedRows === 1) {
            return res.status(200).json({ success: true, message: "No se realizaron cambios (datos iguales).", id: id });
         }
        res.status(200).json({ success: true, message: "Insumo actualizado exitosamente", id: id });
    } catch (err) {
        console.error("Error al actualizar insumo:", err);
        res.status(500).json({ success: false, error: "Error al actualizar insumo", details: err.message });
    }
}

// Eliminar un Insumo por ID (PK autoincremental)
async function deleteInsumo(req, res) {
    const id = req.params.id; // ID numérico autoincremental
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
         // Manejar error de clave foránea si los insumos son referenciados en 'productions'
         if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ success: false, error: 'No se puede eliminar el insumo porque está asociado a una producción.' });
         }
        res.status(500).json({ success: false, error: "Error al eliminar insumo", details: err.message });
    }
}

// Buscar Insumos
async function searchInsumos(req, res) {
    const { termino } = req.query;
    if (!termino) {
        return res.status(400).json({ error: "Se requiere un término de búsqueda" });
    }
    const sql = `SELECT * FROM insumos WHERE tipo_insumo LIKE ? OR nombre_insumo LIKE ? OR id_insumo LIKE ? ORDER BY fecha_creacion DESC`;
    const searchTerm = `%${termino}%`;
    try {
        const [results] = await db.pool.query(sql, [searchTerm, searchTerm, searchTerm]);
        res.status(200).json({ success: true, data: results }); // Mantener consistencia con getAllInsumos
    } catch (err) {
        console.error("Error al buscar insumos:", err);
        res.status(500).json({ error: "Error al buscar insumos", details: err.message });
    }
}

module.exports = {
    createInsumo,
    getAllInsumos, // Exportar para /api/insumos
    getInsumoById,
    updateInsumo,
    deleteInsumo,
    searchInsumos,
};