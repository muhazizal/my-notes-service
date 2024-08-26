exports.validateRequest = (errors, res) => {
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: 'Invalid request',
			data: errors.array(),
			code: 422,
		})
	}
}
exports.validateNoteExist = (note) => {
	if (!note) {
		const error = new Error('Note is not found')
		error.statusCode = 404
		throw error
	}
}
