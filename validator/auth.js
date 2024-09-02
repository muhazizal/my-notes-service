const { validationResult } = require('express-validator')

exports.validateRequest = (req, res) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		throw res.status(422).json({
			message: 'Invalid request',
			data: errors.array(),
			code: 422,
		})
	}
}
exports.validateUserExist = (user) => {
	if (user) {
		const error = new Error('User already exists')
		error.statusCode = 401
		throw error
	}
}
exports.validateUserNotExist = (user) => {
	if (!user) {
		const error = new Error('Invalid Credentials')
		error.statusCode = 401
		throw error
	}
}
exports.validatePasswordNotMatch = (isMatch) => {
	if (!isMatch) {
		const error = new Error('Invalid Credentials')
		error.statusCode = 401
		throw error
	}
}
exports.validateUserVerified = (isVerified) => {
	if (isVerified) {
		const error = new Error('User already verified')
		error.statusCode = 401
		throw error
	}
}
exports.validateTokenNotExist = (token) => {
	if (!token) {
		const error = new Error('No token, authorization denied')
		error.statusCode = 401
		throw error
	}
}
exports.validateTokenIsBlacklisted = (token) => {
	if (token) {
		const error = new Error('Token has been blacklisted. Please log in again.')
		error.statusCode = 401
		throw error
	}
}
