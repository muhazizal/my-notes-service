const { Sequelize } = require('sequelize')
const config = require('./config')

const dialectOptions =
	process.env.NODE_ENV === 'production'
		? {
				ssl: {
					require: true,
					rejectUnauthorized: false,
				},
		  }
		: {}

const sequelize = new Sequelize(config.database, config.username, config.password, {
	host: config.host,
	port: config.port,
	dialect: config.dialect,
	dialectOptions,
})

sequelize
	.authenticate()
	.then(() => console.log('✅ Connection successful'))
	.catch((err) => console.error('❌ Connection failed:', err))

module.exports = sequelize
