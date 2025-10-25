const consola = require('consola')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')

const redisClient = require('../config/redis')

const isRedisReady = () => redisClient?.isOpen && redisClient?.isReady

const WINDOW_MS = 24 * 60 * 60 * 1000
const MAX = 3

// Memory fallback limiters (never crash on offline Redis)
const emailLimiterMemory = rateLimit({
	windowMs: WINDOW_MS,
	max: MAX,
	keyGenerator: (req) => req.body.email,
	message: 'Too many requests, please try again later',
	standardHeaders: true,
	legacyHeaders: false,
})

const tokenLimiterMemory = rateLimit({
	windowMs: WINDOW_MS,
	max: MAX,
	keyGenerator: (req) => req.body.token,
	message: 'Too many requests, please try again later',
	standardHeaders: true,
	legacyHeaders: false,
})

// Lazily-created Redis-backed limiters
let emailLimiterRedis = null
let tokenLimiterRedis = null
let loggedMemoryFallback = false

const createRedisStore = () =>
	new RedisStore({
		sendCommand: (...args) => redisClient.sendCommand(args),
	})

const getEmailLimiter = () => {
	if (isRedisReady()) {
		if (!emailLimiterRedis) {
			try {
				emailLimiterRedis = rateLimit({
					store: createRedisStore(),
					windowMs: WINDOW_MS,
					max: MAX,
					keyGenerator: (req) => req.body.email,
					message: 'Too many requests, please try again later',
					standardHeaders: true,
					legacyHeaders: false,
				})
				consola.ready({ message: '✅ Rate limiter using RedisStore', badge: true })
			} catch (err) {
				consola.warn({ message: `⚠️ RedisStore init failed, using MemoryStore: ${err.message}`, badge: true })
				return emailLimiterMemory
			}
		}
		return emailLimiterRedis
	}
	if (!loggedMemoryFallback) {
		consola.warn({ message: '⚠️ Redis not ready, rate limiter using MemoryStore', badge: true })
		loggedMemoryFallback = true
	}
	return emailLimiterMemory
}

const getTokenLimiter = () => {
	if (isRedisReady()) {
		if (!tokenLimiterRedis) {
			try {
				tokenLimiterRedis = rateLimit({
					store: createRedisStore(),
					windowMs: WINDOW_MS,
					max: MAX,
					keyGenerator: (req) => req.body.token,
					message: 'Too many requests, please try again later',
					standardHeaders: true,
					legacyHeaders: false,
				})
				consola.ready({ message: '✅ Rate limiter using RedisStore', badge: true })
			} catch (err) {
				consola.warn({ message: `⚠️ RedisStore init failed, using MemoryStore: ${err.message}`, badge: true })
				return tokenLimiterMemory
			}
		}
		return tokenLimiterRedis
	}
	if (!loggedMemoryFallback) {
		consola.warn({ message: '⚠️ Redis not ready, rate limiter using MemoryStore', badge: true })
		loggedMemoryFallback = true
	}
	return tokenLimiterMemory
}

exports.emailBlastLimiter = (req, res, next) => getEmailLimiter()(req, res, next)
exports.tokenBlastLimiter = (req, res, next) => getTokenLimiter()(req, res, next)
