const express = require('express')
const { body } = require('express-validator')

const { register, login, verify } = require('../controllers/auth')

const router = express.Router()

// CREATE user
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

// LOGIN user
router.post(
	'/login',
	[
		body('username').trim().notEmpty().withMessage('Username is empty'),
		body('password').trim().notEmpty().withMessage('Password is empty'),
	],
	login
)

// VERIFY user
router.get('/verify/:token', verify)

module.exports = router
