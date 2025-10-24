// utils/session.js
const jwt = require('jsonwebtoken')

const createAccessToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

const createRefreshToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' })
}

const setAuthCookies = (res, accessToken, refreshToken) => {
	res.cookie('access_token', accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
		path: '/',
	})
	res.cookie('refresh_token', refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
		path: '/',
	})
}

const destroyAuthCookies = (res) => {
	res.clearCookie('access_token', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
		path: '/',
	})
	res.clearCookie('refresh_token', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
		path: '/',
	})
}

const storeAuthSession = async (res, accessToken, refreshToken) => {
	// No DB writes; just set cookies
	setAuthCookies(res, accessToken, refreshToken)
}

const destroyAuthSession = async (res) => {
	// No DB deletes; just clear cookies
	destroyAuthCookies(res)
}

module.exports = {
	createAccessToken,
	createRefreshToken,
	setAuthCookies,
	destroyAuthCookies,
	storeAuthSession,
	destroyAuthSession,
}
