jest.mock('../../models/index', () => {
	const User = {
		sequelize: { transaction: jest.fn(async (fn) => fn({})) },
		findOne: jest.fn(),
		create: jest.fn(),
	}
	return { User }
})

jest.mock('../../utils/session', () => ({
	createAccessToken: jest.fn(() => 'access'),
	createRefreshToken: jest.fn(() => 'refresh'),
	storeAuthSession: jest.fn().mockResolvedValue(),
	destroyAuthSession: jest.fn().mockResolvedValue(),
}))

jest.mock('bcrypt', () => ({
	compare: jest.fn(),
	genSalt: jest.fn().mockResolvedValue('salt'),
	hash: jest.fn().mockResolvedValue('hashed'),
}))

const { User } = require('../../models/index')
const bcrypt = require('bcrypt')
const authController = require('../../controllers/auth')

const makeRes = () => {
	const res = {}
	res.statusCode = 200
	res.cookies = {}
	res.cookie = jest.fn((name, val) => {
		res.cookies[name] = val
	})
	res.clearCookie = jest.fn((name) => {
		delete res.cookies[name]
	})
	res.status = function (code) {
		this.statusCode = code
		return this
	}
	res.json = function (payload) {
		this.body = payload
		return this
	}
	return res
}

describe('controllers/auth.js error branches', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('login returns 422 when user is not verified', async () => {
		User.findOne.mockResolvedValue({
			id: 1,
			email: 'a@b.com',
			password: 'hashed',
			isVerified: false,
		})

		const req = {
			method: 'POST',
			originalUrl: '/api/auth/login',
			body: { email: 'a@b.com', password: 'secret' },
		}
		const res = makeRes()

		await authController.login(req, res)

		expect(res.statusCode).toBe(422)
		expect(res.body).toEqual({ success: false, message: 'User is not verified', data: {} })
	})

	test('login returns 422 when password does not match', async () => {
		User.findOne.mockResolvedValue({
			id: 1,
			email: 'a@b.com',
			password: 'hashed',
			isVerified: true,
		})
		bcrypt.compare.mockResolvedValue(false)

		const req = {
			method: 'POST',
			originalUrl: '/api/auth/login',
			body: { email: 'a@b.com', password: 'wrong' },
		}
		const res = makeRes()

		await authController.login(req, res)

		expect(bcrypt.compare).toHaveBeenCalled()
		expect(res.statusCode).toBe(422)
		expect(res.body).toEqual({ success: false, message: 'Invalid Credentials', data: {} })
	})

	test('verify returns 401 when user is already verified', async () => {
		User.findOne.mockResolvedValue({
			id: 1,
			isVerified: true,
			verificationTokenExpires: Date.now() + 10000,
		})

		const req = {
			method: 'GET',
			originalUrl: '/api/auth/verify/xxx',
			params: { token: 'x'.repeat(64) },
		}
		const res = makeRes()

		await authController.verify(req, res)

		expect(res.statusCode).toBe(401)
		expect(res.body).toEqual({ success: false, message: 'User already verified', data: {} })
	})

	test('verify returns 422 when token expired', async () => {
		User.findOne.mockResolvedValue({
			id: 1,
			isVerified: false,
			verificationTokenExpires: Date.now() - 1000,
		})

		const req = {
			method: 'GET',
			originalUrl: '/api/auth/verify/xxx',
			params: { token: 'x'.repeat(64) },
		}
		const res = makeRes()

		await authController.verify(req, res)

		expect(res.statusCode).toBe(422)
		expect(res.body).toEqual({ success: false, message: 'Token Expired', data: {} })
	})

	test('resetPassword returns 422 when token expired', async () => {
		User.findOne.mockResolvedValue({ id: 1, resetPasswordTokenExpires: Date.now() - 1000 })

		const req = {
			method: 'POST',
			originalUrl: '/api/auth/reset/xxx',
			params: { token: 'x'.repeat(64) },
			body: { password: 'new-password' },
		}
		const res = makeRes()

		await authController.resetPassword(req, res)

		expect(res.statusCode).toBe(422)
		expect(res.body).toEqual({ success: false, message: 'Token Expired', data: {} })
	})
})
