const { Sequelize } = require('sequelize')
const fs = require('fs')
const path = require('path')

const caPath = path.resolve(__dirname, './prod-ca-2021.crt')
const caCert = fs.readFileSync(caPath).toString()

const config = require('./config')

const dialectOptions =
	process.env.NODE_ENV === 'production'
		? {
				ssl: {
					require: true,
					rejectUnauthorized: true,
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

module.exports = sequelize
