const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500

    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', err)
    } else {
        console.error('Error:', err.message)
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            statusCode,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        },
    })
}

const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.originalUrl} not found.`,
            statusCode: 404,
        },
    })
}

module.exports = { errorHandler, notFoundHandler }
