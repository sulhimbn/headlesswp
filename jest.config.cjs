module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {tsconfig: '<rootDir>/tsconfig.json'}],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],
  testMatch: [
    '**/__tests__/**/*test.(ts|tsx|js)',
  ],
}