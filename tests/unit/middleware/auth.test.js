const jwt = require('jsonwebtoken')
const { authMiddleware } = require('../../../middleware/auth')

const makeRes = () => {
	const res = {}
	res.statusCode = 200
	res.cookiesSet = []
	res.cookiesCleared = []
	res.cookie = (name, value, options) => {
		res.cookiesSet.push({ name, value, options })
		return res
	}
	res.clearCookie = (name, options) => {
		res.cookiesCleared.push({ name, options })
		return res
	}
	res.status = (code) => {
		res.statusCode = code
		return res
	}
	res.json = (body) => {
		res.body = body
		return res
	}
	return res
}

describe('auth middleware unit', () => {
	test('returns 401 and clears cookies when no access token', async () => {
		const req = { cookies: {}, originalUrl: '/x', method: 'GET' }
		const res = makeRes()
		const next = jest.fn()

		await authMiddleware(req, res, next)

		expect(res.statusCode).toBe(401)
		expect(res.body).toEqual({ message: 'Unauthorized' })
		expect(res.cookiesCleared.map((c) => c.name)).toEqual(['access_token', 'refresh_token'])
		expect(next).not.toHaveBeenCalled()
	})

	test('calls next when access token valid', async () => {
		const token = jwt.sign({ userId: 123 }, process.env.JWT_SECRET, { expiresIn: '5m' })
		const req = { cookies: { access_token: token }, originalUrl: '/x', method: 'GET' }
		const res = makeRes()
		const next = jest.fn()

		await authMiddleware(req, res, next)

		expect(next).toHaveBeenCalled()
		expect(req.userId).toBe(123)
	})

	test('rotates tokens when access expired and refresh valid', async () => {
		const expiredAccess = jwt.sign({ userId: 9 }, process.env.JWT_SECRET, { expiresIn: -1 })
		const refresh = jwt.sign({ userId: 9 }, process.env.JWT_REFRESH_SECRET, { expiresIn: '5m' })
		const req = {
			cookies: { access_token: expiredAccess, refresh_token: refresh },
			originalUrl: '/x',
			method: 'GET',
		}
		const res = makeRes()
		const next = jest.fn()

		await authMiddleware(req, res, next)

		expect(next).toHaveBeenCalled()
		expect(req.userId).toBe(9)
		const setNames = res.cookiesSet.map((c) => c.name).sort()
		expect(setNames).toEqual(['access_token', 'refresh_token'])
	})

	test('returns 401 when both tokens invalid/expired', async () => {
		const expiredAccess = jwt.sign({ userId: 7 }, process.env.JWT_SECRET, { expiresIn: -1 })
		const expiredRefresh = jwt.sign({ userId: 7 }, process.env.JWT_REFRESH_SECRET, {
			expiresIn: -1,
		})
		const req = {
			cookies: { access_token: expiredAccess, refresh_token: expiredRefresh },
			originalUrl: '/x',
			method: 'GET',
		}
		const res = makeRes()
		const next = jest.fn()

		await authMiddleware(req, res, next)

		expect(res.statusCode).toBe(401)
		expect(res.body).toEqual({ success: false, message: 'Unauthorized' })
		expect(next).not.toHaveBeenCalled()
	})

	test('returns 500 when access token is invalid (malformed)', async () => {
		const req = { cookies: { access_token: 'not-a-valid-jwt' }, originalUrl: '/x', method: 'GET' }
		const res = makeRes()
		const next = jest.fn()

		await authMiddleware(req, res, next)

		expect(next).not.toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: expect.stringMatching(/jwt/i) })
	})

	test('returns 401 when access expired and refresh token missing', async () => {
		const expiredAccess = jwt.sign({ userId: 11 }, process.env.JWT_SECRET, { expiresIn: -1 })
		const req = { cookies: { access_token: expiredAccess }, originalUrl: '/x', method: 'GET' }
		const res = makeRes()
		const next = jest.fn()

		await authMiddleware(req, res, next)

		expect(next).not.toHaveBeenCalled()
		expect(res.statusCode).toBe(401)
		expect(res.body).toEqual({ message: 'Unauthorized' })
		expect(res.cookiesCleared.map((c) => c.name).sort()).toEqual(['access_token', 'refresh_token'])
	})

	test('returns 500 when refresh token is invalid (malformed)', async () => {
		const expiredAccess = jwt.sign({ userId: 42 }, process.env.JWT_SECRET, { expiresIn: -1 })
		const invalidRefresh = 'not-a-valid-jwt'
		const req = {
			cookies: { access_token: expiredAccess, refresh_token: invalidRefresh },
			originalUrl: '/x',
			method: 'GET',
		}
		const res = makeRes()
		const next = jest.fn()

		await authMiddleware(req, res, next)

		expect(next).not.toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: expect.stringMatching(/jwt/i) })
	})

	test('falls back to Internal Server Error when refresh verify throws without message', async () => {
		jest.resetModules()
		jest.doMock('jsonwebtoken', () => ({
			verify: (token, secret) => {
				if (secret === process.env.JWT_SECRET) {
					const e = new Error()
					e.name = 'TokenExpiredError'
					throw e
				}
				// Throw a non-Error object without message to trigger fallback branch
				throw { name: 'SomeOtherError' }
			},
		}))

		const { authMiddleware: mw } = require('../../../middleware/auth')

		const req = {
			cookies: { access_token: 'A', refresh_token: 'R' },
			originalUrl: '/x',
			method: 'GET',
		}
		const res = makeRes()
		const next = jest.fn()

		await mw(req, res, next)

		expect(next).not.toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error' })
	})
})
