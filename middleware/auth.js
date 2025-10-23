// middleware/auth.js
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
			destroyAuthCookies(res)
			return res.status(401).json({ message: 'Unauthorized' })
		}

		try {
			const decoded = jwt.verify(access_token, process.env.JWT_SECRET)
			req.userId = decoded.userId
			return next()
		} catch (error) {
			if (error.name !== 'TokenExpiredError') {
				throw error
			}

			// Access token expired; try refresh
			if (!refresh_token) {
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
					destroyAuthCookies(res)
					const err = new Error('Unauthorized')
					err.statusCode = 401
					throw err
				}
				throw refreshError
			}
		}
	} catch (error) {
		console.info(error)
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}

module.exports = { authMiddleware }
