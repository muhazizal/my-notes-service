const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

exports.sendEmailVerification = async (req, verificationToken, email) => {
	const verificationUrl = `${process.env.VERIFY_URL}/${verificationToken}`

	const emailHtml = `
			<h1>Email Verification</h1>
			<p>Thank you for registering. Please click the button below to verify your email:</p>
			<a href="${verificationUrl}" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 5px;">
					Verify Email
			</a>
			<p>If you did not create an account, please ignore this email.</p>
	`

	const { error } = await resend.emails.send({
		from: `My Notes <${process.env.RESEND_FROM_EMAIL}>`,
		to: email,
		subject: 'My Notes - Verify Email',
		html: emailHtml,
	})

	if (error) {
		const _error = new Error(error.message)
		_error.statusCode = error.statusCode
		throw _error
	}
}

exports.sendEmailResetPassword = async (req, resetPasswordToken, email) => {
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

	const { error } = await resend.emails.send({
		from: `My Notes <${process.env.RESEND_FROM_EMAIL}>`,
		to: email,
		subject: 'My Notes - Reset Password',
		html: emailHtml,
	})

	if (error) {
		const _error = new Error(error.message)
		_error.statusCode = error.statusCode
		throw _error
	}
}
