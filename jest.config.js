module.exports = {
  setupFilesAfterEnv: ["<rootDir>/setupJest.js"],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  coverageDirectory: "./coverage/",
  collectCoverage: true
};
