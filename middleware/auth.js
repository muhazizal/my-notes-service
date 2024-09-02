const jwt = require('jsonwebtoken')

const BlacklistedToken = require('../models/blacklistedToken')
const BlacklistedTokenModel = BlacklistedToken()

const { validateTokenNotExist, validateTokenIsBlacklisted } = require('../validator/auth')

const authMiddleware = async (req, res, next) => {
	try {
		await BlacklistedTokenModel.sequelize.transaction(async (t) => {
			const token = req.headers.authorization || ''

			validateTokenNotExist(token)

			const blacklistedToken = await BlacklistedTokenModel.findOne({
				where: { token },
				transaction: t,
			})

			validateTokenIsBlacklisted(blacklistedToken)

			const decoded = jwt.verify(token, process.env.JWT_SECRET)

			req.user = decoded.user

			next()
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

module.exports = { authMiddleware }
