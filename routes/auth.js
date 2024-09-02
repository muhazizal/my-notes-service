const express = require('express')

const {
	register,
	login,
	verify,
	resendVerification,
	forgotPassword,
	resetPassword,
	logout,
} = require('../controllers/auth')

const {
	registerSchema,
	loginSchema,
	resendVerificationSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} = require('../schema/auth')

const { emailBlastLimiter } = require('../utils/rate-limiter')

const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// Create user
router.put('/register', registerSchema, register)

// Login user
router.post('/login', loginSchema, login)

// Verify user
router.get('/verify/:token', verify)

// Resend verification
router.post(
	'/resend-verification',
	[emailBlastLimiter, resendVerificationSchema],
	resendVerification
)

// Forgot password
router.post('/forgot-password', [emailBlastLimiter, forgotPasswordSchema], forgotPassword)

// Reset password
router.post('/reset-password/:token', resetPasswordSchema, resetPassword)

// Logout
router.post('/logout', authMiddleware, logout)

module.exports = router
