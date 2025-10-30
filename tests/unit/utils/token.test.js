describe('utils/token.generateToken', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('returns deterministic hex token and correct expiry', () => {
    jest.resetModules()

    const fixedNow = 1_700_000_000_000
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow)

    let randomBytesSpy
    jest.doMock('crypto', () => {
      const buf = Buffer.from('a'.repeat(64), 'hex')
      randomBytesSpy = jest.fn(() => buf)
      return { randomBytes: randomBytesSpy }
    })

    const { generateToken } = require('../../../utils/token')
    const { token, tokenExpires } = generateToken()

    expect(randomBytesSpy).toHaveBeenCalledWith(32)
    expect(token).toBe('a'.repeat(64))
    expect(/^[0-9a-f]{64}$/.test(token)).toBe(true)
    expect(tokenExpires).toBe(fixedNow + 10 * 60 * 1000)
  })
})

