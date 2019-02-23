module.exports = {
  setupFilesAfterEnv: ["<rootDir>/setupJest.js"],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  coverageDirectory: "./coverage/",
  collectCoverage: true,
  transformIgnorePatterns: [
    "node_modules/(?!(promise-polyfill)/)"
  ]
};
