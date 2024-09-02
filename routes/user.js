const express = require('express')

const { authMiddleware } = require('../middleware/auth')
const { getProfileById, updateProfile } = require('../controllers/user')
const { editProfileSchema } = require('../schema/user')

const router = express.Router()

// Get user profile
router.get('/:id', authMiddleware, getProfileById)

// Edit user profile
router.put('/:id', [authMiddleware, editProfileSchema], updateProfile)

module.exports = router
