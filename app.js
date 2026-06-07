const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const profileRoutes = require('./routes/profileRoutes')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'GPAS - GitHub Profile Analyzer Service is running',
        version: '1.0.0',
        endpoints: {
            analyze: 'POST   /api/profiles/:username',
            list:    'GET    /api/profiles',
            detail:  'GET    /api/profiles/:username',
            compare: 'GET    /api/profiles/compare?users=user1,user2',
            delete:  'DELETE /api/profiles/:username',
        },
    })
})

app.use('/api/profiles', profileRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
