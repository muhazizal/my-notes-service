const { authMiddleware } = require('../../../middleware/auth')
const { makeRes } = require('../helpers/http')
const {
  makeAccessToken,
  makeExpiredAccessToken,
  makeRefreshToken,
  makeExpiredRefreshToken,
} = require('../helpers/jwt')
const {
  assertUnauthorizedSimple,
  assertUnauthorized,
  assertJwtError,
  assertInternalServerError,
} = require('../helpers/assert')

	describe('auth middleware unit', () => {
		test('returns 401 and clears cookies when no access token', async () => {
			const req = { cookies: {}, originalUrl: '/x', method: 'GET' }
			const res = makeRes()
			const next = jest.fn()

			await authMiddleware(req, res, next)

			assertUnauthorizedSimple(res)
			expect(res.cookiesCleared.map((c) => c.name)).toEqual(['access_token', 'refresh_token'])
			expect(next).not.toHaveBeenCalled()
		})

		test('calls next when access token valid', async () => {
			const token = makeAccessToken(123)
			const req = { cookies: { access_token: token }, originalUrl: '/x', method: 'GET' }
			const res = makeRes()
			const next = jest.fn()

			await authMiddleware(req, res, next)

		expect(next).toHaveBeenCalled()
		expect(req.userId).toBe(123)
		})

		test('rotates tokens when access expired and refresh valid', async () => {
			const expiredAccess = makeExpiredAccessToken(9)
			const refresh = makeRefreshToken(9)
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
			const expiredAccess = makeExpiredAccessToken(7)
			const expiredRefresh = makeExpiredRefreshToken(7)
			const req = {
				cookies: { access_token: expiredAccess, refresh_token: expiredRefresh },
				originalUrl: '/x',
				method: 'GET',
			}
			const res = makeRes()
			const next = jest.fn()

			await authMiddleware(req, res, next)

			assertUnauthorized(res)
			expect(next).not.toHaveBeenCalled()
		})

		test('returns 500 when access token is invalid (malformed)', async () => {
			const req = { cookies: { access_token: 'not-a-valid-jwt' }, originalUrl: '/x', method: 'GET' }
			const res = makeRes()
			const next = jest.fn()

			await authMiddleware(req, res, next)

			expect(next).not.toHaveBeenCalled()
			assertJwtError(res)
		})

		test('returns 401 when access expired and refresh token missing', async () => {
			const expiredAccess = makeExpiredAccessToken(11)
			const req = { cookies: { access_token: expiredAccess }, originalUrl: '/x', method: 'GET' }
			const res = makeRes()
			const next = jest.fn()

			await authMiddleware(req, res, next)

			expect(next).not.toHaveBeenCalled()
			assertUnauthorizedSimple(res)
			expect(res.cookiesCleared.map((c) => c.name).sort()).toEqual(['access_token', 'refresh_token'])
		})

		test('returns 500 when refresh token is invalid (malformed)', async () => {
			const expiredAccess = makeExpiredAccessToken(42)
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
			assertJwtError(res)
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
			assertInternalServerError(res)
		})
})
