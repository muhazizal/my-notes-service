const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')

const { Session: SessionModel } = require('../models/index')

exports.createAccessToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

exports.createRefreshToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' })
}

const setSessionCookie = (res, sessionId) => {
	res.cookie('session_id', sessionId, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	})
}

const destroySessionCookie = (res) => {
	res.clearCookie('session_id', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 0,
	})
}

exports.storeAuthSession = async (res, accessToken, refreshToken) => {
	try {
		await SessionModel.sequelize.transaction(async (t) => {
			const sessionId = uuidv4()

			const expires = new Date()
			expires.setDate(expires.getDate() + 1) // 1d

			await SessionModel.create(
				{
					sid: sessionId,
					expires,
					accessToken,
					refreshToken,
				},
				{ transaction: t }
			)

			setSessionCookie(res, sessionId)
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		throw error
	}
}

exports.destroyAuthSession = async (sid) => {
	try {
		await SessionModel.sequelize.transaction(async (t) => {
			await SessionModel.destroy({
				where: {
					sid,
				},
				transaction: t,
			})

			destroySessionCookie(sid)
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		throw error
	}
}
