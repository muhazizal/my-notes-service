const { User } = require('../../../models')

/**
 * Register, verify, and login to obtain auth cookies for protected routes.
 * Leaves cookies set on the provided supertest agent.
 */
const registerVerifyLogin = async (agent, { email, password, username, fullname }) => {
  const reg = await agent.put('/api/auth/register').send({ email, password, username, fullname })
  expect(reg.status).toBe(201)

  let user = await User.findOne({ where: { email } })
  expect(user).toBeTruthy()
  const token = user.verificationToken
  expect(token).toBeTruthy()

  const ver = await agent.get(`/api/auth/verify/${token}`)
  expect(ver.status).toBe(200)
  user = await User.findOne({ where: { email } })
  expect(user.isVerified).toBe(true)

  const login = await agent.post('/api/auth/login').send({ email, password })
  expect(login.status).toBe(200)
  const setCookie = login.headers['set-cookie'] || []
  expect(setCookie.join(';')).toContain('access_token=')
  expect(setCookie.join(';')).toContain('refresh_token=')
}

module.exports = { registerVerifyLogin }

