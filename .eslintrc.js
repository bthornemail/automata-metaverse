module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', 'ui/'],
  rules: {
    'no-unused-vars': 'off',
    'no-console': 'off',
    'no-undef': 'off',
    'no-case-declarations': 'off',
  },
};