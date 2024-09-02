const { checkSchema } = require('express-validator')

const {
	usernameSchema,
	emailSchema,
	passwordSchema,
	fullnameSchema,
} = require('../schema/standalone')

exports.registerSchema = checkSchema(
	{
		username: usernameSchema,
		email: emailSchema,
		password: passwordSchema,
		fullname: fullnameSchema,
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
