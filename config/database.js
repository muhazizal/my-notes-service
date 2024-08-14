const Sequelize = require('sequelize')

const config = require('./config')[process.env.NODE_ENV]

const sequelize = new Sequelize(config.database, config.username, config.password, {
	dialect: config.dialect,
	host: config.host,
})

module.exports = sequelize
