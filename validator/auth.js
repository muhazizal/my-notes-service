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
		error.statusCode = 422
		throw error
	}
}
exports.validateUserNotExist = (user) => {
	if (!user) {
		const error = new Error('Invalid Credentials')
		error.statusCode = 422
		throw error
	}
}
exports.validatePasswordNotMatch = (isMatch) => {
	if (!isMatch) {
		const error = new Error('Invalid Credentials')
		error.statusCode = 422
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
exports.validateUserNotVerified = (isVerified) => {
	if (!isVerified) {
		const error = new Error('User is not verified')
		error.statusCode = 422
		throw error
	}
}
exports.validateTokenNotExist = (token) => {
	if (!token) {
		const error = new Error('Invalid access token')
		error.statusCode = 401
		throw error
	}
}
exports.validateUsernameExist = (username, payload) => {
	if (username === payload) {
		const error = new Error('Username is already exist')
		error.statusCode = 422
		throw error
	}
}
exports.validateEmailExist = (userEmail, payload) => {
	if (userEmail === payload) {
		const error = new Error('Email is already exist')
		error.statusCode = 422
		throw error
	}
}
exports.validateSessionNotExist = (session) => {
	if (!session) {
		const error = new Error('Session Expired')
		error.statusCode = 403
		throw error
	}
}
exports.validateVerifyTokenExpired = (user) => {
	if (!user) {
		const error = new Error('Token Expired')
		error.statusCode = 422
		throw error
	}
}
