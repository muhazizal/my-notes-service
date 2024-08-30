const nodemailer = require('nodemailer')

const createTransporter = () => {
	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
		},
	})
	return { transporter }
}

exports.sendEmailVerification = async (req, verificationToken, email) => {
	const verificationUrl = `${req.protocol}://${req.get(
		'host'
	)}/api/auth/verify/${verificationToken}`

	const { transporter } = createTransporter()

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: 'My Shop - Email Verification',
		text: `Welcome to My Shop, please verify your email by clicking the following URL: ${verificationUrl}`,
	}

	await transporter.sendMail(mailOptions)
}

exports.sendEmailResetPassword = async (req, resetPasswordToken, email) => {
	const resetPasswordUrl = `${req.protocol}://${req.get(
		'host'
	)}/api/auth/reset-password/${resetPasswordToken}`

	const { transporter } = createTransporter()

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: 'My Shop - Reset Password',
		text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetPasswordUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
	}

	await transporter.sendMail(mailOptions)
}
