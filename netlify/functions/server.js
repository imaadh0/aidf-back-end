const serverless = require("serverless-http");
const app = require("../../src/index");

// Export the serverless handler
exports.handler = serverless(app);
