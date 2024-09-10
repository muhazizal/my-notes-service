const { checkSchema } = require('express-validator')

const {
	usernameSchema,
	emailSchema,
	passwordSchema,
	fullnameSchema,
} = require('../schema/standalone')

exports.registerSchema = checkSchema(
	{
		email: emailSchema,
		password: passwordSchema,
		username: usernameSchema,
		fullname: fullnameSchema,
	},
	['body']
)

exports.loginSchema = checkSchema(
	{
		email: emailSchema,
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
