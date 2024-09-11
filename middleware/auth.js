const jwt = require('jsonwebtoken')

const { Session: SessionModel } = require('../models/index')

const { validateTokenNotExist, validateSessionNotExist } = require('../validator/auth')

const { createAccessToken, setAccessTokenCookie } = require('../utils/session')

const handleVerifyJwtSession = async (res, accessToken) => {
	const transaction = await SessionModel.sequelize.transaction()

	// Check session
	const session = await SessionModel.findOne({
		where: {
			accessToken,
		},
		transaction,
	})

	validateSessionNotExist(session)

	// Check access token, if valid return user id
	return jwt.verify(session.accessToken, process.env.JWT_SECRET, async (error, decoded) => {
		// Handle access token expired
		if (error && error.name === 'TokenExpiredError') {
			// Check refresh token
			const { userId } = jwt.verify(session.refreshToken, process.env.JWT_REFRESH_SECRET)

			// if valid generate new access token
			const newAccessToken = createAccessToken(userId)

			// update access token in session
			session.accessToken = newAccessToken

			await session.save({ transaction: t })

			// update access token in cookie
			setAccessTokenCookie(res, newAccessToken)

			return userId
		}

		return decoded.userId
	})
}

const authMiddleware = async (req, res, next) => {
	try {
		const { accessToken } = req.cookies

		validateTokenNotExist(accessToken)

		req.userId = handleVerifyJwtSession(res, accessToken)

		next()
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

module.exports = { authMiddleware }
