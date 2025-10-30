const {
	validateUserExist,
	validateUserNotExist,
	validatePasswordNotMatch,
	validateUserVerified,
	validateUserNotVerified,
	validateVerifyTokenExpired,
} = require('../../../validator/auth')

describe('validator/auth unit', () => {
	test('validateUserExist throws when user exists', () => {
		expect(() => validateUserExist({ id: 1 })).toThrow('User already exists')
		try {
			validateUserExist({ id: 1 })
		} catch (e) {
			expect(e.statusCode).toBe(422)
		}
	})

	test('validateUserNotExist throws default 422 when user missing', () => {
		expect(() => validateUserNotExist(null)).toThrow('Invalid Credentials')
		try {
			validateUserNotExist(null)
		} catch (e) {
			expect(e.statusCode).toBe(422)
		}
	})

	test('validateUserNotExist throws custom code when provided', () => {
		try {
			validateUserNotExist(null, 401)
		} catch (e) {
			expect(e.statusCode).toBe(401)
		}
	})

	test('validatePasswordNotMatch throws when false', () => {
		expect(() => validatePasswordNotMatch(false)).toThrow('Invalid Credentials')
		try {
			validatePasswordNotMatch(false)
		} catch (e) {
			expect(e.statusCode).toBe(422)
		}
	})

	test('validateUserVerified throws when already verified', () => {
		expect(() => validateUserVerified(true)).toThrow('User already verified')
		try {
			validateUserVerified(true)
		} catch (e) {
			expect(e.statusCode).toBe(401)
		}
	})

	test('validateUserNotVerified throws when not verified', () => {
		expect(() => validateUserNotVerified(false)).toThrow('User is not verified')
		try {
			validateUserNotVerified(false)
		} catch (e) {
			expect(e.statusCode).toBe(422)
		}
	})

	test('validateVerifyTokenExpired throws when expired', () => {
		const expired = Date.now() - 1000
		expect(() => validateVerifyTokenExpired(expired)).toThrow('Token Expired')
		try {
			validateVerifyTokenExpired(expired)
		} catch (e) {
			expect(e.statusCode).toBe(422)
		}
	})

	test('validateVerifyTokenExpired does not throw when valid', () => {
		const future = Date.now() + 60_000
		expect(() => validateVerifyTokenExpired(future)).not.toThrow()
	})
})

// Additional branches and validateRequest behavior
describe('validator/auth (extra branches)', () => {
	const mod = () => require('../../../validator/auth')

	test('validateUsernameExist throws when username matches payload', () => {
		const { validateUsernameExist } = mod()
		expect(() => validateUsernameExist('john', 'john')).toThrow('Username is already exist')
		try {
			validateUsernameExist('john', 'john')
		} catch (e) {
			expect(e.statusCode).toBe(422)
		}
	})

	test('validateEmailExist throws when email matches payload', () => {
		const { validateEmailExist } = mod()
		expect(() => validateEmailExist('a@example.com', 'a@example.com')).toThrow(
			'Email is already exist'
		)
		try {
			validateEmailExist('a@example.com', 'a@example.com')
		} catch (e) {
			expect(e.statusCode).toBe(422)
		}
	})

	test('validateUsernameExist and validateEmailExist pass when not equal', () => {
		const { validateUsernameExist, validateEmailExist } = mod()
		expect(() => validateUsernameExist('john', 'doe')).not.toThrow()
		expect(() => validateEmailExist('x@example.com', 'y@example.com')).not.toThrow()
	})

	test('validateRequest throws with 422 and data when errors exist', () => {
		jest.resetModules()
		jest.doMock('express-validator', () => ({
			validationResult: () => ({ isEmpty: () => false, array: () => [{ msg: 'bad' }] }),
		}))
		const { validateRequest } = require('../../../validator/auth')
		const req = {}
		expect(() => validateRequest(req)).toThrow('Invalid request')
		try {
			validateRequest(req)
		} catch (e) {
			expect(e.statusCode).toBe(422)
			expect(e.data).toEqual([{ msg: 'bad' }])
		}
	})

	test('validateRequest passes when no errors', () => {
		jest.resetModules()
		jest.doMock('express-validator', () => ({
			validationResult: () => ({ isEmpty: () => true, array: () => [] }),
		}))
		const { validateRequest } = require('../../../validator/auth')
		const req = {}
		expect(() => validateRequest(req)).not.toThrow()
	})

	test('pass branches for user validators do not throw', () => {
		const {
			validateUserExist,
			validateUserNotExist,
			validatePasswordNotMatch,
			validateUserVerified,
			validateUserNotVerified,
		} = require('../../../validator/auth')
		expect(() => validateUserExist(null)).not.toThrow()
		expect(() => validateUserNotExist({ id: 1 })).not.toThrow()
		expect(() => validatePasswordNotMatch(true)).not.toThrow()
		expect(() => validateUserVerified(false)).not.toThrow()
		expect(() => validateUserNotVerified(true)).not.toThrow()
	})
})
