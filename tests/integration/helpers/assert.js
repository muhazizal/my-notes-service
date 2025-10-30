const assertInvalidRequest = (res) => {
	expect(res.status).toBe(422)
	expect(res.body && res.body.success).toBe(false)
	expect(res.body.message).toBe('Invalid request')
}

const assertUnauthorized = (res, message = 'Unauthorized') => {
	expect(res.status).toBe(401)
	expect(res.body.message).toBe(message)
}

const assertInvalidCredentials = (res, message = 'Invalid Credentials') => {
	expect(res.status).toBe(422)
	if (res.body && typeof res.body.success !== 'undefined') {
		expect(res.body.success).toBe(false)
	}
	expect(res.body.message).toBe(message)
}

const assertNotFound = (res, message = 'Note is not found') => {
	expect(res.status).toBe(404)
	if (res.body && typeof res.body.success !== 'undefined') {
		expect(res.body.success).toBe(false)
	}
	expect(res.body.message).toBe(message)
}

const assertUnprocessable = (res, message) => {
	expect(res.status).toBe(422)
	if (res.body && typeof res.body.success !== 'undefined') {
		expect(res.body.success).toBe(false)
	}
	if (message) {
		expect(res.body.message).toBe(message)
	}
}

const collectMessages = (res, { sort = false } = {}) => {
	const msgs = ((res.body && res.body.data) || []).map((e) => e.msg)
	return sort ? msgs.sort() : msgs
}

module.exports = {
	assertInvalidRequest,
	assertUnauthorized,
	assertInvalidCredentials,
	assertNotFound,
	assertUnprocessable,
	collectMessages,
}
