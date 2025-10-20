const jwt = require('jsonwebtoken')

const { Session: SessionModel } = require('../models/index')

const {
	createAccessToken,
	createRefreshToken,
	setSessionCookie,
	destroySessionCookie,
} = require('../utils/session')

const handleVerifyJwtSession = async (res, session) => {
	try {
		const decoded = jwt.verify(session.accessToken, process.env.JWT_SECRET)
		return decoded.userId
	} catch (error) {
		if (error.name !== 'TokenExpiredError') {
			throw error
		}

		try {
			const decodedRefresh = jwt.verify(session.refreshToken, process.env.JWT_REFRESH_SECRET)

			const newAccessToken = createAccessToken(decodedRefresh.userId)
			const newRefreshToken = createRefreshToken(decodedRefresh.userId)
			const newExpires = new Date()
			newExpires.setDate(newExpires.getDate() + 1)

			session.accessToken = newAccessToken
			session.refreshToken = newRefreshToken
			session.expires = newExpires

			await session.save()

			setSessionCookie(res, session.sid)

			return decodedRefresh.userId
		} catch (refreshError) {
			if (refreshError.name === 'TokenExpiredError') {
				await destroySessionCookie(res)
				const err = new Error('Unauthorized')
				err.statusCode = 401
				throw err
			}
			throw refreshError
		}
	}
}

const authMiddleware = async (req, res, next) => {
	try {
		const { session_id } = req.cookies
		if (!session_id) {
			await destroySessionCookie(res)
			return res.status(401).json({ message: 'Unauthorized' })
		}

		const session = await SessionModel.findByPk(session_id)
		if (!session) {
			await destroySessionCookie(res)
			return res.status(401).json({ message: 'Session not found' })
		}

		req.userId = await handleVerifyJwtSession(res, session)

		next()
	} catch (error) {
		console.info(error)
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}

module.exports = { authMiddleware }
