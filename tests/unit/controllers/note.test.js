jest.mock('../../../models/index', () => {
	const Note = {
		sequelize: { transaction: jest.fn(async (fn) => fn({})) },
		findAll: jest.fn(),
		findOne: jest.fn(),
		create: jest.fn(),
	}
	const User = {}
	return { Note, User }
})

jest.mock('../../../utils/cache', () => ({
	getJSON: jest.fn(),
	setJSON: jest.fn().mockResolvedValue(null),
	del: jest.fn().mockResolvedValue(null),
	delMany: jest.fn().mockResolvedValue(null),
}))

jest.mock('../../../utils/sanitize-html', () => ({
	sanitizeTiptapHTML: jest.fn((html) => `SAFE:${html}`),
}))

jest.mock('../../../validator/note', () => ({
	validateRequest: jest.fn(),
	validateNoteExist: jest.fn(),
}))

const { Note } = require('../../../models/index')
const cache = require('../../../utils/cache')
const { sanitizeTiptapHTML } = require('../../../utils/sanitize-html')
const { validateRequest, validateNoteExist } = require('../../../validator/note')
const consola = require('consola')
const noteController = require('../../../controllers/note')

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

describe('controllers/note.js - getNotes', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('returns cached notes when present', async () => {
		const cached = [{ id: 1 }]
		cache.getJSON.mockResolvedValueOnce(cached)
		const req = { userId: 5, method: 'GET', originalUrl: '/api/notes' }
		const res = makeRes()

		await noteController.getNotes(req, res)

		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success get notes', data: cached, code: 200 })
		expect(Note.findAll).not.toHaveBeenCalled()
		expect(cache.setJSON).not.toHaveBeenCalled()
	})

	test('queries DB when cache miss and stores in cache', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		const result = [{ id: 2 }]
		Note.findAll.mockResolvedValueOnce(result)
		const req = { userId: 7, method: 'GET', originalUrl: '/api/notes' }
		const res = makeRes()

		await noteController.getNotes(req, res)

		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success get notes', data: result, code: 200 })
		expect(cache.setJSON).toHaveBeenCalledWith('notes:user:7', result, 60)
	})

	test('catch uses provided statusCode/message/data on error', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		const err = new Error('DB down')
		err.statusCode = 503
		err.data = { retry: true }
		Note.findAll.mockRejectedValueOnce(err)
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 8, method: 'GET', originalUrl: '/api/notes' }
		const res = makeRes()

		await noteController.getNotes(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(503)
		expect(res.body).toEqual({ success: false, message: 'DB down', data: { retry: true } })
	})

	test('catch falls back to 500 and default message/data', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		Note.findAll.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 9, method: 'GET', originalUrl: '/api/notes' }
		const res = makeRes()

		await noteController.getNotes(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})
})

describe('controllers/note.js - createNote', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('creates note, sanitizes HTML, clears list cache', async () => {
		const created = {
			id: 10,
			title: 'T',
			description: 'SAFE:<p>x</p>',
			raw_description: '<p>x</p>',
		}
		Note.create.mockResolvedValueOnce(created)
		const req = {
			userId: 4,
			method: 'POST',
			originalUrl: '/api/notes',
			body: { title: 'T', description: '<p>x</p>' },
		}
		const res = makeRes()

		await noteController.createNote(req, res)

		expect(sanitizeTiptapHTML).toHaveBeenCalledWith('<p>x</p>')
		expect(cache.del).toHaveBeenCalledWith('notes:user:4')
		expect(res.statusCode).toBe(201)
		expect(res.body).toEqual({ message: 'Success create note', data: created, code: 201 })
	})

	test('catch uses provided statusCode/message/data when validateRequest throws', async () => {
		validateRequest.mockImplementationOnce(() => {
			const e = new Error('Bad request')
			e.statusCode = 422
			e.data = { field: 'title' }
			throw e
		})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			userId: 4,
			method: 'POST',
			originalUrl: '/api/notes',
			body: { title: 'T', description: '<p>x</p>' },
		}
		const res = makeRes()

		await noteController.createNote(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(422)
		expect(res.body).toEqual({ success: false, message: 'Bad request', data: { field: 'title' } })
	})

	test('catch falls back to 500 and default message/data when DB throws', async () => {
		Note.create.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			userId: 4,
			method: 'POST',
			originalUrl: '/api/notes',
			body: { title: 'T', description: '<p>x</p>' },
		}
		const res = makeRes()

		await noteController.createNote(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})
})

