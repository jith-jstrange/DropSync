import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  globalSetup: '<rootDir>/tests/jest.globalSetup.js',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testMatch: ['**/?(*.)+(test).ts'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@jobs/(.*)$': '<rootDir>/src/jobs/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@webhooks/(.*)$': '<rootDir>/src/webhooks/$1'
  },
  roots: ['<rootDir>/src', '<rootDir>/tests']
};

export default config;
