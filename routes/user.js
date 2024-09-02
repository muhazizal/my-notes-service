const express = require('express')

const { authMiddleware } = require('../middleware/auth')
const { getProfileById, updateProfile, deleteAccount } = require('../controllers/user')
const { editProfileSchema } = require('../schema/user')

const router = express.Router()

// Get user profile
router.get('/:id', authMiddleware, getProfileById)

// Edit user profile
router.put('/:id', [authMiddleware, editProfileSchema], updateProfile)

// Delete user account
router.delete('/:id', authMiddleware, deleteAccount)

module.exports = router
