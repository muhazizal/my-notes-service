const { pickAttributes } = require('../../../utils/filter')

describe('utils/filter.pickAttributes', () => {
	test('picks only own properties among requested keys', () => {
		const base = { inherited: 'should-not-be-picked' }
		const payload = Object.create(base)
		payload.a = 1
		payload.b = undefined

		const result = pickAttributes(payload, ['a', 'b', 'inherited', 'missing'])
		expect(result).toEqual({ a: 1, b: undefined })
		expect(Object.prototype.hasOwnProperty.call(result, 'inherited')).toBe(false)
		expect(Object.prototype.hasOwnProperty.call(result, 'missing')).toBe(false)
	})

	test('returns empty object when attributes is empty', () => {
		const result = pickAttributes({ a: 1 }, [])
		expect(result).toEqual({})
	})

	test('duplicate attributes do not create multiple keys', () => {
		const result = pickAttributes({ a: 2 }, ['a', 'a'])
		expect(result).toEqual({ a: 2 })
	})
})
