const User = require('./user')()
const BlacklistedToken = require('./blacklistedToken')()
const Note = require('./note')()

User.associate({ Note })
Note.associate({ User })

module.exports = {
	User,
	BlacklistedToken,
	Note,
}
