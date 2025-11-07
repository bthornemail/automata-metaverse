module.exports = {
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es6: true,
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-case-declarations': 'off',
  },
};