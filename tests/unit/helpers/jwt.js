const jwt = require('jsonwebtoken')

const makeAccessToken = (userId, options = {}) =>
	jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '5m', ...options })

const makeExpiredAccessToken = (userId) => makeAccessToken(userId, { expiresIn: -1 })

const makeRefreshToken = (userId, options = {}) =>
	jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '5m', ...options })

const makeExpiredRefreshToken = (userId) => makeRefreshToken(userId, { expiresIn: -1 })

module.exports = {
	makeAccessToken,
	makeExpiredAccessToken,
	makeRefreshToken,
	makeExpiredRefreshToken,
}
