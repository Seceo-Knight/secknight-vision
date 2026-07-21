const rateLimit = require('express-rate-limit');

const APIRateLimiter = rateLimit({
  windowMs: 29 * 60 * 1000, // 29 min in milliseconds
  max: 1,
  message: "You have reached maximum retries. Please try again after 30 minutes", 
  statusCode: 429,
  headers: true,
});

module.exports = { APIRateLimiter }