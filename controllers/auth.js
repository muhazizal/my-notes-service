const bcrypt = require('bcrypt')
const { Op } = require('sequelize')

const { User: UserModel } = require('../models/index')

const {
	validateRequest,
	validateUserExist,
	validateUserNotExist,
	validatePasswordNotMatch,
	validateUserVerified,
	validateUserNotVerified,
	validateVerifyTokenExpired,
} = require('../validator/auth')

const { sendEmailVerification, sendEmailResetPassword } = require('../utils/send-email')
const { generateToken } = require('../utils/token')
const {
	createAccessToken,
	createRefreshToken,
	storeAuthSession,
	destroyAuthSession,
} = require('../utils/session')

const consola = require('consola')

exports.register = async (req, res) => {
	try {
		validateRequest(req, res)

		const { email, password, username, fullname } = req.body
		let emailToNotify = email
		let verificationTokenForEmail = null

		await UserModel.sequelize.transaction(async (t) => {
			let existing = await UserModel.findOne({
				where: { [Op.or]: [{ email }, { username }] },
				transaction: t,
			})

			validateUserExist(existing)

			const salt = await bcrypt.genSalt(10)
			const hashedPassword = await bcrypt.hash(password, salt)
			const { token, tokenExpires } = generateToken()
			verificationTokenForEmail = token

			await UserModel.create(
				{
					email,
					password: hashedPassword,
					username,
					fullname,
					verificationToken: token,
					verificationTokenExpires: tokenExpires,
				},
				{ transaction: t }
			)
		})

		// Send email after successful commit
		try {
			await sendEmailVerification(req, verificationTokenForEmail, emailToNotify)
		} catch (emailErr) {
			consola.warn({
				event: 'email_send_verification_failed',
				route: 'register',
				email: emailToNotify,
				tokenLength: String(verificationTokenForEmail?.length || 0),
				error: emailErr.message,
			})
		}

		res.status(201).json({
			message: 'Success register user, please verify your email',
			code: 201,
		})
	} catch (error) {
		consola.error({
			event: 'auth_register_error',
			method: req.method,
			path: req.originalUrl,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}

exports.login = async (req, res) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { email, password } = req.body

			const user = await UserModel.findOne({
				where: {
					email,
				},
				transaction: t,
			})

			validateUserNotExist(user)
			validateUserNotVerified(user.isVerified)

			const isMatch = await bcrypt.compare(password, user.password)

			validatePasswordNotMatch(isMatch)

			const accessToken = createAccessToken(user.id)
			const refreshToken = createRefreshToken(user.id)

			await storeAuthSession(res, accessToken, refreshToken)
		})

		res.status(200).json({
			message: 'Success login user',
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'auth_login_error',
			method: req.method,
			path: req.originalUrl,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}

exports.logout = async (req, res) => {
	try {
		await destroyAuthSession(res)

		res.status(200).json({
			message: 'Success logout user',
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'auth_logout_error',
			method: req.method,
			path: req.originalUrl,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}

exports.checkAuthSession = (req, res) => {
	res.json({
		message: 'Current auth session',
		headers: req.headers,
		cookies: req.cookies,
	})
}

exports.verify = async (req, res) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			const { token } = req.params

			const user = await UserModel.findOne({
				where: {
					verificationToken: token,
				},
				transaction: t,
			})

			validateUserNotExist(user, 401)
			validateUserVerified(user.isVerified)
			validateVerifyTokenExpired(user.verificationTokenExpires)

			user.isVerified = true
			user.verificationToken = null
			user.verificationTokenExpires = null

			await user.save({ transaction: t })
		})

		res.status(200).json({
			message: 'Success verify user email',
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'auth_verify_error',
			method: req.method,
			path: req.originalUrl,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}

exports.resendVerification = async (req, res) => {
	try {
		validateRequest(req, res)

		const { token } = req.body
		let targetEmail = null
		let newTokenForEmail = null

		await UserModel.sequelize.transaction(async (t) => {
			const user = await UserModel.findOne({
				where: { verificationToken: token },
				transaction: t,
			})

			validateUserNotExist(user, 401)
			validateUserVerified(user.isVerified)

			const { token: newToken, tokenExpires } = generateToken()
			newTokenForEmail = newToken
			targetEmail = user.email

			user.verificationToken = newToken
			user.verificationTokenExpires = tokenExpires

			await user.save({ transaction: t })
		})

		// Send email after commit
		try {
			await sendEmailVerification(req, newTokenForEmail, targetEmail)
		} catch (emailErr) {
			consola.warn({
				event: 'email_send_verification_failed',
				route: 'resendVerification',
				email: targetEmail,
				tokenLength: String(newTokenForEmail?.length || 0),
				error: emailErr.message,
			})
		}

		res.status(200).json({
			message: 'Success resend verification',
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'auth_resend_verification_error',
			method: req.method,
			path: req.originalUrl,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}

exports.forgotPassword = async (req, res) => {
	try {
		validateRequest(req, res)

		const { email } = req.body
		let targetEmail = email
		let resetTokenForEmail = null

		await UserModel.sequelize.transaction(async (t) => {
			const user = await UserModel.findOne({
				where: { email },
				transaction: t,
			})

			validateUserNotExist(user, 422)

			const { token, tokenExpires } = generateToken()
			resetTokenForEmail = token

			user.resetPasswordToken = token
			user.resetPasswordTokenExpires = tokenExpires

			await user.save({ transaction: t })
		})

		// Send email after commit
		try {
			await sendEmailResetPassword(req, resetTokenForEmail, targetEmail)
		} catch (emailErr) {
			consola.warn({
				event: 'email_send_reset_failed',
				email: targetEmail,
				tokenLength: String(resetTokenForEmail?.length || 0),
				error: emailErr.message,
			})
		}

		res.status(200).json({
			message: 'Success forgot password, please check your email',
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'auth_forgot_password_error',
			method: req.method,
			path: req.originalUrl,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}

exports.resetPassword = async (req, res) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { token } = req.params
			const { password } = req.body

			const user = await UserModel.findOne({
				where: {
					resetPasswordToken: token,
				},
				transaction: t,
			})

			validateUserNotExist(user, 401)
			validateVerifyTokenExpired(user.resetPasswordTokenExpires)

			const salt = await bcrypt.genSalt(10)
			const hashedPassword = await bcrypt.hash(password, salt)

			user.password = hashedPassword
			user.resetPasswordToken = null
			user.resetPasswordTokenExpires = null

			await user.save({ transaction: t })
		})

		res.status(200).json({
			message: 'Success reset password, please log in with new password',
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'auth_reset_password_error',
			method: req.method,
			path: req.originalUrl,
			params: { token: String(req.params?.token || '').length },
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}
