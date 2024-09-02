const express = require('express')

const { authMiddleware } = require('../middleware/auth')
const { getProfileById } = require('../controllers/user')

const router = express.Router()

router.get('/:id', authMiddleware, getProfileById)

module.exports = router
