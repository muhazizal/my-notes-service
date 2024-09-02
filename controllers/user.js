const User = require('../models/user')
const UserModel = User()

const { validateUserNotExist } = require('../validator/auth')

exports.getProfileById = async (req, res, next) => {
	try {
		const result = await UserModel.sequelize.transaction(async (t) => {
			const { id } = req.params

			const user = await UserModel.findByPk(id, {
				transaction: t,
				attributes: ['id', 'username', 'email', 'fullname', 'isVerified'],
			})

			validateUserNotExist(id)

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
