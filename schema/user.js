const { checkSchema } = require('express-validator')

exports.editProfileSchema = checkSchema(
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
		email: {
			notEmpty: {
				bail: true,
				errorMessage: 'Email is required.',
			},
			isEmail: {
				errorMessage: 'Email is not valid',
			},
		},
		fullname: {
			notEmpty: {
				bail: true,
				errorMessage: 'Fullname is required',
			},
		},
	},
	['body']
)
