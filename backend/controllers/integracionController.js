/* backend/controllers/integracionController.js */
const db = require('../config/db'); // Pool de conexiones

// Obtener datos para los desplegables de integración
async function getIntegrationData(req, res) {
    try {
        // Ejecutar todas las consultas en paralelo
        const [
            [users],
            [cultivations],
            [cycles],
            [sensors]
            // Los insumos se obtienen por separado desde el frontend (/api/insumos)
        ] = await Promise.all([
            db.pool.query("SELECT id, CONCAT(firstName, ' ', lastName) as name FROM user WHERE userType IN ('ADMIN', 'PAP', 'SADMIN') ORDER BY firstName, lastName"), // Filtrar usuarios si es necesario
            db.pool.query("SELECT id_cultivo as id, nombre_cultivo as name FROM cultivos WHERE estado = 'Activo' ORDER BY nombre_cultivo"), // Filtrar cultivos activos
            db.pool.query("SELECT id_ciclo as id, nombre_ciclo as name FROM ciclo_cultivo WHERE estado = 'activo' ORDER BY nombre_ciclo"), // Filtrar ciclos activos
            db.pool.query("SELECT id, CONCAT(nombre_sensor, ' (', tipo_sensor, ')') as name FROM sensores WHERE estado = 'Activo' ORDER BY nombre_sensor") // Filtrar sensores activos
        ]);

        res.json({
            success: true,
            data: { users, cultivations, cycles, sensors } // Devolver datos estructurados
        });
    } catch (error) {
        console.error('Error fetching integration dropdown data:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos para los selectores de integración',
            details: error.message
        });
    }
}

module.exports = {
    getIntegrationData,
};