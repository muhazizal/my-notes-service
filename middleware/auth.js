const jwt = require('jsonwebtoken')

const { validateTokenNotExist, validateTokenIsBlacklisted } = require('../validator/auth')

const authMiddleware = async (req, res, next) => {
	try {
		const token = req.headers.authorization || ''

		validateTokenNotExist(token)

		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		req.user = decoded.user

		next()
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

module.exports = { authMiddleware }
