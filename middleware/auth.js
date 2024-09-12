const jwt = require('jsonwebtoken')

const { Session: SessionModel } = require('../models/index')

const { validateTokenNotExist, validateSessionNotExist } = require('../validator/auth')

const { createAccessToken, setAccessTokenCookie, createRefreshToken } = require('../utils/session')

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

	// Check access token
	return jwt.verify(session.accessToken, process.env.JWT_SECRET, async (error, decoded) => {
		// Handle access token expired
		if (error && error.name === 'TokenExpiredError') {
			// Check refresh token
			const { userId } = jwt.verify(session.refreshToken, process.env.JWT_REFRESH_SECRET)

			// generate new access token & refresh token
			const newAccessToken = createAccessToken(userId)
			const newRefreshToken = createRefreshToken(userId)

			// update access token in session
			session.accessToken = newAccessToken
			session.refreshToken = newRefreshToken

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
		const { access_token } = req.cookies

		validateTokenNotExist(access_token)

		req.userId = await handleVerifyJwtSession(res, access_token)

		next()
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

module.exports = { authMiddleware }
