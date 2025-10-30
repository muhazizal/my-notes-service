const { User, Note } = require('../../../models')

const resetUsers = async () => {
	await User.destroy({ where: {} })
}

const resetNotes = async () => {
	await Note.destroy({ where: {} })
}

module.exports = { resetUsers, resetNotes }
