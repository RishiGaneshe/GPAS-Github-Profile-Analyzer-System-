const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gpas_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
})

const testConnection = async () => {
    const connection = await pool.getConnection()
    try {
        await connection.ping()
        console.log('MySQL connection pool established successfully')
    } finally {
        connection.release()
    }
}

module.exports = { pool, testConnection }
