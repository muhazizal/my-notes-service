const { Op } = require('sequelize')

const { User: UserModel } = require('../models/index')

const {
	validateUserNotExist,
	validateRequest,
	validateUsernameExist,
	validateEmailExist,
} = require('../validator/auth')

exports.getProfile = async (req, res, next) => {
	try {
		const result = await UserModel.sequelize.transaction(async (t) => {
			const { userId } = req

			const user = await UserModel.findByPk(userId, {
				transaction: t,
				attributes: ['id', 'username', 'email', 'fullname', 'isVerified'],
			})

			validateUserNotExist(user)

			return user
		})

		res.status(200).json({
			message: 'Success get profile',
			data: result,
			code: 200,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.updateProfile = async (req, res, next) => {
	try {
		let message = 'Success update profile'

		const result = await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { userId } = req
			const { username, email, fullname } = req.body

			const existingUser = await UserModel.findOne({
				where: {
					id: {
						[Op.ne]: userId, // check id is not equal with user id
					},
					[Op.or]: [{ username }, { email }], // check username or email is exist
				},
				transaction: t,
			})

			if (existingUser) {
				validateUsernameExist(existingUser.username, username)
				validateEmailExist(existingUser.email, email)
			}

			const user = await UserModel.findByPk(userId, {
				attributes: ['id', 'username', 'email', 'fullname', 'isVerified'],
				transaction: t,
			})

			validateUserNotExist(user)

			if (user.email !== email) {
				user.isVerified = false
				message = 'Success update profile, please verify your new email'
			}

			user.username = username
			user.email = email
			user.fullname = fullname

			return await user.save({ transaction: t })
		})

		res.status(201).json({
			message: 'Success update profile',
			data: result,
			code: 201,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.deleteAccount = async (req, res, next) => {
	try {
		await UserModel.sequelize.transaction(async (t) => {
			const { userId } = req

			const user = await UserModel.findByPk(userId, {
				transaction: t,
			})

			validateUserNotExist(user)

			await user.destroy({
				transaction: t,
			})
		})

		res.status(200).json({
			message: 'Success delete account',
			code: 200,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}
