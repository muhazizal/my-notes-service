const Session = require('./session')()
const User = require('./user')()
const Note = require('./note')()

User.associate({ Note })
Note.associate({ User })

module.exports = {
	Session,
	User,
	Note,
}