describe('controllers/note.js - getNoteById', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('returns cached note when present', async () => {
		const cached = { id: 1, title: 'X' }
		cache.getJSON.mockResolvedValueOnce(cached)
		const req = { userId: 3, params: { id: 22 }, method: 'GET', originalUrl: '/api/notes/22' }
		const res = makeRes()

		await noteController.getNoteById(req, res)

		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success get note', data: cached, code: 200 })
		expect(Note.findOne).not.toHaveBeenCalled()
		expect(cache.setJSON).not.toHaveBeenCalled()
	})

	test('queries DB when cache miss, validates, stores in cache', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		const found = { id: 22, title: 'Y', description: 'SAFE', raw_description: 'RAW' }
		Note.findOne.mockResolvedValueOnce(found)
		const req = { userId: 3, params: { id: 22 }, method: 'GET', originalUrl: '/api/notes/22' }
		const res = makeRes()

		await noteController.getNoteById(req, res)

		expect(validateRequest).toHaveBeenCalled()
		expect(validateNoteExist).toHaveBeenCalledWith(found)
		expect(cache.setJSON).toHaveBeenCalledWith('note:user:3:22', found, 60)
		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success get note', data: found, code: 200 })
	})

	test('catch uses provided statusCode/message/data when validateNoteExist throws', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		Note.findOne.mockResolvedValueOnce(null)
		validateNoteExist.mockImplementationOnce(() => {
			const e = new Error('Note not found')
			e.statusCode = 404
			e.data = { id: 22 }
			throw e
		})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 3, params: { id: 22 }, method: 'GET', originalUrl: '/api/notes/22' }
		const res = makeRes()

		await noteController.getNoteById(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(404)
		expect(res.body).toEqual({ success: false, message: 'Note not found', data: { id: 22 } })
	})

	test('catch falls back to 500 and default message/data when DB throws', async () => {
		cache.getJSON.mockResolvedValueOnce(null)
		Note.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 3, params: { id: 22 }, method: 'GET', originalUrl: '/api/notes/22' }
		const res = makeRes()

		await noteController.getNoteById(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})
})

describe('controllers/note.js - updateNote', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('updates note and clears related caches', async () => {
		const note = {
			id: 33,
			title: 'A',
			description: 'SAFE:old',
			raw_description: 'old',
			save: jest
				.fn()
				.mockResolvedValue({ id: 33, title: 'B', description: 'SAFE:new', raw_description: 'new' }),
		}
		Note.findOne.mockResolvedValueOnce(note)
		const req = {
			userId: 11,
			params: { id: 33 },
			method: 'PUT',
			originalUrl: '/api/notes/33',
			body: { title: 'B', description: 'new' },
		}
		const res = makeRes()

		await noteController.updateNote(req, res)

		expect(validateRequest).toHaveBeenCalled()
		expect(validateNoteExist).toHaveBeenCalledWith(note)
		expect(sanitizeTiptapHTML).toHaveBeenCalledWith('new')
		expect(cache.delMany).toHaveBeenCalledWith(['notes:user:11', 'note:user:11:33'])
		expect(res.statusCode).toBe(201)
		expect(res.body.message).toBe('Success update note')
	})

	test('catch uses provided statusCode/message/data when validateNoteExist throws', async () => {
		Note.findOne.mockResolvedValueOnce(null)
		validateNoteExist.mockImplementationOnce(() => {
			const e = new Error('Not exist')
			e.statusCode = 422
			e.data = { id: 33 }
			throw e
		})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			userId: 11,
			params: { id: 33 },
			method: 'PUT',
			originalUrl: '/api/notes/33',
			body: { title: 'B', description: 'new' },
		}
		const res = makeRes()

		await noteController.updateNote(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(422)
		expect(res.body).toEqual({ success: false, message: 'Not exist', data: { id: 33 } })
	})

	test('catch falls back to 500 and default message/data when DB throws', async () => {
		Note.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = {
			userId: 11,
			params: { id: 33 },
			method: 'PUT',
			originalUrl: '/api/notes/33',
			body: { title: 'B', description: 'new' },
		}
		const res = makeRes()

		await noteController.updateNote(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})
})

describe('controllers/note.js - deleteNote', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('deletes note and clears related caches', async () => {
		const note = { id: 44, destroy: jest.fn().mockResolvedValue(true) }
		Note.findOne.mockResolvedValueOnce(note)
		const req = { userId: 12, params: { id: 44 }, method: 'DELETE', originalUrl: '/api/notes/44' }
		const res = makeRes()

		await noteController.deleteNote(req, res)

		expect(validateNoteExist).toHaveBeenCalledWith(note)
		expect(cache.delMany).toHaveBeenCalledWith(['notes:user:12', 'note:user:12:44'])
		expect(res.statusCode).toBe(200)
		expect(res.body).toEqual({ message: 'Success delete note', code: 200 })
	})

	test('catch uses provided statusCode/message/data when validateNoteExist throws', async () => {
		Note.findOne.mockResolvedValueOnce(null)
		validateNoteExist.mockImplementationOnce(() => {
			const e = new Error('Missing')
			e.statusCode = 401
			e.data = { id: 44 }
			throw e
		})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 12, params: { id: 44 }, method: 'DELETE', originalUrl: '/api/notes/44' }
		const res = makeRes()

		await noteController.deleteNote(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(401)
		expect(res.body).toEqual({ success: false, message: 'Missing', data: { id: 44 } })
	})

	test('catch falls back to 500 and default message/data when DB throws', async () => {
		Note.findOne.mockRejectedValueOnce({})
		const errorSpy = jest.spyOn(consola, 'error').mockImplementation(() => {})
		const req = { userId: 12, params: { id: 44 }, method: 'DELETE', originalUrl: '/api/notes/44' }
		const res = makeRes()

		await noteController.deleteNote(req, res)

		expect(errorSpy).toHaveBeenCalled()
		expect(res.statusCode).toBe(500)
		expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
	})
})
