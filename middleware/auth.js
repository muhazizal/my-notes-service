const jwt = require('jsonwebtoken')

const { Session: SessionModel } = require('../models/index')

const { validateTokenNotExist, validateSessionNotExist } = require('../validator/auth')

const {
	createAccessToken,
	createRefreshToken,
	setAccessTokenCookie,
	destroyAuthSession,
	clearAccessTokenCookie,
} = require('../utils/session')

const handleVerifyJwtSession = async (res, accessToken) => {
	// Check access token
	return jwt.verify(accessToken, process.env.JWT_SECRET, async (error, decoded) => {
		// Handle access token expired
		if (error && error.name === 'TokenExpiredError') {
			// Check session
			const session = await SessionModel.findOne({
				where: {
					accessToken,
				},
			})

			validateSessionNotExist(session)

			// Check refresh token
			return jwt.verify(
				session.refreshToken,
				process.env.JWT_REFRESH_SECRET,
				async (error, decoded) => {
					// Handle refresh token expires
					if (error && error.name === 'TokenExpiredError') {
						await destroyAuthSession(session.accessToken)

						clearAccessTokenCookie(res)

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
		const { access_token } = req.cookies

		validateTokenNotExist(access_token)

		req.userId = await handleVerifyJwtSession(res, access_token)

		await transaction.commit()

		next()
	} catch (error) {
		await transaction.rollback()
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

module.exports = { authMiddleware }
