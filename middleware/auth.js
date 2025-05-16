const jwt = require('jsonwebtoken')

const { Session: SessionModel } = require('../models/index')

const { validateSessionNotExist } = require('../validator/auth')

const {
	createAccessToken,
	createRefreshToken,
	setAccessTokenCookie,
	destroyAuthSession,
} = require('../utils/session')

const handleVerifyJwtSession = async (res, session) => {
	// Check access token
	return jwt.verify(session.accessToken, process.env.JWT_SECRET, async (error, decoded) => {
		// Handle access token expired
		if (error && error.name === 'TokenExpiredError') {
			// Check refresh token
			return jwt.verify(
				session.refreshToken,
				process.env.JWT_REFRESH_SECRET,
				async (error, decoded) => {
					// Handle refresh token expires
					if (error && error.name === 'TokenExpiredError') {
						await destroyAuthSession(session.sid)

						throw error
					}

					// generate new access token & refresh token
					const newAccessToken = createAccessToken(decoded.userId)
					const newRefreshToken = createRefreshToken(decoded.userId)

					// update access token & refresh token in session
					session.accessToken = newAccessToken
					session.refreshToken = newRefreshToken

					// save updated session token
					await session.save()

					// update access token in cookie
					setAccessTokenCookie(res, newAccessToken)

					return decoded.userId
				}
			)
		}

		return decoded.userId
	})
}

const authMiddleware = async (req, res, next) => {
	const transaction = await SessionModel.sequelize.transaction()
	try {
		const { session_id } = req.cookies
		if (!session_id) return res.status(401).json({ message: 'Unauthorized' })

		const session = await SessionModel.findByPk(session_id)
		if (!session) return res.status(401).json({ message: 'Session not found' })

		req.userId = await handleVerifyJwtSession(res, session)

		await transaction.commit()

		next()
	} catch (error) {
		await transaction.rollback()
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}

module.exports = { authMiddleware }
