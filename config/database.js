const Sequelize = require('sequelize')
const config = require('./config')[process.env.NODE_ENV]

const isProd = process.env.NODE_ENV === 'production'

const sequelize = isProd
	? new Sequelize(config.url, {
			dialect: config.dialect,
	  })
	: new Sequelize(config.database, config.username, config.password, {
			dialect: config.dialect,
			host: config.host,
			port: config.port,
	  })

module.exports = sequelize
