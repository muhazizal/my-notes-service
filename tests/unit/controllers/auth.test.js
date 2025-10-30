jest.mock('../../../models/index', () => {
	const User = {
		sequelize: { transaction: jest.fn(async (fn) => fn({})) },
		findOne: jest.fn(),
		create: jest.fn(),
	}
	return { User }
})

jest.mock('../../../utils/session', () => ({
	createAccessToken: jest.fn(() => 'access'),
	createRefreshToken: jest.fn(() => 'refresh'),
	storeAuthSession: jest.fn().mockResolvedValue(),
	destroyAuthSession: jest.fn().mockResolvedValue(),
}))

jest.mock('../../../utils/token', () => ({
	generateToken: jest.fn(() => ({ token: 'tok123', tokenExpires: Date.now() + 60000 })),
}))

jest.mock('../../../utils/send-email', () => ({
	sendEmailVerification: jest.fn().mockResolvedValue(),
	sendEmailResetPassword: jest.fn().mockResolvedValue(),
}))

jest.mock('bcrypt', () => ({
	compare: jest.fn(),
	genSalt: jest.fn().mockResolvedValue('salt'),
	hash: jest.fn().mockResolvedValue('hashed'),
}))

const { User } = require('../../../models/index')
const bcrypt = require('bcrypt')
const authController = require('../../../controllers/auth')

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

