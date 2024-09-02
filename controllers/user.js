const { Op } = require('sequelize')

const User = require('../models/user')
const UserModel = User()

const {
	validateUserNotExist,
	validateRequest,
	validateUsernameExist,
	validateEmailExist,
} = require('../validator/auth')

exports.getProfileById = async (req, res, next) => {
	try {
		const result = await UserModel.sequelize.transaction(async (t) => {
			const { id } = req.params

			const user = await UserModel.findByPk(id, {
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

			const { id } = req.params
			const { username, email, fullname } = req.body

			const existingUser = await UserModel.findOne({
				where: {
					id: {
						[Op.ne]: id, // check id is not equal with user id
					},
					[Op.or]: [{ username }, { email }], // check username or email is exist
				},
				transaction: t,
			})

			if (existingUser) {
				validateUsernameExist(existingUser.username, username)
				validateEmailExist(existingUser.email, email)
			}

			const user = await UserModel.findByPk(id, {
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
