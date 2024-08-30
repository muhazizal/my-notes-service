const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')

const User = require('../models/user')
const UserModel = User()

const {
	validateRequest,
	validateUserExist,
	validateUserNotExist,
	validatePasswordNotMatch,
	validateUserVerified,
} = require('../validator/auth')

const { sendEmailVerification, sendEmailResetPassword } = require('../utils/send-email')
const { generateToken } = require('../utils/token')

exports.register = async (req, res, next) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { username, email, password, fullname } = req.body

			let user = await UserModel.findOne({
				where: {
					[Op.or]: [{ username }, { email }],
				},
				transaction: t,
			})

			validateUserExist(user)

			const salt = await bcrypt.genSalt(10)
			const hashedPassword = await bcrypt.hash(password, salt)
			const { token, tokenExpires } = generateToken()

			user = await UserModel.create(
				{
					username,
					email,
					password: hashedPassword,
					fullname,
					verificationToken: token,
					verificationTokenExpires: tokenExpires,
				},
				{ transaction: t }
			)

			await sendEmailVerification(req, verificationToken, email)
		})

		res.status(201).json({
			message: 'Success register user, please verify your email',
			code: 201,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.login = async (req, res, next) => {
	try {
		const result = await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { username, password } = req.body

			const user = await UserModel.findOne({
				where: {
					username,
				},
				transaction: t,
			})

			validateUserNotExist(user)

			const isMatch = await bcrypt.compare(password, user.password)

			validatePasswordNotMatch(isMatch)

			const jwtPayload = {
				user: {
					id: user.id,
				},
			}
			return jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1d' })
		})

		res.status(200).json({
			message: 'Success login user',
			data: { token: result },
			code: 200,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.verify = async (req, res, next) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			const { token } = req.params

			const user = await UserModel.findOne({
				where: {
					verificationToken: token,
					verificationTokenExpires: {
						[Op.gt]: Date.now().toString(),
					},
				},
				transaction: t,
			})

			validateUserNotExist(user)

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
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.resendVerification = async (req, res, next) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { email } = req.body

			const user = await UserModel.findOne({
				where: {
					email,
				},
				transaction: t,
			})

			validateUserNotExist(user)
			validateUserVerified(user.isVerified)

			const { token, tokenExpires } = generateToken()

			user.verificationToken = token
			user.verificationTokenExpires = tokenExpires

			await user.save({ transaction: t })

			await sendEmailVerification(req, verificationToken, email)
		})

		res.status(200).json({
			message: 'Success resend verification',
			code: 200,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.forgotPassword = async (req, res, next) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { email } = req.body

			const user = await UserModel.findOne({
				where: {
					email,
				},
				transaction: t,
			})

			validateUserNotExist(user)

			const { token, tokenExpires } = generateToken()

			user.resetPasswordToken = token
			user.resetPasswordTokenExpires = tokenExpires

			await user.save({ transaction: t })

			await sendEmailResetPassword(req, token, email)
		})

		res.status(200).json({
			message: 'Success forgot password, please check your email',
			code: 200,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.resetPassword = async (req, res, next) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { token } = req.params
			const { password } = req.body

			const user = await UserModel.findOne({
				where: {
					resetPasswordToken: token,
					resetPasswordTokenExpires: {
						[Op.gt]: Date.now().toString(),
					},
				},
				transaction: t,
			})

			validateUserNotExist(user)

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
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}
