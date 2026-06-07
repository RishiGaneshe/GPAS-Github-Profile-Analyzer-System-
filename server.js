require('dotenv').config()
const app = require('./app')
const { testConnection } = require('./config/database')

const PORT = process.env.PORT || 3000

const startServer = async () => {
    try {
        await testConnection()

        app.listen(PORT, () => {
            console.log(`\nGPAS server running on http://localhost:${PORT}`)
            console.log(`API base:  http://localhost:${PORT}/api/profiles`)
            console.log(`Health:    http://localhost:${PORT}/api/health\n`)
        })
    } catch (error) {
        console.error('Failed to start server:', error.message)
        console.error('Make sure MySQL is running and your .env credentials are correct.')
        process.exit(1)
    }
}

startServer()
