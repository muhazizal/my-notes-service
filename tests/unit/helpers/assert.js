const assertUnauthorizedSimple = (res) => {
	expect(res.statusCode).toBe(401)
	expect(res.body).toEqual({ message: 'Unauthorized' })
}

const assertUnauthorized = (res) => {
	expect(res.statusCode).toBe(401)
	expect(res.body).toEqual({ success: false, message: 'Unauthorized' })
}

const assertJwtError = (res) => {
	expect(res.statusCode).toBe(500)
	expect(res.body).toEqual({ success: false, message: expect.stringMatching(/jwt/i) })
}

const assertInternalServerError = (res) => {
	expect(res.statusCode).toBe(500)
	expect(res.body).toEqual({ success: false, message: 'Internal Server Error' })
}

const assertInternalServerErrorWithDefaultData = (res) => {
	expect(res.statusCode).toBe(500)
	expect(res.body).toEqual({ success: false, message: 'Internal Server Error', data: {} })
}

// Generic helper for error responses with custom status, message, and data
const assertError = (res, statusCode, message, data) => {
	expect(res.statusCode).toBe(statusCode)
	expect(res.body).toEqual({ success: false, message, data })
}

module.exports = {
	assertUnauthorizedSimple,
	assertUnauthorized,
	assertJwtError,
	assertInternalServerError,
	assertInternalServerErrorWithDefaultData,
	assertError,
}
