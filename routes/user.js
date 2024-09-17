const express = require('express')

const { authMiddleware } = require('../middleware/auth')
const { getProfile, updateProfile, deleteAccount } = require('../controllers/user')
const { editProfileSchema } = require('../schema/user')

const router = express.Router()

// Get user profile
router.get('/profile', authMiddleware, getProfile)

// Edit user profile
router.put('/profile', [authMiddleware, editProfileSchema], updateProfile)

// Delete user account
router.delete('/', authMiddleware, deleteAccount)

module.exports = router
