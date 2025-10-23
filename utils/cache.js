const redisClient = require('../config/redis')

const getJSON = async (key) => {
	const value = await redisClient.get(key)
	return value ? JSON.parse(value) : null
}

const setJSON = async (key, payload, ttlSeconds) => {
	const value = JSON.stringify(payload)
	if (typeof ttlSeconds === 'number') {
		return redisClient.set(key, value, { EX: ttlSeconds })
	}
	return redisClient.set(key, value)
}

const del = async (key) => {
	return redisClient.del(key)
}

const delMany = async (keys = []) => {
	if (!Array.isArray(keys) || keys.length === 0) return 0
	return redisClient.del(keys)
}

module.exports = {
	getJSON,
	setJSON,
	del,
	delMany,
}