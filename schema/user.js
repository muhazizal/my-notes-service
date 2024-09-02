const { checkSchema } = require('express-validator')

const { usernameSchema, emailSchema, fullnameSchema } = require('../schema/standalone')

exports.editProfileSchema = checkSchema(
	{
		username: usernameSchema,
		email: emailSchema,
		fullname: fullnameSchema,
	},
	['body']
)
