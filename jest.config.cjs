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
  modulePathIgnorePatterns: [
    '/.next/',
  ],
  testMatch: [
    '**/__tests__/**/*test.(ts|tsx|js)',
  ],
  workerIdleMemoryLimit: '512KB',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
}