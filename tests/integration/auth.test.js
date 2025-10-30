const request = require('supertest')
const app = require('../../app')
const sequelize = require('../../config/database')
const { User } = require('../../models')
const { resetUsers } = require('./helpers/db')
const { makeUserPayload } = require('./helpers/factory')

describe('auth integration', () => {
	beforeAll(async () => {
		await sequelize.sync({ force: true })
	})

	afterAll(async () => {
		await sequelize.close()
	})

	beforeEach(async () => {
		await resetUsers()
	})

	test('register -> resend verification -> verify -> login -> logout -> check session', async () => {
		const agent = request.agent(app)
		const p = makeUserPayload('user1', { email: 'user1@example.com', fullname: 'User One' })
		const { email } = p
		const body = p

		// Register
		const reg = await agent.put('/api/auth/register').send(body)
		expect(reg.status).toBe(201)

		// Fetch created user and token
		let user = await User.findOne({ where: { email } })
		expect(user).toBeTruthy()
		expect(user.isVerified).toBe(false)
		const token1 = user.verificationToken
		expect(token1).toBeTruthy()

		// Resend verification (changes token)
		const resend = await agent.post('/api/auth/resend-verification').send({ token: token1 })
		expect(resend.status).toBe(200)
		user = await User.findOne({ where: { email } })
		expect(user.verificationToken).toBeTruthy()
		expect(user.verificationToken).not.toEqual(token1)
		const token2 = user.verificationToken

		// Verify
		const ver = await agent.get(`/api/auth/verify/${token2}`)
		expect(ver.status).toBe(200)
		user = await User.findOne({ where: { email } })
		expect(user.isVerified).toBe(true)
		expect(user.verificationToken).toBeNull()
		expect(user.verificationTokenExpires).toBeNull()

		// Login
		const login = await agent.post('/api/auth/login').send({ email, password: body.password })
		expect(login.status).toBe(200)
		const setCookie = login.headers['set-cookie'] || []
		expect(setCookie.join(';')).toContain('access_token=')
		expect(setCookie.join(';')).toContain('refresh_token=')

		// Check auth session (requires auth middleware)
		const session = await agent.get('/api/auth/check-auth-session')
		expect(session.status).toBe(200)
		expect(session.body && typeof session.body).toBe('object')

		// Logout
		const logout = await agent.post('/api/auth/logout')
		expect(logout.status).toBe(200)
	})

	test('forgot-password -> reset-password -> login with new password', async () => {
		const agent = request.agent(app)
		const body = makeUserPayload('resetuser', {
			email: 'reset@example.com',
			password: 'OldPass1!',
			fullname: 'Reset User',
		})
		const { email } = body

		// Register and verify directly via DB for brevity
		await agent.put('/api/auth/register').send(body)
		let user = await User.findOne({ where: { email } })
		user.isVerified = true
		user.verificationToken = null
		user.verificationTokenExpires = null
		await user.save()

		// Forgot password
		const forgot = await agent.post('/api/auth/forgot-password').send({ email })
		expect(forgot.status).toBe(200)
		user = await User.findOne({ where: { email } })
		expect(user.resetPasswordToken).toBeTruthy()
		const resetToken = user.resetPasswordToken

		// Reset password
		const newPassword = 'NewPass2!'
		const reset = await agent
			.post(`/api/auth/reset-password/${resetToken}`)
			.send({ password: newPassword })
		expect(reset.status).toBe(200)

		// Login with new password
		const login = await agent.post('/api/auth/login').send({ email, password: newPassword })
		expect(login.status).toBe(200)
	})
})
