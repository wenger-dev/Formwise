module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/src/test/**/*.ui.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.cjs'],
};
