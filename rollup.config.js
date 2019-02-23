import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import minify from "rollup-plugin-babel-minify";
import builtins from "rollup-plugin-node-builtins";
import pkg from "./package.json";

export default [
  // Minified with dependencies - suitable for all environments with a fetch
  {
    input: "src/flighty.js",
    output: {
      file: "dist/flighty.min.js",
      format: "iife",
      name: "flighty",
      globals: { flighty: "Flighty" },
      sourcemap: true
    },
    external: [],
    plugins: [babel(), resolve(), commonjs(), minify({comments:false}), builtins()]
  },
  // Minified with dependencies AND fetch - suitable for browser environments where fetch is unknown
  {
    input: "src/flighty.fetch.js",
    output: {
      file: "dist/flighty.fetch.min.js",
      format: "iife",
      name: "flighty",
      globals: { flighty: "Flighty" },
      sourcemap: true
    },
    external: [],
    plugins: [babel(), resolve(), commonjs(), builtins(), minify({comments:false})]
  },

  // Without dependencies - suitable for all ES5 environments
  {
    input: "src/flighty.js",
    output: {
      file: "dist/flighty.js",
      format: "cjs",
      indent: false,
      exports: "named"
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [babel()]
  },

  // ES5 polyfilled
  {
    input: "src/flighty.fetch.js",
    output: {
      file: "fetch/index.js",
      format: "cjs",
      indent: false,
      exports: "named"
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [babel(),resolve(),commonjs(), builtins()]
  },
];
