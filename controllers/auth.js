const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')

const User = require('../models/user')
const model = User()

const {
	validateReqBody,
	validateUserExist,
	validateUserNotExist,
	validatePasswordNotMatch,
} = require('../utils/auth')

exports.register = async (req, res, next) => {
	try {
		await model.sequelize.transaction(async (t) => {
			const errors = validationResult(req)
			validateReqBody(errors, res)

			const { username, password, fullname } = req.body

			let user = await model.findOne({
				where: {
					username,
				},
				transaction: t,
			})

			validateUserExist(user)

			const salt = await bcrypt.genSalt(10)
			const hashedPassword = await bcrypt.hash(password, salt)

			return await model.create({ username, password: hashedPassword, fullname })
		})

		res.status(201).json({
			message: 'Success register user',
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
		const result = await model.sequelize.transaction(async (t) => {
			const errors = validationResult(req)
			validateReqBody(errors, res)

			const { username, password } = req.body

			const user = await model.findOne({
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
