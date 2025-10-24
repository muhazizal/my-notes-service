// utils/session.js
const jwt = require('jsonwebtoken')

const createAccessToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

const createRefreshToken = (userId) => {
	return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' })
}

// Build cookie options suitable for cross-site cookies.
const buildCookieOptions = () => {
	const opts = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
		path: '/',
	}
	return opts
}

const setAuthCookies = (res, accessToken, refreshToken) => {
	const cookieOpts = buildCookieOptions()
	res.cookie('access_token', accessToken, cookieOpts)
	res.cookie('refresh_token', refreshToken, cookieOpts)
}

const destroyAuthCookies = (res) => {
	const cookieOpts = buildCookieOptions()
	res.clearCookie('access_token', cookieOpts)
	res.clearCookie('refresh_token', cookieOpts)
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
