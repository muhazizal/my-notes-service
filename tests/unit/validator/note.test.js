describe('validator/note', () => {
	test('validateRequest throws with status 422 and data when errors exist', () => {
		jest.resetModules()
		jest.doMock('express-validator', () => ({
			validationResult: () => ({ isEmpty: () => false, array: () => [{ msg: 'bad' }] }),
		}))

		const { validateRequest } = require('../../../validator/note')
		const req = {}
		expect(() => validateRequest(req)).toThrowError('Invalid request')
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

		const { validateRequest } = require('../../../validator/note')
		const req = {}
		expect(() => validateRequest(req)).not.toThrow()
	})

	test('validateNoteExist throws 404 when note is missing; passes when present', () => {
		jest.resetModules()
		jest.dontMock('express-validator')
		const { validateNoteExist } = require('../../../validator/note')
		expect(() => validateNoteExist(null)).toThrow('Note is not found')
		try {
			validateNoteExist(null)
		} catch (e) {
			expect(e.statusCode).toBe(404)
		}
		expect(() => validateNoteExist({ id: 1 })).not.toThrow()
	})
})
