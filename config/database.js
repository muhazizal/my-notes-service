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
				keepAlive: true,
		  }
		: {}

let sequelize

if (config.dialect === 'sqlite') {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || ':memory:',
        logging: false,
    })
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        dialectOptions,
        pool: {
            max: Number(process.env.DB_POOL_MAX || 10),
            min: Number(process.env.DB_POOL_MIN || 1),
            acquire: Number(process.env.DB_POOL_ACQUIRE || 10000),
            idle: Number(process.env.DB_POOL_IDLE || 300000),
        },
        logging: false, // optional, to reduce overhead
    })
}

module.exports = sequelize
