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
	// BE rest api
	// const verificationUrl = `${req.protocol}://${req.get(
	// 	'host'
	// )}/api/auth/verify/${verificationToken}`

	// FE verification url
	const verificationUrl = `${process.env.VERIFY_URL}/${verificationToken}`

	const emailHtml = `
			<h1>Email Verification</h1>
			<p>Thank you for registering. Please click the button below to verify your email:</p>
			<a href="${verificationUrl}" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">
					Verify Email
			</a>
			<p>If you did not create an account, please ignore this email.</p>
	`

	const { transporter } = createTransporter()

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: 'My Notes - Email Verification',
		html: emailHtml,
	}

	await transporter.sendMail(mailOptions)
}

exports.sendEmailResetPassword = async (req, resetPasswordToken, email) => {
	// BE rest api
	// const resetPasswordUrl = `${req.protocol}://${req.get(
	// 	'host'
	// )}/api/auth/reset-password/${resetPasswordToken}`

	// FE reset password url
	const resetPasswordUrl = `${process.env.RESET_URL}/${resetPasswordToken}`

	const emailHtml = `
			<h1>Reset Password</h1>
			<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link to complete the process:</p>
			<a href="${resetPasswordUrl}" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">
					Reset Password
			</a>
			<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
	`

	const { transporter } = createTransporter()

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: 'My Shop - Reset Password',
		html: emailHtml,
	}

	await transporter.sendMail(mailOptions)
}
