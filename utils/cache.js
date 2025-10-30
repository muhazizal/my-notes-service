const redisClient = require('../config/redis')

const DEFAULT_TIMEOUT_MS = 2000

const withTimeout = async (promise, ms = Number(process.env.REDIS_COMMAND_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(null)
    }, ms)
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

const isRedisReady = () => redisClient?.isOpen && redisClient?.isReady

const getJSON = async (key) => {
	if (!isRedisReady()) return null
	try {
		const value = await withTimeout(redisClient.get(key))
		return value ? JSON.parse(value) : null
	} catch (_) {
		return null
	}
}

const setJSON = async (key, payload, ttlSeconds) => {
	if (!isRedisReady()) return null
	try {
		const value = JSON.stringify(payload)
		if (typeof ttlSeconds === 'number') {
			return withTimeout(redisClient.set(key, value, { EX: ttlSeconds }))
		}
		return withTimeout(redisClient.set(key, value))
	} catch (_) {
		return null
	}
}

const del = async (key) => {
	if (!isRedisReady()) return 0
	try {
		return (await withTimeout(redisClient.del(key))) || 0
	} catch (_) {
		return 0
	}
}

const delMany = async (keys = []) => {
	if (!Array.isArray(keys) || keys.length === 0) return 0
	if (!isRedisReady()) return 0
	try {
		return (await withTimeout(redisClient.del(keys))) || 0
	} catch (_) {
		return 0
	}
}

module.exports = {
	getJSON,
	setJSON,
	del,
	delMany,
}
