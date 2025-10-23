const { Sequelize } = require('sequelize')
const config = require('./config')

const dialectOptions =
	process.env.NODE_ENV === 'production'
		? {
				ssl: false,
		  }
		: {}

const sequelize = new Sequelize(config.database, config.username, config.password, {
	host: config.host,
	port: config.port,
	dialect: config.dialect,
	dialectOptions,
})

module.exports = sequelize
