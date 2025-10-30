const { validationResult } = require('express-validator')

const { createNoteSchema } = require('../../../schema/note')

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

describe('note schema validation', () => {
	test('createNoteSchema rejects missing fields', async () => {
		const req = { body: {} }
		await runMiddlewares(createNoteSchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(false)
		const messages = result.array().map((e) => e.msg)
		expect(messages).toEqual(expect.arrayContaining(['Title is empty', 'Description is empty']))
	})

	test('createNoteSchema accepts valid payload', async () => {
		const req = { body: { title: 'Note title', description: 'Some description' } }
		await runMiddlewares(createNoteSchema, req)
		const result = validationResult(req)
		expect(result.isEmpty()).toBe(true)
	})
})
