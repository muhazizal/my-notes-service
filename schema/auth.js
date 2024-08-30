const { checkSchema } = require('express-validator')

const emailSchema = {
	notEmpty: {
		bail: true,
		errorMessage: 'Email is required.',
	},
	isEmail: {
		errorMessage: 'Email is not valid',
	},
}
const passwordSchema = {
	trim: true,
	notEmpty: {
		bail: true,
		errorMessage: 'Password is required',
	},
	isLength: {
		options: {
			min: 5,
		},
		errorMessage: 'Password must be at least 5 characters long',
	},
}

exports.registerSchema = checkSchema(
	{
		username: {
			notEmpty: {
				bail: true,
				errorMessage: 'Username is required',
			},
			isAlphanumeric: {
				bail: true,
				errorMessage: 'Username must be valid alphanumeric',
			},
			isLength: {
				options: { min: 3 },
				errorMessage: 'Username must be at least 3 characters long',
			},
		},
		email: emailSchema,
		password: passwordSchema,
		fullname: {
			notEmpty: {
				bail: true,
				errorMessage: 'Fullname is required',
			},
		},
	},
	['body']
)

exports.loginSchema = checkSchema(
	{
		username: {
			notEmpty: {
				bail: true,
				errorMessage: 'Username is required',
			},
			custom: {},
		},
		password: {
			notEmpty: {
				bail: true,
				errorMessage: 'Password is required',
			},
		},
	},
	['body']
)

exports.resendVerificationSchema = checkSchema(
	{
		email: emailSchema,
	},
	['body']
)

exports.forgotPasswordSchema = checkSchema(
	{
		email: emailSchema,
	},
	['body']
)

exports.resetPasswordSchema = checkSchema(
	{
		password: passwordSchema,
	},
	['body']
)
