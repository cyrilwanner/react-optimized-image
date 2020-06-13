module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  transform: {
    '\\.ts$': ['babel-jest', { configFile: './.babelrc.plugin' }],
  },
};
