const { checkSchema } = require('express-validator')

exports.createNoteSchema = checkSchema(
	{
		title: {
			notEmpty: {
				errorMessage: 'Title is empty',
			},
		},
		description: {
			notEmpty: {
				errorMessage: 'Description is empty',
			},
		},
	},
	['body']
)
