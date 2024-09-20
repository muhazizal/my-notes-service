const crypto = require('crypto')

exports.generateToken = () => {
	const token = crypto.randomBytes(32).toString('hex')
	const tokenExpires = Date.now() + 10 * 60 * 1000 // 10 min

	return { token, tokenExpires }
}
