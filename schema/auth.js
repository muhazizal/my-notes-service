const { checkSchema } = require('express-validator')

const {
	usernameSchema,
	emailSchema,
	passwordSchema,
	fullnameSchema,
	tokenSchema,
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

exports.verifySchema = checkSchema(
	{
		token: tokenSchema,
	},
	['params']
)

exports.resendVerificationSchema = checkSchema(
	{
		token: tokenSchema,
	},
	['body']
)

exports.forgotPasswordSchema = checkSchema(
	{
		token: tokenSchema,
	},
	['body']
)

exports.resetPasswordSchema = checkSchema(
	{
		password: passwordSchema,
	},
	['body']
)
