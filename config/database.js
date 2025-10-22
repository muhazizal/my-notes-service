const Sequelize = require('sequelize')
const config = require('./config')[process.env.NODE_ENV]

const isProd = process.env.NODE_ENV === 'production'
const isPooler = config.host.includes('pooler.supabase.com')

// force-disable SSL for pooler
if (isPooler) {
	process.env.PGSSLMODE = 'disable'
}

const sequelize = isProd
	? new Sequelize(config.url, {
			dialect: config.dialect,
			dialectOptions: {
				ssl: {
					require: true,
					rejectUnauthorized: false,
				},
			},
			logging: false,
	  })
	: new Sequelize(config.database, config.username, config.password, {
			dialect: config.dialect,
			host: config.host,
			port: config.port,
			dialectOptions: {
				ssl: {
					require: true,
					rejectUnauthorized: false, // important for Supabase
				},
			},
			logging: false,
	  })

console.log(sequelize)
module.exports = sequelize
