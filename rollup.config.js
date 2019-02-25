import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import minify from "rollup-plugin-babel-minify";
import builtins from "rollup-plugin-node-builtins";
import pkg from "./package.json";
import polyfill from 'rollup-plugin-polyfill';

const main = "src/flighty.js";
const browserPlugins = [
  resolve({browser:true}),
  commonjs(),
  babel(),
  minify({comments:false}),
  builtins()
];

const es5Plugins = [
  resolve({preferBuiltins:true}),
  commonjs(),
  babel()
]

const polyfillAll = () => polyfill(
  main,
  [
    "promise-polyfill",
    "cross-fetch/polyfill",
    "abortcontroller-polyfill/dist/polyfill-patch-fetch"
  ]
)

const polyfillAbort = () => polyfill(
  main,
  [
    "abortcontroller-polyfill/dist/polyfill-patch-fetch"
  ]
)

export default [
  // With dependencies, no polyfills
  // Browser
  {
    input: main,
    output: {
      file: "dist/flighty.browser.min.js",
      format: "iife",
      name: "Flighty",
      sourcemap: true
    },
    external: [],
    plugins: [...browserPlugins]
  },

  // ES5
  {
    input: main,
    output: {
      file: "dist/flighty.js",
      format: "cjs"
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      ...es5Plugins
    ]
  },

  // Include polyfills for fetch, promise, and AbortController
  // Browser
  {
    input: main,
    output: {
      file: "dist/flighty.fetch.browser.min.js",
      format: "iife",
      name: "Flighty",
      sourcemap: true
    },
    external: [],
    plugins: [polyfillAll(),...browserPlugins]
  },

  // Other
  {
    input: main,
    output: {
      file: "dist/flighty.fetch.js",
      format: "cjs"
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      polyfillAll(),
      ...es5Plugins
    ]
  },

  // Module
  {
    input: main,
    output: {
      file: "src/flighty.fetch.js",
      format: "esm"
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      polyfillAll()
    ]
  },


  // Include polyfills for AbortController
  {
    input: main,
    output: {
      file: "dist/flighty.abort.min.js",
      format: "cjs"
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      polyfillAbort(),
      ...browserPlugins
    ]
  },

  {
    input: main,
    output: {
      file: "dist/flighty.abort.js",
      format: "cjs"
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      polyfillAbort(),
      ...es5Plugins
    ]
  },

  // Include polyfills for AbortController
  {
    input: main,
    output: {
      file: "src/flighty.abort.js",
      format: "esm"
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      polyfillAbort()
    ]
  },
];
