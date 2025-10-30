const { validationResult } = require('express-validator')

const { editProfileSchema } = require('../../../schema/user')

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

describe('user schema validation (editProfileSchema)', () => {
  test('rejects missing username with proper message', async () => {
    const req = { body: { email: 'user@example.com', fullname: 'John Doe' } }
    await runMiddlewares(editProfileSchema, req)
    const result = validationResult(req)
    expect(result.isEmpty()).toBe(false)
    const msgs = result.array().map((e) => e.msg)
    expect(msgs).toContain('Username is required')
  })

  test('rejects non-alphanumeric username', async () => {
    const req = { body: { username: 'abc-123', email: 'user@example.com', fullname: 'John Doe' } }
    await runMiddlewares(editProfileSchema, req)
    const result = validationResult(req)
    const msgs = result.array().map((e) => e.msg)
    expect(msgs).toContain('Username must be valid alphanumeric')
  })

  test('rejects too-short username', async () => {
    const req = { body: { username: 'ab', email: 'user@example.com', fullname: 'John Doe' } }
    await runMiddlewares(editProfileSchema, req)
    const result = validationResult(req)
    const msgs = result.array().map((e) => e.msg)
    expect(msgs).toContain('Username must be at least 3 characters long')
  })

  test('rejects missing email and invalid email format', async () => {
    const missingEmailReq = { body: { username: 'user123', fullname: 'John Doe' } }
    await runMiddlewares(editProfileSchema, missingEmailReq)
    let result = validationResult(missingEmailReq)
    let msgs = result.array().map((e) => e.msg)
    expect(msgs).toContain('Email is required.')

    const invalidEmailReq = { body: { username: 'user123', email: 'not-email', fullname: 'John Doe' } }
    await runMiddlewares(editProfileSchema, invalidEmailReq)
    result = validationResult(invalidEmailReq)
    msgs = result.array().map((e) => e.msg)
    expect(msgs).toContain('Email is not valid')
  })

  test('rejects missing fullname', async () => {
    const req = { body: { username: 'user123', email: 'user@example.com' } }
    await runMiddlewares(editProfileSchema, req)
    const result = validationResult(req)
    const msgs = result.array().map((e) => e.msg)
    expect(msgs).toContain('Fullname is required')
  })

  test('accepts valid payload', async () => {
    const req = { body: { username: 'user123', email: 'user@example.com', fullname: 'John Doe' } }
    await runMiddlewares(editProfileSchema, req)
    const result = validationResult(req)
    expect(result.isEmpty()).toBe(true)
  })
})

