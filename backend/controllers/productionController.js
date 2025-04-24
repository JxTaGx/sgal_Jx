/* backend/controllers/productionController.js */
const db = require('../config/db'); // Pool de conexiones

// Crear una nueva Producción
async function createProduction(req, res) {
    const { name, responsible, cultivation, cycle, sensors, supplies, startDate, endDate } = req.body;

    // Validación básica (puedes hacerla más robusta)
    if (!name || !responsible || !cultivation || !cycle || !startDate || !endDate || !Array.isArray(sensors) || !Array.isArray(supplies)) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios o tienen formato incorrecto (sensors/supplies deben ser arrays)' });
    }
    if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
        return res.status(400).json({ success: false, error: 'Formato de fecha inválido.' });
    }
    if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ success: false, error: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }

    // Convertir arrays a strings separados por comas para almacenar en la BD
    const sensorsStr = sensors.join(',');
    const suppliesStr = supplies.join(',');

    const sql = `INSERT INTO productions (name, responsible, cultivation, cycle, sensors, supplies, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`;

    try {
        const [result] = await db.pool.query(sql, [name, responsible, cultivation, cycle, sensorsStr, suppliesStr, startDate, endDate]);
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
}

// Obtener todas las Producciones
async function getAllProductions(req, res) {
    // Unir con otras tablas para obtener nombres en lugar de solo IDs
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
        const [results] = await db.pool.query(sql);
        // Convertir strings de sensores/insumos de nuevo a arrays para la respuesta
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
}

// Obtener una Producción por ID
async function getProductionById(req, res) {
    const productionId = req.params.id;
    if (!productionId || isNaN(parseInt(productionId))) {
        return res.status(400).json({ success: false, error: 'ID de producción inválido' });
    }
    // Unir con otras tablas para obtener nombres
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
        const [results] = await db.pool.query(sql, [productionId]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'Producción no encontrada' });
        }
        // Formatear sensores/insumos como arrays
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
}

// Actualizar una Producción por ID
async function updateProduction(req, res) {
    const id = req.params.id;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: 'ID de producción inválido' });
    }

    // No se permite actualizar start_date
    const {
        name, responsible, cultivation, cycle,
        sensors, supplies, // Espera arrays
        end_date, status
    } = req.body;

    // Validación
    if (!name || !responsible || !cultivation || !cycle || !end_date || !status || !Array.isArray(sensors) || !Array.isArray(supplies)) {
        return res.status(400).json({ success: false, error: 'Faltan campos obligatorios o tienen formato incorrecto (sensors/supplies deben ser arrays)' });
    }
    if (isNaN(new Date(end_date).getTime())) {
        return res.status(400).json({ success: false, error: 'Formato de fecha de fin inválido.' });
    }
    // Validación adicional: fecha de fin vs fecha de inicio (necesitarías obtener la fecha de inicio primero)
    // Por simplicidad, la omitimos aquí pero sería bueno añadirla

    const sensorsStr = sensors.join(',');
    const suppliesStr = supplies.join(',');

    const sql = `
        UPDATE productions
        SET name = ?, responsible = ?, cultivation = ?, cycle = ?,
            sensors = ?, supplies = ?, end_date = ?, status = ?
        WHERE id = ?`;
    const params = [name, responsible, cultivation, cycle, sensorsStr, suppliesStr, end_date, status, id];

    try {
        const [result] = await db.pool.query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Producción no encontrada para actualizar' });
        }
        if (result.changedRows === 0 && result.affectedRows === 1) {
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
}

// Eliminar una Producción por ID
async function deleteProduction(req, res) {
    const id = req.params.id;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, error: 'ID de producción inválido' });
    }
    const sql = 'DELETE FROM productions WHERE id = ?';
    try {
        const [result] = await db.pool.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Producción no encontrada para eliminar' });
        }
        res.json({ success: true, message: 'Producción eliminada exitosamente' });
    } catch (err) {
        console.error('Error deleting production:', err);
        // Verificar si hay otras tablas que dependan de 'productions'
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ success: false, error: 'No se puede eliminar la producción porque está siendo referenciada en otras partes del sistema.' });
        }
        res.status(500).json({ success: false, error: 'Error al eliminar producción', details: err.message });
    }
}

module.exports = {
    createProduction,
    getAllProductions,
    getProductionById,
    updateProduction,
    deleteProduction,
};