describe('controllers/auth.js success and email-failure branches', () => {
	const { sendEmailVerification, sendEmailResetPassword } = require('../../../utils/send-email')
	const { generateToken } = require('../../../utils/token')
	const consola = require('consola')

	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('register succeeds and sends verification email', async () => {
		User.findOne.mockResolvedValue(null)
		User.create.mockResolvedValue({ id: 1 })
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/register',
			body: { email: 'u@example.com', password: 'pw', username: 'user', fullname: 'User Name' },
		}
		const res = makeRes()

		await authController.register(req, res)

		expect(res.statusCode).toBe(201)
		expect(res.body).toEqual({
			message: 'Success register user, please verify your email',
			code: 201,
		})
		expect(generateToken).toHaveBeenCalled()
		expect(sendEmailVerification).toHaveBeenCalledWith(req, 'tok123', 'u@example.com')
	})

	test('register logs warn when email sending fails', async () => {
		User.findOne.mockResolvedValue(null)
		User.create.mockResolvedValue({ id: 1 })
		sendEmailVerification.mockRejectedValueOnce(new Error('email-fail'))
		const warnSpy = jest.spyOn(consola, 'warn').mockImplementation(() => {})

		const req = {
			method: 'POST',
			originalUrl: '/api/auth/register',
			body: { email: 'u2@example.com', password: 'pw', username: 'user2', fullname: 'User Two' },
		}
		const res = makeRes()

		await authController.register(req, res)

		expect(res.statusCode).toBe(201)
		expect(warnSpy).toHaveBeenCalled()
	})

	test('register warn uses tokenLength fallback when token undefined', async () => {
		User.findOne.mockResolvedValue(null)
		User.create.mockResolvedValue({ id: 1 })
		generateToken.mockReturnValueOnce({ token: undefined, tokenExpires: Date.now() + 60000 })
		sendEmailVerification.mockRejectedValueOnce(new Error('fail'))
		const warnSpy = jest.spyOn(consola, 'warn').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/register',
			body: { email: 'u3@example.com', password: 'pw', username: 'user3', fullname: 'User Three' },
		}
		const res = makeRes()
		await authController.register(req, res)
		expect(warnSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(201)
	})

	test('register logs error and returns 500 when DB throws', async () => {
		User.findOne.mockRejectedValueOnce(new Error('db-fail'))
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})

		const req = {
			method: 'POST',
			originalUrl: '/api/auth/register',
			body: { email: 'err@example.com', password: 'pw', username: 'err', fullname: 'Err User' },
		}
		const res = makeRes()

		await authController.register(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
	})

	test('login succeeds and stores session', async () => {
		User.findOne.mockResolvedValue({
			id: 10,
			email: 'a@b.com',
			password: 'hashed',
			isVerified: true,
		})
		bcrypt.compare.mockResolvedValue(true)

		const req = {
			method: 'POST',
			originalUrl: '/api/auth/login',
			body: { email: 'a@b.com', password: 'secret' },
		}
		const res = makeRes()

		await authController.login(req, res)

		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success login user', code: 200 })
	})

	test('logout succeeds', async () => {
		const req = { method: 'POST', originalUrl: '/api/auth/logout' }
		const res = makeRes()
		await authController.logout(req, res)
		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success logout user', code: 200 })
	})

	test('logout logs error and returns 500 when destroy fails', async () => {
		const { destroyAuthSession } = require('../../../utils/session')
		destroyAuthSession.mockRejectedValueOnce(new Error('boom'))
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})

		const req = { method: 'POST', originalUrl: '/api/auth/logout' }
		const res = makeRes()
		await authController.logout(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
	})

	test('logout catch falls back to 500 and default message/data when error lacks fields', async () => {
		const { destroyAuthSession } = require('../../../utils/session')
		destroyAuthSession.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { method: 'POST', originalUrl: '/api/auth/logout' }
		const res = makeRes()
		await authController.logout(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})

	test('checkAuthSession returns info', () => {
		const req = { headers: { a: 1 }, cookies: { b: 2 } }
		const res = makeRes()
		authController.checkAuthSession(req, res)
		expect(res.body.message).toBe('Current auth session')
		expect(res.body.headers).toEqual({ a: 1 })
		expect(res.body.cookies).toEqual({ b: 2 })
	})

	test('verify succeeds and updates user', async () => {
		const user = {
			id: 1,
			isVerified: false,
			verificationTokenExpires: Date.now() + 10000,
			verificationToken: 'old',
			save: jest.fn().mockResolvedValue(),
		}
		User.findOne.mockResolvedValue(user)
		const req = {
			method: 'GET',
			originalUrl: '/api/auth/verify/xxx',
			params: { token: 'x'.repeat(64) },
		}
		const res = makeRes()

		await authController.verify(req, res)

		expect(res.statusCode).toBe(200)
		expect(user.isVerified).toBe(true)
		expect(user.verificationToken).toBeNull()
		expect(user.verificationTokenExpires).toBeNull()
		expect(user.save).toHaveBeenCalled()
	})

	test('verify logs error when findOne throws', async () => {
		User.findOne.mockRejectedValueOnce(new Error('db'))
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'GET',
			originalUrl: '/api/auth/verify/xxx',
			params: { token: 'x'.repeat(64) },
		}
		const res = makeRes()
		await authController.verify(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
	})

	test('resendVerification succeeds and sends email', async () => {
		const user = {
			id: 2,
			email: 'v@example.com',
			isVerified: false,
			save: jest.fn().mockResolvedValue(),
		}
		User.findOne.mockResolvedValue(user)
		const req = { method: 'POST', originalUrl: '/api/auth/resend', body: { token: 'oldtok' } }
		const res = makeRes()

		await authController.resendVerification(req, res)

		expect(res.statusCode).toBe(200)
		expect(user.save).toHaveBeenCalled()
		expect(sendEmailVerification).toHaveBeenCalledWith(req, 'tok123', 'v@example.com')
	})

	test('resendVerification logs warn when email sending fails', async () => {
		const user = {
			id: 2,
			email: 'vv@example.com',
			isVerified: false,
			save: jest.fn().mockResolvedValue(),
		}
		User.findOne.mockResolvedValue(user)
		sendEmailVerification.mockRejectedValueOnce(new Error('fail'))
		const warnSpy = jest.spyOn(consola, 'warn').mockImplementation(() => {})

		const req = { method: 'POST', originalUrl: '/api/auth/resend', body: { token: 'oldtok' } }
		const res = makeRes()
		await authController.resendVerification(req, res)
		expect(warnSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(200)
	})

	test('resendVerification warn uses tokenLength fallback when token undefined', async () => {
		const user = {
			id: 2,
			email: 'vvv@example.com',
			isVerified: false,
			save: jest.fn().mockResolvedValue(),
		}
		User.findOne.mockResolvedValue(user)
		generateToken.mockReturnValueOnce({ token: undefined, tokenExpires: Date.now() + 60000 })
		sendEmailVerification.mockRejectedValueOnce(new Error('fail'))
		const warnSpy = jest.spyOn(consola, 'warn').mockImplementation(() => {})
		const req = { method: 'POST', originalUrl: '/api/auth/resend', body: { token: 'oldtok' } }
		const res = makeRes()
		await authController.resendVerification(req, res)
		expect(warnSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(200)
	})

	test('resendVerification returns 401 when user not found (catch path)', async () => {
		User.findOne.mockResolvedValue(null)
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { method: 'POST', originalUrl: '/api/auth/resend', body: { token: 'doesntmatter' } }
		const res = makeRes()
		await authController.resendVerification(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(401)
	})

	test('resendVerification returns 500 when DB throws (catch path)', async () => {
		const err = new Error('db-fail')
		User.findOne.mockRejectedValueOnce(err)
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { method: 'POST', originalUrl: '/api/auth/resend', body: { token: 'tok' } }
		const res = makeRes()
		await authController.resendVerification(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
	})

	test('forgotPassword succeeds and sends email', async () => {
		const user = { id: 3, email: 'fp@example.com', save: jest.fn().mockResolvedValue() }
		User.findOne.mockResolvedValue(user)
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/forgot',
			body: { email: 'fp@example.com' },
		}
		const res = makeRes()

		await authController.forgotPassword(req, res)

		expect(res.statusCode).toBe(200)
		expect(user.save).toHaveBeenCalled()
		expect(sendEmailResetPassword).toHaveBeenCalledWith(req, 'tok123', 'fp@example.com')
	})

	test('forgotPassword logs warn when email sending fails', async () => {
		const user = { id: 3, email: 'fp2@example.com', save: jest.fn().mockResolvedValue() }
		User.findOne.mockResolvedValue(user)
		sendEmailResetPassword.mockRejectedValueOnce(new Error('fail'))
		const warnSpy = jest.spyOn(consola, 'warn').mockImplementation(() => {})

		const req = {
			method: 'POST',
			originalUrl: '/api/auth/forgot',
			body: { email: 'fp2@example.com' },
		}
		const res = makeRes()
		await authController.forgotPassword(req, res)
		expect(warnSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(200)
	})

	test('forgotPassword warn uses tokenLength fallback when token undefined', async () => {
		const user = { id: 33, email: 'fpu@example.com', save: jest.fn().mockResolvedValue() }
		User.findOne.mockResolvedValue(user)
		generateToken.mockReturnValueOnce({ token: undefined, tokenExpires: Date.now() + 60000 })
		sendEmailResetPassword.mockRejectedValueOnce(new Error('fail'))
		const warnSpy = jest.spyOn(consola, 'warn').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/forgot',
			body: { email: 'fpu@example.com' },
		}
		const res = makeRes()
		await authController.forgotPassword(req, res)
		expect(warnSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(200)
	})

	test('forgotPassword returns 401 when user not found (catch path)', async () => {
		User.findOne.mockResolvedValue(null)
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/forgot',
			body: { email: 'missing@example.com' },
		}
		const res = makeRes()
		await authController.forgotPassword(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(422)
	})

	test('resetPassword succeeds and updates user', async () => {
		const user = {
			id: 4,
			resetPasswordTokenExpires: Date.now() + 10000,
			password: 'old',
			save: jest.fn().mockResolvedValue(),
		}
		User.findOne.mockResolvedValue(user)
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/reset/xxx',
			params: { token: 'x'.repeat(64) },
			body: { password: 'newpass' },
		}
		const res = makeRes()

		await authController.resetPassword(req, res)

		expect(res.statusCode).toBe(200)
		expect(user.password).toBe('hashed')
		expect(user.resetPasswordToken).toBeNull()
		expect(user.resetPasswordTokenExpires).toBeNull()
		expect(user.save).toHaveBeenCalled()
	})

	test('forgotPassword returns 500 when DB throws (catch path)', async () => {
		User.findOne.mockRejectedValueOnce(new Error('db'))
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/forgot',
			body: { email: 'x@example.com' },
		}
		const res = makeRes()
		await authController.forgotPassword(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
	})

	test('resetPassword returns 500 when findOne throws (catch path)', async () => {
		User.findOne.mockRejectedValueOnce(new Error('db'))
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/reset/xxx',
			params: { token: 'x'.repeat(64) },
			body: { password: 'new' },
		}
		const res = makeRes()
		await authController.resetPassword(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
	})

	test('login returns 500 when DB throws (catch path)', async () => {
		User.findOne.mockRejectedValueOnce(new Error('db'))
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/login',
			body: { email: 'a@b.com', password: 'x' },
		}
		const res = makeRes()
		await authController.login(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
	})

	test('register catch uses provided statusCode and validation data', async () => {
		const err = new Error('fail')
		err.statusCode = 409
		err.data = { field: 'email' }
		User.findOne.mockRejectedValueOnce(err)
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/register',
			body: { email: 'dup@example.com', password: 'pw', username: 'dup', fullname: 'Dup' },
		}
		const res = makeRes()
		await authController.register(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(409)
		expect(res.body).toEqual({ success: false, message: 'fail', data: { field: 'email' } })
	})

	test('register catch falls back to 500 and default message/data when error lacks fields', async () => {
		User.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/register',
			body: { email: 'x@example.com', password: 'pw', username: 'x', fullname: 'X' },
		}
		const res = makeRes()
		await authController.register(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})

	test('login catch falls back to 500 and default message/data when error lacks fields', async () => {
		User.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/login',
			body: { email: 'a@b.com', password: 'x' },
		}
		const res = makeRes()
		await authController.login(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})

	test('verify catch falls back to 500 and default message/data when error lacks fields', async () => {
		User.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'GET',
			originalUrl: '/api/auth/verify/xxx',
			params: { token: 'x'.repeat(64) },
		}
		const res = makeRes()
		await authController.verify(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})

	test('resendVerification catch falls back to 500 and default message/data when error lacks fields', async () => {
		User.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { method: 'POST', originalUrl: '/api/auth/resend', body: { token: 'tok' } }
		const res = makeRes()
		await authController.resendVerification(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})

	test('forgotPassword catch falls back to 500 and default message/data when error lacks fields', async () => {
		User.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/forgot',
			body: { email: 'x@example.com' },
		}
		const res = makeRes()
		await authController.forgotPassword(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})

	test('resetPassword catch falls back to 500 and default message/data when error lacks fields', async () => {
		User.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/reset/xxx',
			params: { token: 'x'.repeat(64) },
			body: { password: 'new' },
		}
		const res = makeRes()
		await authController.resetPassword(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})

	test('resetPassword catch logs params token length fallback when token missing', async () => {
		User.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			method: 'POST',
			originalUrl: '/api/auth/reset/xxx',
			params: {},
			body: { password: 'new' },
		}
		const res = makeRes()
		await authController.resetPassword(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})
})
