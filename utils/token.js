const crypto = require('crypto')

exports.generateToken = () => {
	const token = crypto.randomBytes(32).toString('hex')
	const tokenExpires = Date.now() + 3600000

	return { token, tokenExpires }
}
