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
exports.validateNoteExist = (note) => {
	if (!note) {
		const error = new Error('Note is not found')
		error.statusCode = 404
		throw error
	}
}
