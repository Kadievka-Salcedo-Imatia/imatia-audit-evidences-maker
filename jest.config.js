/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    modulePathIgnorePatterns: [
        '<rootDir>/src/routes',
        '<rootDir>/src/app.ts',
        '<rootDir>/tests/e2e',
        '<rootDir>/dist/*',
    ],
    setupFiles: ['<rootDir>/.jest/setEnvVars.js'],
};
