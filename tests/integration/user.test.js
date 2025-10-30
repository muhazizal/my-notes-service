const request = require('supertest')
const app = require('../../app')
const sequelize = require('../../config/database')
const { User } = require('../../models')
const { registerVerifyLogin } = require('./helpers/auth')
const { resetUsers } = require('./helpers/db')
const { assertInvalidRequest, collectMessages } = require('./helpers/assert')
const { makeUserPayload } = require('./helpers/factory')

describe('user integration', () => {
	beforeAll(async () => {
		await sequelize.sync({ force: true })
	})

	afterAll(async () => {
		await sequelize.close()
	})

  beforeEach(async () => {
    await resetUsers()
  })

	test('profile: unauthorized when missing cookies', async () => {
		const res = await request(app).get('/api/user/profile')
		expect(res.status).toBe(401)
		expect(res.body.message).toBe('Unauthorized')
	})

  test('profile: success with valid session, then 422 when user missing', async () => {
    const agent = request.agent(app)
    const { email, password, username, fullname } = makeUserPayload('userp', { email: 'userp@example.com', fullname: 'User P' })
    await registerVerifyLogin(agent, { email, password, username, fullname })

		// Success profile fetch
		const prof = await agent.get('/api/user/profile')
		expect(prof.status).toBe(200)
		expect(prof.body.message).toBe('Success get profile')
    expect(prof.body.data).toMatchObject({ username, email, fullname })

		// Delete user directly -> next profile returns 422
		const user = await User.findOne({ where: { email } })
		await User.destroy({ where: { id: user.id } })
		const profMissing = await agent.get('/api/user/profile')
		expect(profMissing.status).toBe(422)
		expect(profMissing.body.success).toBe(false)
		expect(profMissing.body.message).toBe('Invalid Credentials')
	})

  test('update profile: invalid payload -> 422 with validation messages', async () => {
    const agent = request.agent(app)
    const { email, password, username, fullname } = makeUserPayload('invuser', { email: 'inv@example.com', fullname: 'Inv User' })
    await registerVerifyLogin(agent, { email, password, username, fullname })

    const upd = await agent.put('/api/user/profile').send({})
    assertInvalidRequest(upd)
    const msgs = collectMessages(upd)
    expect(msgs).toEqual(
      expect.arrayContaining(['Username is required', 'Email is required.', 'Fullname is required'])
    )
  })

  test('update profile: success unchanged email and success changed email toggles isVerified', async () => {
    const agent = request.agent(app)
    const { email, password, username, fullname } = makeUserPayload('upduser', { email: 'upd@example.com', fullname: 'Upd User' })
    await registerVerifyLogin(agent, { email, password, username, fullname })

		// Unchanged email
		const body1 = { username: 'upduser1', email, fullname: 'Upd User 1' }
		const upd1 = await agent.put('/api/user/profile').send(body1)
		expect(upd1.status).toBe(201)
		expect(upd1.body.message).toBe('Success update profile')
		expect(upd1.body.data).toMatchObject(body1)

		// Changed email -> toggles isVerified false
		const newEmail = 'newupd@example.com'
		const body2 = { username: 'upduser2', email: newEmail, fullname: 'Upd User 2' }
		const upd2 = await agent.put('/api/user/profile').send(body2)
		expect(upd2.status).toBe(201)
		expect(upd2.body.message).toBe('Success update profile, please verify your new email')
		expect(upd2.body.data).toMatchObject(body2)
		const user = await User.findOne({ where: { email: newEmail } })
		expect(user.isVerified).toBe(false)
	})

  test('update profile: fail on duplicate username and duplicate email', async () => {
    const agent = request.agent(app)
    const { email, password, username, fullname } = makeUserPayload('dupeorigin', { email: 'dupeorigin@example.com', fullname: 'Dupe Origin' })
    await registerVerifyLogin(agent, { email, password, username, fullname })

		// Create another user directly (different id)
    const dupeUser = makeUserPayload('dupeuser', { email: 'dupe@example.com', password: 'x', fullname: 'Dupe Target' })
    await User.create({ ...dupeUser, isVerified: true })

		// Duplicate username
		const dupUsername = await agent
			.put('/api/user/profile')
			.send({ username: 'dupeuser', email: 'unique1@example.com', fullname: 'X' })
		expect(dupUsername.status).toBe(422)
		expect(dupUsername.body.message).toBe('Username is already exist')

		// Duplicate email
		const dupEmail = await agent
			.put('/api/user/profile')
			.send({ username: 'uniqueuser123', email: 'dupe@example.com', fullname: 'Y' })
		expect(dupEmail.status).toBe(422)
		expect(dupEmail.body.message).toBe('Email is already exist')
	})

  test('delete account: 422 when user missing; success clears cookies and blocks further access', async () => {
    const agent = request.agent(app)
    const { email, password, username, fullname } = makeUserPayload('deluser', { email: 'del@example.com', fullname: 'Del User' })
    await registerVerifyLogin(agent, { email, password, username, fullname })

		// 422 when missing
		const u = await User.findOne({ where: { email } })
		await User.destroy({ where: { id: u.id } })
		const delMissing = await agent.delete('/api/user')
		expect(delMissing.status).toBe(422)
		expect(delMissing.body.message).toBe('Invalid Credentials')

		// Re-register and delete successfully
		const agent2 = request.agent(app)
    const p2 = makeUserPayload('deluser2', { email: 'del2@example.com', fullname: 'Del User2', password })
    await registerVerifyLogin(agent2, p2)
		const delOk = await agent2.delete('/api/user')
		expect(delOk.status).toBe(200)
		expect(delOk.body.message).toBe('Success delete account')
		const setCookie = delOk.headers['set-cookie'] || []
		const cookieStr = setCookie.join(';')
		expect(cookieStr).toContain('access_token=')
		expect(cookieStr).toContain('refresh_token=')

		// Block further access
		const afterDel = await agent2.get('/api/user/profile')
		expect(afterDel.status).toBe(401)
		expect(afterDel.body.message).toBe('Unauthorized')
	})
})
