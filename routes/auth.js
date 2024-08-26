const express = require('express')

const { register, login, verify, resendVerification } = require('../controllers/auth')
const { registerSchema, loginSchema, resendVerificationSchema } = require('../schema/auth')

const router = express.Router()

// CREATE user
router.put('/register', registerSchema, register)

// LOGIN user
router.post('/login', loginSchema, login)

// VERIFY user
router.get('/verify/:token', verify)

// RESEND verification
router.post('/resend-verification', resendVerificationSchema, resendVerification)

module.exports = router
