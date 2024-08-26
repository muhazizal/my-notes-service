const nodemailer = require('nodemailer')

exports.sendEmailVerification = async (req, verificationToken, email) => {
	const verificationUrl = `${req.protocol}://${req.get(
		'host'
	)}/api/auth/verify/${verificationToken}`

	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
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
