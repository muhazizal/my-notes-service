jest.mock('../../../models/index', () => {
	const User = {
		sequelize: { transaction: jest.fn(async (fn) => fn({})) },
		findByPk: jest.fn(),
		findOne: jest.fn(),
	}
	return { User }
})

jest.mock('../../../utils/session', () => ({
	destroyAuthSession: jest.fn().mockResolvedValue(),
}))

jest.mock('../../../validator/auth', () => ({
	validateUserNotExist: jest.fn(),
	validateRequest: jest.fn(),
	validateUsernameExist: jest.fn(),
	validateEmailExist: jest.fn(),
}))

jest.mock('../../../utils/cache', () => ({
	getJSON: jest.fn(),
	setJSON: jest.fn().mockResolvedValue(null),
	del: jest.fn().mockResolvedValue(null),
	delMany: jest.fn().mockResolvedValue(null),
}))

const { User } = require('../../../models/index')
const { destroyAuthSession } = require('../../../utils/session')
const {
	validateUserNotExist,
	validateRequest,
	validateUsernameExist,
	validateEmailExist,
} = require('../../../validator/auth')
const cache = require('../../../utils/cache')
const consola = require('consola')
const userController = require('../../../controllers/user')

const makeRes = () => {
	const res = {}
	res.statusCode = 200
	res.body = null
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

describe('controllers/user.js - getProfile', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('returns cached profile when present', async () => {
		const cached = { username: 'u', email: 'e', fullname: 'f', isVerified: true }
		cache.getJSON.mockResolvedValueOnce(cached)
		const req = { userId: 1, method: 'GET', originalUrl: '/api/user/profile' }
		const res = makeRes()
		await userController.getProfile(req, res)
		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success get profile', data: cached, code: 200 })
		expect(User.findByPk).not.toHaveBeenCalled()
		expect(cache.setJSON).not.toHaveBeenCalled()
	})

	test('queries DB when cache miss and caches result', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		const result = { username: 'u2', email: 'e2', fullname: 'f2', isVerified: false }
		User.findByPk.mockResolvedValueOnce(result)
		const req = { userId: 2, method: 'GET', originalUrl: '/api/user/profile' }
		const res = makeRes()
		await userController.getProfile(req, res)
		expect(validateUserNotExist).toHaveBeenCalledWith(result)
		expect(cache.setJSON).toHaveBeenCalledWith('profile:user:2', result, 120)
		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success get profile', data: result, code: 200 })
	})

	test('catch uses provided statusCode/message/data', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		const err = new Error('boom')
		err.statusCode = 503
		err.data = { x: 1 }
		User.findByPk.mockRejectedValueOnce(err)
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 3, method: 'GET', originalUrl: '/api/user/profile' }
		const res = makeRes()
		await userController.getProfile(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(503)
		expect(res.body).toEqual({ success: false, message: 'boom', data: { x: 1 } })
	})

	test('catch falls back to defaults when error lacks fields', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		User.findByPk.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 4, method: 'GET', originalUrl: '/api/user/profile' }
		const res = makeRes()
		await userController.getProfile(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})
})

