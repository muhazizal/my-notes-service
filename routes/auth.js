const express = require('express')
const { body } = require('express-validator')

const { register, login } = require('../controllers/auth')

const router = express.Router()

router.put(
	'/register',
	[
		body('username').trim().notEmpty().withMessage('Username is empty'),
		body('email').isEmail().withMessage('Email is empty').normalizeEmail(),
		body('password').trim().isLength({ min: 5 }).withMessage('Password minimum 5 chars'),
		body('fullname').trim().notEmpty().withMessage('Fullname is empty'),
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
