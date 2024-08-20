const nodemailer = require('nodemailer')

exports.validateReqBody = (errors, res) => {
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: 'Invalid request',
			data: errors.array(),
			code: 422,
		})
	}
}
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
exports.validateUserVerified = (isVerified) => {
	if (isVerified) {
		const error = new Error('User already verified')
		error.statusCode = 400
		throw error
	}
}

exports.sendEmailVerification = async (req, verificationToken, email) => {
	const verificationUrl = `${req.protocol}://${req.get(
		'host'
	)}/api/auth/verify/${verificationToken}`

	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	})

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: 'My Notes - Email Verification',
		text: `Welcome to My Notes, please verify your email by clicking the following URL: ${verificationUrl}`,
	}

	await transporter.sendMail(mailOptions)
}
