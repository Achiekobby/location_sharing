/* eslint-env node */
module.exports = {
  extends: [
      'eslint:recommended',
      'prettier/@typescript-eslint',
      'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parseOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
  },
  rules: {},
};