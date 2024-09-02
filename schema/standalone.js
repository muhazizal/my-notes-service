exports.usernameSchema = {
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
}
exports.emailSchema = {
	notEmpty: {
		bail: true,
		errorMessage: 'Email is required.',
	},
	isEmail: {
		errorMessage: 'Email is not valid',
	},
}
exports.passwordSchema = {
	trim: true,
	notEmpty: {
		bail: true,
		errorMessage: 'Password is required',
	},
	isLength: {
		options: {
			min: 5,
		},
		errorMessage: 'Password must be at least 5 characters long',
	},
}
exports.fullnameSchema = {
	notEmpty: {
		bail: true,
		errorMessage: 'Fullname is required',
	},
}
