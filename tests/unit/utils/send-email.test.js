describe('utils/send-email', () => {
  let originalEnv

  beforeAll(() => {
    originalEnv = { ...process.env }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('sendEmailVerification', () => {
    test('sends verification email with correct payload (success path)', async () => {
      process.env.RESEND_API_KEY = 'test-key'
      process.env.RESEND_FROM_EMAIL = 'noreply@example.com'
      process.env.VERIFY_URL = 'https://example.com/verify'

      jest.resetModules()
      jest.unmock('../../../utils/send-email')

      let mockSend
      jest.doMock('resend', () => {
        mockSend = jest.fn().mockResolvedValue({})
        return {
          Resend: jest.fn().mockImplementation(() => ({
            emails: { send: mockSend },
          })),
        }
      })

      const { sendEmailVerification } = require('../../../utils/send-email')

      await expect(
        sendEmailVerification({}, 'token123', 'user@example.com')
      ).resolves.toBeUndefined()

      expect(mockSend).toHaveBeenCalledTimes(1)
      const arg = mockSend.mock.calls[0][0]
      expect(arg.from).toBe('My Notes <noreply@example.com>')
      expect(arg.to).toBe('user@example.com')
      expect(arg.subject).toBe('My Notes - Verify Email')
      expect(arg.html).toContain('https://example.com/verify/token123')
    })

    test('throws when resend returns error (error path)', async () => {
      process.env.RESEND_API_KEY = 'test-key'
      process.env.RESEND_FROM_EMAIL = 'noreply@example.com'
      process.env.VERIFY_URL = 'https://example.com/verify'

      jest.resetModules()
      jest.unmock('../../../utils/send-email')

      let mockSend
      jest.doMock('resend', () => {
        mockSend = jest
          .fn()
          .mockResolvedValue({ error: { message: 'boom', statusCode: 418 } })
        return {
          Resend: jest.fn().mockImplementation(() => ({
            emails: { send: mockSend },
          })),
        }
      })

      const { sendEmailVerification } = require('../../../utils/send-email')

      await expect(
        sendEmailVerification({}, 'tokenXYZ', 'user@example.com')
      ).rejects.toMatchObject({ message: 'boom', statusCode: 418 })
    })
  })

  describe('sendEmailResetPassword', () => {
    test('sends reset email with correct payload (success path)', async () => {
      process.env.RESEND_API_KEY = 'test-key'
      process.env.RESEND_FROM_EMAIL = 'noreply@example.com'
      process.env.RESET_URL = 'https://example.com/reset'

      jest.resetModules()
      jest.unmock('../../../utils/send-email')

      let mockSend
      jest.doMock('resend', () => {
        mockSend = jest.fn().mockResolvedValue({})
        return {
          Resend: jest.fn().mockImplementation(() => ({
            emails: { send: mockSend },
          })),
        }
      })

      const { sendEmailResetPassword } = require('../../../utils/send-email')

      await expect(
        sendEmailResetPassword({}, 'reset123', 'user@example.com')
      ).resolves.toBeUndefined()

      expect(mockSend).toHaveBeenCalledTimes(1)
      const arg = mockSend.mock.calls[0][0]
      expect(arg.from).toBe('My Notes <noreply@example.com>')
      expect(arg.to).toBe('user@example.com')
      expect(arg.subject).toBe('My Notes - Reset Password')
      expect(arg.html).toContain('https://example.com/reset/reset123')
    })

    test('throws when resend returns error (error path)', async () => {
      process.env.RESEND_API_KEY = 'test-key'
      process.env.RESEND_FROM_EMAIL = 'noreply@example.com'
      process.env.RESET_URL = 'https://example.com/reset'

      jest.resetModules()
      jest.unmock('../../../utils/send-email')

      let mockSend
      jest.doMock('resend', () => {
        mockSend = jest
          .fn()
          .mockResolvedValue({ error: { message: 'bad-reset', statusCode: 500 } })
        return {
          Resend: jest.fn().mockImplementation(() => ({
            emails: { send: mockSend },
          })),
        }
      })

      const { sendEmailResetPassword } = require('../../../utils/send-email')

      await expect(
        sendEmailResetPassword({}, 'resetXYZ', 'user@example.com')
      ).rejects.toMatchObject({ message: 'bad-reset', statusCode: 500 })
    })
  })
})

