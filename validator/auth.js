const { validationResult } = require('express-validator')

exports.validateRequest = (req, res) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: 'Invalid request',
			data: errors.array(),
			code: 422,
		})
	}
}
exports.validateUserExist = (user) => {
	if (user) {
		const error = new Error('User already exists')
		error.statusCode = 400
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
		error.statusCode = 400
		throw error
	}
}
