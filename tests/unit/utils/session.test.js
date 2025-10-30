const jwt = require('jsonwebtoken')
const {
	createAccessToken,
	createRefreshToken,
	setAuthCookies,
	destroyAuthCookies,
	storeAuthSession,
	destroyAuthSession,
} = require('../../../utils/session')

describe('utils/session', () => {
	const makeRes = () => ({
		cookie: jest.fn(),
		clearCookie: jest.fn(),
	})

	test('creates JWTs for access and refresh', () => {
		const at = createAccessToken(123)
		const rt = createRefreshToken(123)
		const payload1 = jwt.verify(at, process.env.JWT_SECRET)
		const payload2 = jwt.verify(rt, process.env.JWT_REFRESH_SECRET)
		expect(payload1.userId).toBe(123)
		expect(payload2.userId).toBe(123)
	})

	test('sets cookies with test env options (lax, not secure)', () => {
		const res = makeRes()
		setAuthCookies(res, 'A', 'R')
		expect(res.cookie).toHaveBeenCalledTimes(2)
		const [, , opts] = res.cookie.mock.calls[0]
		expect(opts).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: false, path: '/' })
	})

	test('clears cookies with test env options (lax, not secure)', () => {
		const res = makeRes()
		destroyAuthCookies(res)
		expect(res.clearCookie).toHaveBeenCalledTimes(2)
		const [, opts] = res.clearCookie.mock.calls[0]
		expect(opts).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: false, path: '/' })
	})

	test('uses production cookie options (sameSite none, secure true)', () => {
		const prevEnv = process.env.NODE_ENV
		process.env.NODE_ENV = 'production'
		const res = makeRes()
		setAuthCookies(res, 'A', 'R')
		const [, , opts] = res.cookie.mock.calls[0]
		expect(opts).toMatchObject({ sameSite: 'none', secure: true })
		process.env.NODE_ENV = prevEnv
	})

	test('store/destroy session delegates to cookie helpers', async () => {
		const res = makeRes()
		await storeAuthSession(res, 'AA', 'RR')
		await destroyAuthSession(res)
		expect(res.cookie).toHaveBeenCalled()
		expect(res.clearCookie).toHaveBeenCalled()
	})
})
