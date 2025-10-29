// Ensure we run in test mode and use in-memory SQLite
process.env.NODE_ENV = 'test'
process.env.DB_DIALECT = process.env.DB_DIALECT || 'sqlite'
process.env.DB_STORAGE = process.env.DB_STORAGE || ':memory:'

// JWT secrets for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret'

// CORS origin
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

// Mock outbound email sending to avoid network calls
jest.mock('../utils/send-email', () => ({
	sendEmailVerification: jest.fn().mockResolvedValue(true),
	sendEmailResetPassword: jest.fn().mockResolvedValue(true),
}))

// Mock Redis client to avoid real network sockets and reconnection timers
jest.mock('../config/redis', () => ({
	isOpen: false,
	isReady: false,
	connect: jest.fn().mockResolvedValue(),
	ping: jest.fn().mockResolvedValue('PONG'),
	sendCommand: jest.fn().mockResolvedValue('OK'),
	quit: jest.fn().mockResolvedValue(),
	disconnect: jest.fn(),
	on: jest.fn(),
	waitForReady: jest.fn().mockResolvedValue(false),
}))

// Reduce consola noise during tests
jest.mock('consola', () => {
	const noop = () => {}
	return {
		ready: noop,
		info: noop,
		warn: noop,
		error: noop,
		success: noop,
		start: noop,
	}
})

// Gracefully close Sequelize after all tests to avoid open handles
const sequelize = require('../config/database')
afterAll(async () => {
	try {
		if (sequelize && sequelize.close) {
			await sequelize.close()
		}
	} catch (_) {}
})
