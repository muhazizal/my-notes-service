const express = require('express')
const { register, login } = require('../controllers/auth')

const router = express.Router()

router.put('/register', register)
router.post('/login', login)

module.exports = router
