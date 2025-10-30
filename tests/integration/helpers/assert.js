const assertInvalidRequest = (res) => {
  expect(res.status).toBe(422)
  expect(res.body && res.body.success).toBe(false)
  expect(res.body.message).toBe('Invalid request')
}

const collectMessages = (res, { sort = false } = {}) => {
  const msgs = ((res.body && res.body.data) || []).map((e) => e.msg)
  return sort ? msgs.sort() : msgs
}

module.exports = { assertInvalidRequest, collectMessages }

