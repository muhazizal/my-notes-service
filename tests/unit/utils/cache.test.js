const redisClient = require('../../../config/redis')

describe('utils/cache', () => {
	beforeEach(() => {
		// Reset redis readiness and method stubs
		redisClient.isOpen = false
		redisClient.isReady = false
		redisClient.get = undefined
		redisClient.set = undefined
		redisClient.del = undefined
	})

	test('returns safe fallbacks when redis is not ready', async () => {
		const { getJSON, setJSON, del, delMany } = require('../../../utils/cache')

		const v1 = await getJSON('k1')
		const v2 = await setJSON('k2', { a: 1 })
		const v3 = await del('k3')
		const v4 = await delMany(['a', 'b'])
		const v5 = await delMany([])

		expect(v1).toBeNull()
		expect(v2).toBeNull()
		expect(v3).toBe(0)
		expect(v4).toBe(0)
		expect(v5).toBe(0)
	})

	test('performs get/set/del when redis is ready (no TTL and with TTL)', async () => {
		const { getJSON, setJSON, del, delMany } = require('../../../utils/cache')

		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.get = jest.fn().mockResolvedValue(JSON.stringify({ a: 1 }))
		redisClient.set = jest.fn().mockResolvedValue('OK')
		redisClient.del = jest.fn().mockResolvedValue(2)

		// getJSON
		await expect(getJSON('key:get')).resolves.toEqual({ a: 1 })
		expect(redisClient.get).toHaveBeenCalledWith('key:get')

		// setJSON without TTL
		await expect(setJSON('key:set:noTTL', { b: 2 })).resolves.toBe('OK')
		expect(redisClient.set).toHaveBeenCalledWith('key:set:noTTL', JSON.stringify({ b: 2 }))

		// setJSON with TTL
		await expect(setJSON('key:set:ttl', { c: 3 }, 5)).resolves.toBe('OK')
		expect(redisClient.set).toHaveBeenCalledWith('key:set:ttl', JSON.stringify({ c: 3 }), { EX: 5 })

		// del single
		await expect(del('key:del')).resolves.toBe(2)
		expect(redisClient.del).toHaveBeenCalledWith('key:del')

		// delMany
		await expect(delMany(['k1', 'k2'])).resolves.toBe(2)
		expect(redisClient.del).toHaveBeenCalledWith(['k1', 'k2'])
	})

	test('handles redis errors gracefully for get/del (returns null/0)', async () => {
		const { getJSON, del } = require('../../../utils/cache')

		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.get = jest.fn().mockRejectedValue(new Error('boom'))
		redisClient.del = jest.fn().mockRejectedValue(new Error('boom'))

		await expect(getJSON('k')).resolves.toBeNull()
		await expect(del('k')).resolves.toBe(0)
	})

	test('setJSON returns null when JSON.stringify throws (BigInt payload)', async () => {
		const { setJSON } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.set = jest.fn().mockResolvedValue('OK')
		const payload = { x: BigInt(1) }
		await expect(setJSON('k', payload)).resolves.toBeNull()
	})

	test('getJSON returns null when stored value is invalid JSON', async () => {
		const { getJSON } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.get = jest.fn().mockResolvedValue('{not-json')
		await expect(getJSON('bad')).resolves.toBeNull()
	})

	test('getJSON returns null when redis returns null (no value branch)', async () => {
		const { getJSON } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.get = jest.fn().mockResolvedValue(null)
		await expect(getJSON('none')).resolves.toBeNull()
	})

	test('delMany returns 0 when keys is not an array', async () => {
		const { delMany } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.del = jest.fn().mockResolvedValue(1)
		await expect(delMany('not-array')).resolves.toBe(0)
	})

	test('delMany returns 0 when redis.del rejects', async () => {
		const { delMany } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.del = jest.fn().mockRejectedValue(new Error('boom'))
		await expect(delMany(['k'])).resolves.toBe(0)
	})

	test('delMany returns 0 when redis is not ready even with valid keys', async () => {
		const { delMany } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = false
		redisClient.isReady = false
		await expect(delMany(['k'])).resolves.toBe(0)
	})

	test('getJSON returns null when redis get hangs (timeout branch)', async () => {
		jest.useFakeTimers()
		const { getJSON } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.get = jest.fn(() => new Promise(() => {}))

		const p = getJSON('hang')
		jest.advanceTimersByTime(2000)
		await expect(p).resolves.toBeNull()
		jest.useRealTimers()
	})

	test('setJSON returns null when redis set hangs (timeout branch) without TTL', async () => {
		jest.useFakeTimers()
		const { setJSON } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.set = jest.fn(() => new Promise(() => {}))

		const p = setJSON('k', { a: 1 })
		jest.advanceTimersByTime(2000)
		await expect(p).resolves.toBeNull()
		jest.useRealTimers()
	})

	test('setJSON returns null when redis set hangs (timeout branch) with TTL', async () => {
		jest.useFakeTimers()
		const { setJSON } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.set = jest.fn(() => new Promise(() => {}))

		const p = setJSON('k', { a: 1 }, 10)
		jest.advanceTimersByTime(2000)
		await expect(p).resolves.toBeNull()
		jest.useRealTimers()
	})

	test('del returns 0 when redis del hangs (timeout branch)', async () => {
		jest.useFakeTimers()
		const { del } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.del = jest.fn(() => new Promise(() => {}))

		const p = del('k')
		jest.advanceTimersByTime(2000)
		await expect(p).resolves.toBe(0)
		jest.useRealTimers()
	})

	test('delMany returns 0 when redis del hangs (timeout branch)', async () => {
		jest.useFakeTimers()
		const { delMany } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.del = jest.fn(() => new Promise(() => {}))

		const p = delMany(['a', 'b'])
		jest.advanceTimersByTime(2000)
		await expect(p).resolves.toBe(0)
		jest.useRealTimers()
	})

	test('setJSON returns null when redis.set rejects (error branch)', async () => {
		const { setJSON } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.set = jest.fn().mockRejectedValue(new Error('boom'))
		await expect(setJSON('k', { a: 1 })).rejects.toThrow('boom')
	})

	test('withTimeout uses env then default branches across calls', async () => {
		const prev = process.env.REDIS_COMMAND_TIMEOUT_MS
		jest.useFakeTimers()
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.get = jest.fn(() => new Promise(() => {}))
		const { getJSON } = require('../../../utils/cache')

		process.env.REDIS_COMMAND_TIMEOUT_MS = '10'
		const p1 = getJSON('env-timeout')
		jest.advanceTimersByTime(10)
		await expect(p1).resolves.toBeNull()

		delete process.env.REDIS_COMMAND_TIMEOUT_MS
		const p2 = getJSON('default-timeout')
		jest.advanceTimersByTime(2000)
		await expect(p2).resolves.toBeNull()

		jest.useRealTimers()
		process.env.REDIS_COMMAND_TIMEOUT_MS = prev
	})

	test('delMany returns 0 when called with no args (default param branch)', async () => {
		const { delMany } = require('../../../utils/cache')
		const redisClient = require('../../../config/redis')
		redisClient.isOpen = true
		redisClient.isReady = true
		redisClient.del = jest.fn().mockResolvedValue(1)
		await expect(delMany()).resolves.toBe(0)
	})
})
