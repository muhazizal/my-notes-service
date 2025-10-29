module.exports = {
	testEnvironment: 'node',
	rootDir: '.',
	testMatch: ['**/tests/**/*.test.js'],
	setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
	clearMocks: true,
	restoreMocks: true,
	verbose: false,
}
