exports.validateUserExist = (user) => {
	if (user) {
		const error = new Error('User already exists')
		error.statusCode = 400
		throw error
	}
}

exports.validateUserNotExist = (user) => {
	if (!user) {
		const error = new Error('Invalid Credentials')
		error.statusCode = 401
		throw error
	}
}

exports.validatePasswordNotMatch = (isMatch) => {
	if (!isMatch) {
		const error = new Error('Invalid Credentials')
		error.statusCode = 401
		throw error
	}
}
