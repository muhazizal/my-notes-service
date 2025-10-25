const consola = require('consola')
const { createClient } = require('redis')

const client = createClient({
	username: process.env.REDIS_USERNAME,
	password: process.env.REDIS_PASSWORD,
	disableOfflineQueue: true,
	socket: {
		host: process.env.REDIS_SOCKET_HOST,
		port: process.env.REDIS_SOCKET_PORT,
		connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 5000),
		reconnectStrategy: (retries) => Math.min(retries * 200, 3000), // backoff up to 3s
	},
})

client.on('error', (err) => {
	consola.error({ message: `❌ Redis error: ${err.message}`, badge: true })
})

client.on('connect', () => {
	consola.ready({ message: `✅ Connected to Redis`, badge: true })
})

client.on('ready', () => {
	consola.ready({ message: `✅ Redis client ready`, badge: true })
})

client.on('end', () => {
	consola.warn({ message: `⚠️ Redis client disconnected`, badge: true })
})
;(async () => {
	try {
		await client.connect()
	} catch (err) {
		consola.error({ message: `❌ Redis connect failed: ${err.message}`, badge: true })
	}
})()

// Keepalive: periodically PING Redis in production to avoid cold reconnect delays
if (process.env.NODE_ENV === 'production') {
	const intervalMs = Number(process.env.REDIS_KEEPALIVE_INTERVAL_MS || 240000) // 4 minutes
	setInterval(async () => {
		try {
			if (client.isOpen) {
				await client.ping()
			}
		} catch (err) {
			consola.warn({ message: `⚠️ Redis keepalive ping failed: ${err.message}`, badge: true })
		}
	}, intervalMs)
}

module.exports = client