describe('controllers/user.js - updateProfile', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('updates without email change and clears cache', async () => {
		User.findOne.mockResolvedValueOnce(null)
		const user = {
			id: 5,
			username: 'old',
			email: 'same@example.com',
			fullname: 'Old',
			isVerified: true,
			save: jest.fn().mockResolvedValue(),
		}
		User.findByPk.mockResolvedValueOnce(user)
		const req = {
			userId: 5,
			method: 'PUT',
			originalUrl: '/api/user/profile',
			body: { username: 'new', email: 'same@example.com', fullname: 'New' },
		}
		const res = makeRes()
		await userController.updateProfile(req, res)
		expect(validateRequest).toHaveBeenCalled()
		expect(validateUserNotExist).toHaveBeenCalledWith(user)
		expect(user.isVerified).toBe(true)
		expect(user.username).toBe('new')
		expect(user.email).toBe('same@example.com')
		expect(user.fullname).toBe('New')
		expect(cache.del).toHaveBeenCalledWith('profile:user:5')
		expect(res.statusCode).toBe(201)
		expect(res.body.message).toBe('Success update profile')
		expect(res.body.data).toEqual({ username: 'new', email: 'same@example.com', fullname: 'New' })
	})

	test('updates with email change sets isVerified=false and message', async () => {
		User.findOne.mockResolvedValueOnce(null)
		const user = {
			id: 6,
			username: 'old',
			email: 'old@example.com',
			fullname: 'Old',
			isVerified: true,
			save: jest.fn().mockResolvedValue(),
		}
		User.findByPk.mockResolvedValueOnce(user)
		const req = {
			userId: 6,
			method: 'PUT',
			originalUrl: '/api/user/profile',
			body: { username: 'new', email: 'new@example.com', fullname: 'New' },
		}
		const res = makeRes()
		await userController.updateProfile(req, res)
		expect(user.isVerified).toBe(false)
		expect(cache.del).toHaveBeenCalledWith('profile:user:6')
		expect(res.statusCode).toBe(201)
		expect(res.body.message).toBe('Success update profile, please verify your new email')
		expect(res.body.data).toEqual({ username: 'new', email: 'new@example.com', fullname: 'New' })
	})

	test('existingUser triggers username/email validators', async () => {
		User.findOne.mockResolvedValueOnce({ username: 'taken', email: 'taken@example.com' })
		const user = {
			id: 7,
			username: 'old',
			email: 'old@example.com',
			fullname: 'Old',
			isVerified: true,
			save: jest.fn().mockResolvedValue(),
		}
		User.findByPk.mockResolvedValueOnce(user)
		const req = {
			userId: 7,
			method: 'PUT',
			originalUrl: '/api/user/profile',
			body: { username: 'new', email: 'new@example.com', fullname: 'New' },
		}
		const res = makeRes()
		await userController.updateProfile(req, res)
		expect(validateUsernameExist).toHaveBeenCalledWith('taken', 'new')
		expect(validateEmailExist).toHaveBeenCalledWith('taken@example.com', 'new@example.com')
		expect(res.statusCode).toBe(201)
	})

	test('catch uses provided statusCode/message/data when validateRequest throws', async () => {
		validateRequest.mockImplementationOnce(() => {
			const e = new Error('bad')
			e.statusCode = 422
			e.data = { f: 'x' }
			throw e
		})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			userId: 8,
			method: 'PUT',
			originalUrl: '/api/user/profile',
			body: { username: 'n', email: 'e', fullname: 'f' },
		}
		const res = makeRes()
		await userController.updateProfile(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(422)
		expect(res.body).toEqual({ success: false, message: 'bad', data: { f: 'x' } })
	})

	test('catch falls back to defaults when DB throws', async () => {
		User.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			userId: 9,
			method: 'PUT',
			originalUrl: '/api/user/profile',
			body: { username: 'n', email: 'e', fullname: 'f' },
		}
		const res = makeRes()
		await userController.updateProfile(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})

	test('validators throw propagate to catch with provided fields', async () => {
		User.findOne.mockResolvedValueOnce({ username: 'taken', email: 'taken@example.com' })
		validateUsernameExist.mockImplementationOnce(() => {
			const e = new Error('username taken')
			e.statusCode = 409
			e.data = { field: 'username' }
			throw e
		})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			userId: 10,
			method: 'PUT',
			originalUrl: '/api/user/profile',
			body: { username: 'new', email: 'old@example.com', fullname: 'New' },
		}
		const res = makeRes()
		await userController.updateProfile(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(409)
		expect(res.body).toEqual({
			success: false,
			message: 'username taken',
			data: { field: 'username' },
		})
	})
})

describe('controllers/user.js - deleteAccount', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('deletes account, destroys session, clears caches', async () => {
		const user = { id: 12, destroy: jest.fn().mockResolvedValue() }
		User.findByPk.mockResolvedValueOnce(user)
		const req = { userId: 12, method: 'DELETE', originalUrl: '/api/user' }
		const res = makeRes()
		await userController.deleteAccount(req, res)
		expect(validateUserNotExist).toHaveBeenCalledWith(user)
		expect(user.destroy).toHaveBeenCalled()
		expect(destroyAuthSession).toHaveBeenCalledWith(res)
		expect(cache.delMany).toHaveBeenCalledWith(['profile:user:12', 'notes:user:12'])
		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success delete account', code: 200 })
	})

	test('catch uses provided statusCode/message/data when destroyAuthSession throws', async () => {
		const user = { id: 13, destroy: jest.fn().mockResolvedValue() }
		User.findByPk.mockResolvedValueOnce(user)
		const err = new Error('session fail')
		err.statusCode = 502
		err.data = { s: true }
		destroyAuthSession.mockRejectedValueOnce(err)
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 13, method: 'DELETE', originalUrl: '/api/user' }
		const res = makeRes()
		await userController.deleteAccount(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(502)
		expect(res.body).toEqual({ success: false, message: 'session fail', data: { s: true } })
	})

	test('catch falls back to defaults when findByPk throws', async () => {
		User.findByPk.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 14, method: 'DELETE', originalUrl: '/api/user' }
		const res = makeRes()
		await userController.deleteAccount(req, res)
		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})
})
