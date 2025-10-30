const { validationResult } = require('express-validator')

const {
	registerSchema,
	loginSchema,
	verifySchema,
	resendVerificationSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} = require('../../../schema/auth')

const runMiddlewares = async (middlewares, req) => {
	const res = {}
	for (const mw of middlewares) {
		await new Promise((resolve, reject) => {
			try {
				const maybePromise = mw(req, res, (err) => (err ? reject(err) : resolve()))
				if (maybePromise && typeof maybePromise.then === 'function') {
					maybePromise.then(resolve).catch(reject)
				}
			} catch (e) {
				reject(e)
			}
		})
	}
}

describe('auth schema validation', () => {
	test('registerSchema rejects missing fields', async () => {
		const req = { body: {} }
		await runMiddlewares(registerSchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(false)
		const messages = result.array().map((e) => e.msg)
		expect(messages).toEqual(
			expect.arrayContaining([
				'Email is required.',
				'Password is required',
				'Username is required',
				'Fullname is required',
			])
		)
	})

	test('registerSchema accepts valid payload', async () => {
		const req = {
			body: {
				email: 'a@b.com',
				password: '12345',
				username: 'user123',
				fullname: 'John Doe',
			},
		}
		await runMiddlewares(registerSchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(true)
	})

	test('loginSchema requires password', async () => {
		const req = { body: { email: 'a@b.com' } }
		await runMiddlewares(loginSchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(false)
		const messages = result.array().map((e) => e.msg)
		expect(messages).toContain('Password is required')
	})

	test('verifySchema enforces 64-char hex token in params', async () => {
		const req = { params: { token: 'abcd' } }
		await runMiddlewares(verifySchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(false)
		const messages = result.array().map((e) => e.msg)
		expect(messages).toContain('Token must be 64 characters long')
	})

	test('resendVerificationSchema rejects non-hex tokens in body', async () => {
		const req = { body: { token: 'z'.repeat(64) } }
		await runMiddlewares(resendVerificationSchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(false)
		const messages = result.array().map((e) => e.msg)
		expect(messages).toContain('Token must be a valid hex string')
	})

	test('forgotPasswordSchema validates email format', async () => {
		const req = { body: { email: 'not-email' } }
		await runMiddlewares(forgotPasswordSchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(false)
		const messages = result.array().map((e) => e.msg)
		expect(messages).toContain('Email is not valid')
	})

	test('resetPasswordSchema enforces password length', async () => {
		const req = { body: { password: '123' } }
		await runMiddlewares(resetPasswordSchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(false)
		const messages = result.array().map((e) => e.msg)
		expect(messages).toContain('Password must be at least 5 characters long')
	})
})
