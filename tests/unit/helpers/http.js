const makeRes = () => {
	const res = {}
	res.statusCode = 200
	res.body = null
	res.cookiesSet = []
	res.cookiesCleared = []
	res.cookie = (name, value, options) => {
		res.cookiesSet.push({ name, value, options })
		return res
	}
	res.clearCookie = (name, options) => {
		res.cookiesCleared.push({ name, options })
		return res
	}
	res.status = (code) => {
		res.statusCode = code
		return res
	}
	res.json = (payload) => {
		res.body = payload
		return res
	}
	return res
}
const makeReq = (overrides = {}) => ({
  method: 'GET',
  originalUrl: '/',
  headers: {},
  cookies: {},
  params: {},
  query: {},
  body: {},
  ...overrides,
})

module.exports = { makeRes, makeReq }
