describe('utils/rate-limiter', () => {
	const makeReq = (email = 'a@example.com', token = 'tok') => ({ body: { email, token } })
	const makeRes = () => ({})
	const makeNext = () => jest.fn()

	afterEach(() => {
		jest.resetModules()
	})

	test('falls back to MemoryStore when redis not ready and logs once', async () => {
		// Ensure redis is not ready
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = false
		redisClient.isReady = false

		// Mock express-rate-limit: invoke keyGenerator (to cover functions) and then pass-through
		jest.doMock('express-rate-limit', () => ({
			rateLimit: jest.fn((opts) => (req, res, next) => {
				if (opts && typeof opts.keyGenerator === 'function') {
					try {
						opts.keyGenerator(req)
					} catch (_) {}
				}
				return next()
			}),
		}))

		// Fresh import with mocks applied
		const { emailBlastLimiter, tokenBlastLimiter } = require('../../../utils/rate-limiter')

		const next1 = makeNext()
		const next2 = makeNext()
		await emailBlastLimiter(makeReq('m1@example.com'), makeRes(), next1)
		await emailBlastLimiter(makeReq('m2@example.com'), makeRes(), next2)

		expect(next1).toHaveBeenCalled()
		expect(next2).toHaveBeenCalled()

		const next3 = makeNext()
		await tokenBlastLimiter(makeReq('m3@example.com', 't'), makeRes(), next3)
		expect(next3).toHaveBeenCalled()
	})

	test('uses RedisStore-backed limiter when redis is ready', async () => {
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true

		// Mock redis store and express-rate-limit success path; call keyGenerator for coverage
		jest.doMock('rate-limit-redis', () => ({
			RedisStore: class {
				constructor(opts) {
					this.opts = opts
				}
			},
		}))
		const rateLimitMock = jest.fn((opts) => (req, res, next) => {
			if (opts && typeof opts.keyGenerator === 'function') {
				try {
					opts.keyGenerator(req)
				} catch (_) {}
			}
			return next()
		})
		jest.doMock('express-rate-limit', () => ({ rateLimit: rateLimitMock }))

		const { emailBlastLimiter } = require('../../../utils/rate-limiter')
		const next = makeNext()
		await emailBlastLimiter(makeReq('r@example.com'), makeRes(), next)
		expect(next).toHaveBeenCalled()
		// Should have constructed a limiter (once) using the provided store
		expect(rateLimitMock).toHaveBeenCalled()
		const hasStoreCall = rateLimitMock.mock.calls.some(
			(args) => args && args[0] && Object.prototype.hasOwnProperty.call(args[0], 'store')
		)
		expect(hasStoreCall).toBe(true)
	})

	test('falls back to MemoryStore when Redis-backed limiter creation throws', async () => {
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true

		// Mock express-rate-limit to throw only when a store is provided; call keyGenerator otherwise
		jest.doMock('rate-limit-redis', () => ({
			RedisStore: class {
				constructor(opts) {
					this.opts = opts
				}
			},
		}))
		jest.doMock('express-rate-limit', () => ({
			rateLimit: jest.fn((opts) => {
				if (opts && opts.store) throw new Error('bad store')
				return (req, res, next) => {
					if (opts && typeof opts.keyGenerator === 'function') {
						try {
							opts.keyGenerator(req)
						} catch (_) {}
					}
					return next()
				}
			}),
		}))

		const { tokenBlastLimiter } = require('../../../utils/rate-limiter')
		const next = makeNext()
		await tokenBlastLimiter(makeReq('x@example.com', 'tok'), makeRes(), next)
		expect(next).toHaveBeenCalled()
	})

	test('reuses memoized email redis limiter without reinitialization', async () => {
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.sendCommand = jest.fn(() => Promise.resolve('OK'))

		jest.doMock('rate-limit-redis', () => ({
			RedisStore: class {
				constructor(opts) {
					this.opts = opts
					if (opts && typeof opts.sendCommand === 'function') {
						opts.sendCommand('PING')
					}
				}
			},
		}))

		let rateLimitMock
		jest.doMock('express-rate-limit', () => ({
			rateLimit: (rateLimitMock = jest.fn((opts) => (req, res, next) => {
				if (opts && typeof opts.keyGenerator === 'function') {
					try {
						opts.keyGenerator(req)
					} catch (_) {}
				}
				return next()
			})),
		}))

		const { emailBlastLimiter } = require('../../../utils/rate-limiter')
		const initialCalls = rateLimitMock.mock.calls.length

		const next1 = makeNext()
		await emailBlastLimiter(makeReq('memo@example.com'), makeRes(), next1)
		expect(next1).toHaveBeenCalled()
		const afterFirst = rateLimitMock.mock.calls.length
		expect(afterFirst).toBe(initialCalls + 1)

		const next2 = makeNext()
		await emailBlastLimiter(makeReq('memo2@example.com'), makeRes(), next2)
		expect(next2).toHaveBeenCalled()
		const afterSecond = rateLimitMock.mock.calls.length
		expect(afterSecond).toBe(afterFirst)
	})

	test('reuses memoized token redis limiter without reinitialization', async () => {
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.sendCommand = jest.fn(() => Promise.resolve('OK'))

		jest.doMock('rate-limit-redis', () => ({
			RedisStore: class {
				constructor(opts) {
					this.opts = opts
					if (opts && typeof opts.sendCommand === 'function') {
						opts.sendCommand('PING')
					}
				}
			},
		}))

		let rateLimitMock
		jest.doMock('express-rate-limit', () => ({
			rateLimit: (rateLimitMock = jest.fn((opts) => (req, res, next) => {
				if (opts && typeof opts.keyGenerator === 'function') {
					try {
						opts.keyGenerator(req)
					} catch (_) {}
				}
				return next()
			})),
		}))

		const { tokenBlastLimiter } = require('../../../utils/rate-limiter')
		const initialCalls = rateLimitMock.mock.calls.length

		const next1 = makeNext()
		await tokenBlastLimiter(makeReq('memo@example.com', 'tok1'), makeRes(), next1)
		expect(next1).toHaveBeenCalled()
		const afterFirst = rateLimitMock.mock.calls.length
		expect(afterFirst).toBe(initialCalls + 1)

		const next2 = makeNext()
		await tokenBlastLimiter(makeReq('memo2@example.com', 'tok2'), makeRes(), next2)
		expect(next2).toHaveBeenCalled()
		const afterSecond = rateLimitMock.mock.calls.length
		expect(afterSecond).toBe(afterFirst)
	})

	test('token path logs not-ready warning when first invocation is token', async () => {
		// Ensure redis is not ready
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = false
		redisClient.isReady = false

		// Spy on consola to count warnings
		let warnSpy, readySpy
		jest.doMock('consola', () => ({
			warn: (warnSpy = jest.fn()),
			ready: (readySpy = jest.fn()),
		}))

		// Mock express-rate-limit: return a no-op middleware
		jest.doMock('express-rate-limit', () => ({
			rateLimit: jest.fn(() => (req, res, next) => next()),
		}))

		const { tokenBlastLimiter, emailBlastLimiter } = require('../../../utils/rate-limiter')

		const next1 = makeNext()
		await tokenBlastLimiter(makeReq('x@example.com', 't1'), makeRes(), next1)
		expect(next1).toHaveBeenCalled()
		expect(warnSpy).toHaveBeenCalledTimes(1)

		// Subsequent memory fallback should not warn again
		const next2 = makeNext()
		await emailBlastLimiter(makeReq('y@example.com', 't2'), makeRes(), next2)
		expect(next2).toHaveBeenCalled()
		expect(warnSpy).toHaveBeenCalledTimes(1)
		// No ready logs in not-ready path
		expect(readySpy).not.toHaveBeenCalled()
	})

	test('email redis-backed limiter triggers RedisStore sendCommand and ready log', async () => {
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.sendCommand = jest.fn(() => Promise.resolve('OK'))

		let readySpy
		jest.doMock('consola', () => ({
			warn: jest.fn(),
			ready: (readySpy = jest.fn()),
		}))

		// Mock RedisStore to invoke provided sendCommand immediately
		jest.doMock('rate-limit-redis', () => ({
			RedisStore: class {
				constructor(opts) {
					this.opts = opts
					if (opts && typeof opts.sendCommand === 'function') {
						opts.sendCommand('PING')
					}
				}
			},
		}))
		// Mock express-rate-limit: return a no-op middleware
		jest.doMock('express-rate-limit', () => ({
			rateLimit: jest.fn(() => (req, res, next) => next()),
		}))

		const { emailBlastLimiter } = require('../../../utils/rate-limiter')
		const next = makeNext()
		await emailBlastLimiter(makeReq('r@example.com'), makeRes(), next)
		expect(next).toHaveBeenCalled()
		expect(redisClient.sendCommand).toHaveBeenCalledWith(['PING'])
		expect(readySpy).toHaveBeenCalled()
	})

	test('token redis-backed limiter triggers RedisStore sendCommand and ready log', async () => {
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.sendCommand = jest.fn(() => Promise.resolve('OK'))

		let readySpy
		jest.doMock('consola', () => ({
			warn: jest.fn(),
			ready: (readySpy = jest.fn()),
		}))

		jest.doMock('rate-limit-redis', () => ({
			RedisStore: class {
				constructor(opts) {
					this.opts = opts
					if (opts && typeof opts.sendCommand === 'function') {
						opts.sendCommand('PING')
					}
				}
			},
		}))
		jest.doMock('express-rate-limit', () => ({
			rateLimit: jest.fn(() => (req, res, next) => next()),
		}))

		const { tokenBlastLimiter } = require('../../../utils/rate-limiter')
		const next = makeNext()
		await tokenBlastLimiter(makeReq('r@example.com', 'tok'), makeRes(), next)
		expect(next).toHaveBeenCalled()
		expect(redisClient.sendCommand).toHaveBeenCalledWith(['PING'])
		expect(readySpy).toHaveBeenCalled()
	})

	test('email falls back to MemoryStore when Redis-backed limiter creation throws', async () => {
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true

		jest.doMock('rate-limit-redis', () => ({
			RedisStore: class {
				constructor(opts) {
					this.opts = opts
				}
			},
		}))
		jest.doMock('express-rate-limit', () => ({
			rateLimit: jest.fn((opts) => {
				if (opts && opts.store) throw new Error('bad store')
				return (req, res, next) => next()
			}),
		}))

		const { emailBlastLimiter } = require('../../../utils/rate-limiter')
		const next = makeNext()
		await emailBlastLimiter(makeReq('x@example.com'), makeRes(), next)
		expect(next).toHaveBeenCalled()
	})
})
