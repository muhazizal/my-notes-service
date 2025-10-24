// middleware/auth.js
const consola = require('consola')
const jwt = require('jsonwebtoken')

const {
	createAccessToken,
	createRefreshToken,
	setAuthCookies,
	destroyAuthCookies,
} = require('../utils/session')

const authMiddleware = async (req, res, next) => {
	try {
		const { access_token, refresh_token } = req.cookies

		if (!access_token) {
			consola.warn({
				event: 'auth_missing_access_token',
				path: req.originalUrl,
				method: req.method,
			})
			destroyAuthCookies(res)
			return res.status(401).json({ message: 'Unauthorized' })
		}

		try {
			const decoded = jwt.verify(access_token, process.env.JWT_SECRET)
			req.userId = decoded.userId
			return next()
		} catch (error) {
			if (error.name !== 'TokenExpiredError') {
				consola.error({
					event: 'auth_access_token_invalid',
					name: error.name,
					message: error.message,
					path: req.originalUrl,
					method: req.method,
				})
				throw error
			}

			// Access token expired; try refresh
			if (!refresh_token) {
				consola.warn({
					event: 'auth_missing_refresh_token',
					path: req.originalUrl,
					method: req.method,
				})
				destroyAuthCookies(res)
				return res.status(401).json({ message: 'Unauthorized' })
			}

			try {
				const decodedRefresh = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET)
				const newAccessToken = createAccessToken(decodedRefresh.userId)
				const newRefreshToken = createRefreshToken(decodedRefresh.userId)

				setAuthCookies(res, newAccessToken, newRefreshToken)
				req.userId = decodedRefresh.userId
				return next()
			} catch (refreshError) {
				if (refreshError.name === 'TokenExpiredError') {
					consola.warn({
						event: 'auth_refresh_token_expired',
						path: req.originalUrl,
						method: req.method,
					})
					destroyAuthCookies(res)
					const err = new Error('Unauthorized')
					err.statusCode = 401
					throw err
				}
				consola.error({
					event: 'auth_refresh_token_invalid',
					name: refreshError.name,
					message: refreshError.message,
					path: req.originalUrl,
					method: req.method,
				})
				throw refreshError
			}
		}
	} catch (error) {
		consola.error({
			event: 'auth_middleware_error',
			path: req.originalUrl,
			method: req.method,
			statusCode: error.statusCode || 500,
			error: error.message,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}

module.exports = { authMiddleware }
