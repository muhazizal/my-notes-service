const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')

const { Session: SessionModel } = require('../models/index')

exports.createAccessToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

exports.createRefreshToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' })
}

exports.storeAuthSession = async (accessToken, refreshToken) => {
	try {
		await SessionModel.sequelize.transaction(async (t) => {
			const expires = new Date()
			expires.setDate(expires.getDate() + 1) // 1d

			await SessionModel.create(
				{
					sid: uuidv4(),
					expires,
					accessToken,
					refreshToken,
				},
				{ transaction: t }
			)
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		throw error
	}
}

exports.destroyAuthSession = async (accessToken) => {
	try {
		await SessionModel.sequelize.transaction(async (t) => {
			await SessionModel.destroy({
				where: {
					accessToken,
				},
				transaction: t,
			})
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		throw error
	}
}
