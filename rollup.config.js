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
  commonjs(),
  babel()
]

const polyfillAll = () => polyfill(
  main,
  [
    "promise-polyfill",
    CROSS_FETCH_POLYFILL,
    ABORT_POLYFILL
  ]
)

const polyfillAbort = () => polyfill(
  main,
  [
    ABORT_POLYFILL
  ]
)

const ABORT_POLYFILL = "abortcontroller-polyfill/dist/polyfill-patch-fetch";
const CROSS_FETCH_POLYFILL = "cross-fetch/polyfill";

const EXTERNAL_POLYFILLS = [ABORT_POLYFILL,CROSS_FETCH_POLYFILL];

export default [
  // With dependencies, no polyfills
  // Browser
  {
    input: main,
    output: {
      file: "dist/flighty.browser.min.js",
      format: "iife",
      name: "Flighty"
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
      ...EXTERNAL_POLYFILLS,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      ...es5Plugins
    ]
  },

  // Include polyfills for fetch, promise, and AbortController
  // unpkg.com?
  {
    input: main,
    output: {
      file: "fetch/index.js",
      format: "iife",
      name: "Flighty"
    },
    external: [],
    plugins: [
      polyfillAll(),
      ...browserPlugins]
  },

  // Other
  {
    input: main,
    output: {
      file: "dist/flighty.fetch.js",
      format: "cjs"
    },
    external: [
      ...EXTERNAL_POLYFILLS,
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
      ...EXTERNAL_POLYFILLS,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      polyfillAll()
    ]
  },


  // Include polyfills for AbortController
  // put an index.js file in abort for the benefit of unpkg.com?
  {
    input: main,
    output: {
      file: "abort/index.js",
      format: "iife",
      name: "Flighty"
    },
    external: [],
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
      ...EXTERNAL_POLYFILLS,
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
      ...EXTERNAL_POLYFILLS,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      polyfillAbort()
    ]
  },
];
