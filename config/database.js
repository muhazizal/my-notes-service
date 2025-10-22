const Sequelize = require('sequelize')
const config = require('./config')[process.env.NODE_ENV]

const isProd = process.env.NODE_ENV === 'production'
const isPooler = config.host && (config.host.includes('pooler.supabase.com') || config.port == 6543)

const dialectOptions = isPooler
	? {} // Session pooler uses port 6543, NO SSL required
	: {
			ssl: {
				require: true,
				rejectUnauthorized: false, // required for Supabase direct connection
			},
	  }

const sequelize = isProd
	? new Sequelize(config.url, {
			dialect: config.dialect,
			dialectOptions,
			logging: false,
			poolMode: config.poolMode,
			pool: {
				max: 5,
				min: 0,
				acquire: 10000,
				idle: 10000,
			},
	  })
	: new Sequelize(config.database, config.username, config.password, {
			dialect: config.dialect,
			host: config.host,
			port: config.port,
			dialectOptions,
			logging: false,
			poolMode: config.poolMode,
	  })

module.exports = sequelize
