const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')

const redisClient = require('../config/redis')

exports.resendVerificationLimiter = rateLimit({
	store: new RedisStore({
		sendCommand: (...args) => redisClient.sendCommand(args),
	}),
	windowMs: 24 * 60 * 60 * 1000,
	max: 3,
	keyGenerator: (req, res) => req.body.email,
	message: 'Too many requests, please try again later',
})
