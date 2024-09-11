const User = require('./user')()
const Note = require('./note')()

User.associate({ Note })
Note.associate({ User })

module.exports = {
	User,
	Note,
}
