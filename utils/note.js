exports.validateReqBody = ({ title, description }) => {
	if (!title || !description) {
		const error = new Error('Input is not valid')
		error.statusCode = 422
		throw error
	}
}
exports.validateReqParams = ({ id }) => {
	if (!id) {
		const error = new Error('Note is not found')
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
