module.exports = {
	testEnvironment: 'node',
	rootDir: '.',
	testMatch: ['**/tests/**/*.test.js'],
	setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
	clearMocks: true,
	restoreMocks: true,
	verbose: false,
	collectCoverageFrom: [
		'<rootDir>/controllers/**/*.js',
		'<rootDir>/middleware/**/*.js',
		'<rootDir>/schema/**/*.js',
		'<rootDir>/utils/**/*.js',
		'<rootDir>/validator/**/*.js',
	],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/tests/',
		'/migrations/',
		'/seeders/',
		'/.github/',
		'/config/',
		'/routes/',
	],
	coverageThreshold: {
		global: {
			statements: 100,
			branches: 100,
			functions: 100,
			lines: 100,
		},
	},
}
