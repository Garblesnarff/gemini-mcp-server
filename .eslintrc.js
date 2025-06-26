module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': 'off', // Allow console.log for debugging
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }], // Allow devDependencies in test files
    'class-methods-use-this': 'off', // Allow class methods that don't use 'this'
    'no-underscore-dangle': 'off', // Allow dangling underscores for private-like properties
    'max-len': ['error', { code: 120, ignoreUrls: true }], // Max line length 120, ignore URLs
    'no-param-reassign': ['error', { props: false }], // Allow reassigning properties of parameters
    'no-plusplus': 'off', // Allow ++ and -- operators
    'no-restricted-syntax': 'off', // Disable for...of and other restricted syntax
    'guard-for-in': 'off', // Disable guard-for-in
    'no-await-in-loop': 'off', // Allow await in loop
  },
};
