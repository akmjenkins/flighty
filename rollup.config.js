import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import minify from "rollup-plugin-babel-minify";
import builtins from "rollup-plugin-node-builtins";
import pkg from "./package.json";

export default [
  // With dependencies, no polyfills
  // Browser
  {
    input: "src/flighty.js",
    output: {
      file: "dist/flighty.browser.min.js",
      format: "iife",
      name: "flighty",
      globals: { flighty: "Flighty" },
      sourcemap: true
    },
    external: [],
    plugins: [babel(), resolve({browser:true}), commonjs(), minify({comments:false}), builtins()]
  },

  // ES5
  {
    input: "src/flighty.js",
    output: {
      file: "dist/flighty.js",
      format: "cjs",
      indent: false
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [babel(),commonjs()]
  },

  // Include polyfills for fetch, promise, and AbortController
  // Browser
  {
    input: "src/flighty.fetch.js",
    output: {
      file: "dist/flighty.fetch.browser.min.js",
      format: "iife",
      name: "flighty",
      globals: { flighty: "Flighty" },
      sourcemap: true
    },
    external: [],
    plugins: [babel(), resolve({browser:true}), commonjs(), builtins(), minify({comments:false})]
  },

  // Other
  {
    input: "src/flighty.fetch.js",
    output: {
      file: "dist/flighty.fetch.js",
      format: "cjs",
      indent: false
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [babel(),resolve({preferBuiltins:true}),commonjs()]
  },
];
