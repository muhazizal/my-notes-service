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

client.on('reconnecting', () => {
	consola.warn({ message: '⚠️ Redis reconnecting...', badge: true })
})

client.on('end', () => {
	consola.warn({ message: `⚠️ Redis client disconnected`, badge: true })
})

// Utility: wait until Redis is ready, with timeout (optional)
client.waitForReady = async (timeoutMs = Number(process.env.REDIS_READY_TIMEOUT_MS || 10000)) => {
	if (client.isReady) return true
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('Redis ready timeout')), timeoutMs)
		client.once('ready', () => {
			clearTimeout(timer)
			resolve(true)
		})
		client.once('error', (err) => {
			clearTimeout(timer)
			reject(err)
		})
	})
}
;(async () => {
	try {
		await client.connect()
	} catch (err) {
		consola.error({ message: `❌ Redis connect failed: ${err.message}`, badge: true })
	}
})()

module.exports = client
