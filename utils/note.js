exports.validateReqBody = (errors, res) => {
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: 'Invalid request',
			data: errors.array(),
			code: 422,
		})
	}
}
exports.validateReqParams = ({ id }) => {
	if (!id) {
		const error = new Error('Params is empty')
		error.statusCode = 404
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
