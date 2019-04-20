module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true,
    jest: true
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    "no-plusplus":"off"
  },

  globals: {
    "AbortController":"readonly",
    "fetch":"readonly"
  }
};
