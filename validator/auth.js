const { validationResult } = require('express-validator')

exports.validateRequest = (req, res) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		const error = new Error('Invalid request')
		error.statusCode = 422
		error.data = errors.array()
		throw error
	}
}
exports.validateUserExist = (user) => {
	if (user) {
		const error = new Error('User already exists')
		error.statusCode = 422
		throw error
	}
}
exports.validateUserNotExist = (user, code = 422) => {
	if (!user) {
		const error = new Error('Invalid Credentials')
		error.statusCode = code
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
exports.validateVerifyTokenExpired = (expires) => {
	if (Number(expires) <= Date.now()) {
		const error = new Error('Token Expired')
		error.statusCode = 422
		throw error
	}
}
