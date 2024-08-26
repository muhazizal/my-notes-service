const consola = require('consola')
const { createClient } = require('redis')

const redisClient = createClient({
	socket: {
		host: process.env.REDIS_SOCKET_HOST,
		port: process.env.REDIS_SOCKET_PORT,
	},
	password: process.env.REDIS_PASSWORD,
})

const startRedisClient = async () => {
	redisClient.on('error', (err) => {
		consola.ready({
			message: `Redis error: ${process.env.APP_PORT}`,
			badge: true,
		})
	})

	redisClient.on('connect', () => {
		consola.ready({
			message: `Connected to Redis Client`,
			badge: true,
		})
	})

	await redisClient.connect()
}

startRedisClient()

module.exports = redisClient
