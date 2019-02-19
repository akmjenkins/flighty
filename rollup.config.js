import babel from "rollup-plugin-babel";

import pkg from "./package.json";

export default [
  // CommonJS
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
  }
];
