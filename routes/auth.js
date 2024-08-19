const express = require('express')
const { body } = require('express-validator')

const { register, login } = require('../controllers/auth')

const router = express.Router()

router.put(
	'/register',
	[
		body('username').trim().notEmpty().withMessage('Username is empty'),
		body('password').trim().notEmpty().withMessage('Password is empty'),
		body('fullname').trim().notEmpty().withMessage('Password is empty'),
	],
	register
)
router.post(
	'/login',
	[
		body('username').trim().notEmpty().withMessage('Username is empty'),
		body('password').trim().notEmpty().withMessage('Password is empty'),
	],
	login
)

module.exports = router
