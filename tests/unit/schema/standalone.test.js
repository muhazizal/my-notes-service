const { checkSchema, validationResult } = require('express-validator')

const {
	usernameSchema,
	emailSchema,
	passwordSchema,
	fullnameSchema,
	tokenSchema,
} = require('../../../schema/standalone')

const runMiddlewares = async (middlewares, req) => {
	const res = {}
	for (const mw of middlewares) {
		await new Promise((resolve, reject) => {
			try {
				const maybe = mw(req, res, (err) => (err ? reject(err) : resolve()))
				if (maybe && typeof maybe.then === 'function') maybe.then(resolve).catch(reject)
			} catch (e) {
				reject(e)
			}
		})
	}
}

describe('standalone schema validators', () => {
	test('usernameSchema validations: required, alphanumeric, min length', async () => {
		const schema = checkSchema({ username: usernameSchema }, ['body'])

		const missingReq = { body: {} }
		await runMiddlewares(schema, missingReq)
		let res1 = validationResult(missingReq)
		expect(res1.isEmpty()).toBe(false)
		expect(res1.array().map((e) => e.msg)).toContain('Username is required')

		const nonAlnumReq = { body: { username: 'abc-123' } }
		await runMiddlewares(schema, nonAlnumReq)
		let res2 = validationResult(nonAlnumReq)
		expect(res2.array().map((e) => e.msg)).toContain('Username must be valid alphanumeric')

		const shortReq = { body: { username: 'ab' } }
		await runMiddlewares(schema, shortReq)
		let res3 = validationResult(shortReq)
		expect(res3.array().map((e) => e.msg)).toContain('Username must be at least 3 characters long')
	})

	test('emailSchema validations: required and format', async () => {
		const schema = checkSchema({ email: emailSchema }, ['body'])

		const missingReq = { body: {} }
		await runMiddlewares(schema, missingReq)
		let res1 = validationResult(missingReq)
		expect(res1.isEmpty()).toBe(false)
		expect(res1.array().map((e) => e.msg)).toContain('Email is required.')

		const badReq = { body: { email: 'not-email' } }
		await runMiddlewares(schema, badReq)
		const res2 = validationResult(badReq)
		expect(res2.array().map((e) => e.msg)).toContain('Email is not valid')
	})

	test('passwordSchema validations: required, min length, and trimming', async () => {
		const schema = checkSchema({ password: passwordSchema }, ['body'])

		const missingReq = { body: {} }
		await runMiddlewares(schema, missingReq)
		let res1 = validationResult(missingReq)
		expect(res1.isEmpty()).toBe(false)
		expect(res1.array().map((e) => e.msg)).toContain('Password is required')

		const shortReq = { body: { password: ' 123 ' } } // trims to '123'
		await runMiddlewares(schema, shortReq)
		const res2 = validationResult(shortReq)
		expect(res2.array().map((e) => e.msg)).toContain('Password must be at least 5 characters long')

		const okReq = { body: { password: '   12345   ' } } // trims to '12345'
		await runMiddlewares(schema, okReq)
		const res3 = validationResult(okReq)
		expect(res3.isEmpty()).toBe(true)
	})

	test('fullnameSchema validation: required', async () => {
		const schema = checkSchema({ fullname: fullnameSchema }, ['body'])
		const req = { body: {} }
		await runMiddlewares(schema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(false)
		expect(result.array().map((e) => e.msg)).toContain('Fullname is required')
	})

	test('tokenSchema validations: exists, length, and hex pattern', async () => {
		const schema = checkSchema({ token: tokenSchema }, ['body'])

		const missingReq = { body: {} }
		await runMiddlewares(schema, missingReq)
		let res1 = validationResult(missingReq)
		expect(res1.isEmpty()).toBe(false)
		expect(res1.array().map((e) => e.msg)).toContain('Token is required')

		const shortReq = { body: { token: 'a'.repeat(63) } }
		await runMiddlewares(schema, shortReq)
		const res2 = validationResult(shortReq)
		expect(res2.array().map((e) => e.msg)).toContain('Token must be 64 characters long')

		const nonHexReq = { body: { token: 'g'.repeat(64) } }
		await runMiddlewares(schema, nonHexReq)
		const res3 = validationResult(nonHexReq)
		expect(res3.array().map((e) => e.msg)).toContain('Token must be a valid hex string')

		const okReq = { body: { token: 'a'.repeat(64) } }
		await runMiddlewares(schema, okReq)
		const res4 = validationResult(okReq)
		expect(res4.isEmpty()).toBe(true)
	})
})
