import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import minify from "rollup-plugin-babel-minify";
import builtins from "rollup-plugin-node-builtins";
import pkg from "./package.json";

export default [
  // Minified with dependencies - suitable for environments with a fetch
  {
    input: "src/flighty.js",
    output: {
      file: "lib/flighty.min.js",
      format: "iife",
      name: "flighty",
      globals: { flighty: "flighty" }
    },
    external: [],
    plugins: [babel(), resolve(), commonjs(), minify(), builtins()]
  },
  // Without dependencies - suitable for webpack-ed front ends
  {
    input: "src/flighty.js",
    output: {
      file: "lib/flighty.js",
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
  // Minified with dependencies AND fetch - suitable for older browsers
  {
    input: "src/flighty.fetch.js",
    output: {
      file: "lib/flighty.fetch.min.js",
      format: "iife",
      name: "flighty",
      globals: { flighty: "flighty" }
    },
    external: [],
    plugins: [babel(), resolve(), commonjs(), builtins(), minify()]
  }
];
