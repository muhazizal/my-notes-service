const {
	validateUserExist,
	validateUserNotExist,
	validatePasswordNotMatch,
	validateUserVerified,
	validateUserNotVerified,
	validateVerifyTokenExpired,
} = require('../../validator/auth')

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
