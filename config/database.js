const Sequelize = require('sequelize')
const fs = require('fs')
const path = require('path')

const config = require('./config')

const caPath = path.resolve(__dirname, './prod-ca-2021.crt')
const caCert = fs.readFileSync(caPath).toString()

const dialectOptions =
	process.env.DB_SSL === 'true'
		? {
				ssl: {
					require: true,
					rejectUnauthorized: false,
					ca: caCert,
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
