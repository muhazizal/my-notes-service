const request = require('supertest')
const app = require('../../app')
const sequelize = require('../../config/database')
const { User, Note } = require('../../models')
const { registerVerifyLogin } = require('./helpers/auth')
const { resetUsers, resetNotes } = require('./helpers/db')
const { assertInvalidRequest, collectMessages } = require('./helpers/assert')
const { makeUserPayload } = require('./helpers/factory')

describe('note integration', () => {
	beforeAll(async () => {
		await sequelize.sync({ force: true })
	})

	afterAll(async () => {
		await sequelize.close()
	})

	beforeEach(async () => {
		await resetNotes()
		await resetUsers()
	})

	test('end-to-end: list -> create (invalid/valid) -> get -> update (invalid/valid) -> delete (invalid/valid)', async () => {
		const agent = request.agent(app)

		// Auth: register, verify, login
		const { email, password, username, fullname } = makeUserPayload('noteuser', {
			email: 'noteuser@example.com',
			fullname: 'Note User',
		})
		await registerVerifyLogin(agent, { email, password, username, fullname })

		// List notes: empty initially
		const listEmpty = await agent.get('/api/notes')
		expect(listEmpty.status).toBe(200)
		expect(Array.isArray(listEmpty.body.data)).toBe(true)
		expect(listEmpty.body.data.length).toBe(0)
		expect(listEmpty.body.message).toBe('Success get notes')

		// Create: invalid (missing title & description)
		const createInvalid = await agent.post('/api/notes').send({})
		assertInvalidRequest(createInvalid)
		const msgs = collectMessages(createInvalid, { sort: true })
		expect(msgs).toEqual(['Description is empty', 'Title is empty'])

		// Create: valid, HTML sanitized and raw preserved
		const payload1 = {
			title: 'First',
			description: '<script>alert(1)</script><span style="color:red"><b>Hello</b></span>',
		}
		const createValid = await agent.post('/api/notes').send(payload1)
		expect(createValid.status).toBe(201)
		expect(createValid.body.message).toBe('Success create note')
		const created = createValid.body.data
		expect(created).toBeTruthy()
		expect(created.title).toBe('First')
		expect(created.raw_description).toBe(payload1.description)
		expect(typeof created.description).toBe('string')
		expect(created.description).not.toContain('<script>')
		expect(created.description).toContain('<span')
		expect(created.description).toContain('<b>')

		// List notes: one item
		const listOne = await agent.get('/api/notes')
		expect(listOne.status).toBe(200)
		expect(listOne.body.data.length).toBe(1)
		expect(listOne.body.data[0].id).toBe(created.id)

		// Get by id: found
		const getFound = await agent.get(`/api/notes/${created.id}`)
		expect(getFound.status).toBe(200)
		expect(getFound.body.message).toBe('Success get note')
		expect(getFound.body.data.id).toBe(created.id)

		// Update: invalid (missing title & description)
		const updateInvalid = await agent.put(`/api/notes/${created.id}`).send({})
		assertInvalidRequest(updateInvalid)
		const msgsUpd = collectMessages(updateInvalid, { sort: true })
		expect(msgsUpd).toEqual(['Description is empty', 'Title is empty'])

		// Update: valid, HTML sanitized
		const payloadUpdate = {
			title: 'First (updated)',
			description: '<p onclick="x">Updated <i>content</i></p><script>bad()</script>',
		}
		const updateValid = await agent.put(`/api/notes/${created.id}`).send(payloadUpdate)
		expect(updateValid.status).toBe(201)
		expect(updateValid.body.message).toBe('Success update note')
		const updated = updateValid.body.data
		expect(updated.title).toBe('First (updated)')
		expect(updated.raw_description).toBe(payloadUpdate.description)
		expect(updated.description).toContain('<p>')
		expect(updated.description).toContain('<i>')
		expect(updated.description).not.toContain('<script>')

		// Get by id: not found (different id)
		const getNotFound = await agent.get('/api/notes/999999')
		expect(getNotFound.status).toBe(404)
		expect(getNotFound.body.success).toBe(false)
		expect(getNotFound.body.message).toBe('Note is not found')

		// Delete: not found (different id)
		const delNotFound = await agent.delete('/api/notes/999999')
		expect(delNotFound.status).toBe(404)
		expect(delNotFound.body.success).toBe(false)
		expect(delNotFound.body.message).toBe('Note is not found')

		// Delete: valid
		const delValid = await agent.delete(`/api/notes/${created.id}`)
		expect(delValid.status).toBe(200)
		expect(delValid.body.message).toBe('Success delete note')

		// Get by id after delete: 404
		const getAfterDel = await agent.get(`/api/notes/${created.id}`)
		expect(getAfterDel.status).toBe(404)
		expect(getAfterDel.body.message).toBe('Note is not found')

		// List notes: back to empty
		const listBackEmpty = await agent.get('/api/notes')
		expect(listBackEmpty.status).toBe(200)
		expect(listBackEmpty.body.data.length).toBe(0)
	})
})
