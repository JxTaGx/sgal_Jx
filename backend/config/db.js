/* backend/config/db.js */
require("dotenv").config();
const mysql = require("mysql2/promise");

// --- Database Connection Pool ---
const dbPool = mysql.createPool({
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10, // Puedes añadir esto a tu .env si quieres
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "sgal_db",
    waitForConnections: true,
    queueLimit: 0,
});

// Función para probar la conexión (opcional, pero útil)
async function testDbConnection() {
    let connection;
    try {
        connection = await dbPool.getConnection();
        console.log("✅ Conectado a la base de datos MySQL (Pool)");
        connection.release();
        return true;
    } catch (err) {
        console.error("❌ Error conectando a la base de datos:", err.code, err.message);
        // No terminamos el proceso aquí, permitimos que el server.js decida
        return false;
    }
}

module.exports = {
    pool: dbPool,
    testConnection: testDbConnection,
};