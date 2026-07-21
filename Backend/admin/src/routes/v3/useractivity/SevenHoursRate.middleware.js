const rateLimit = require('express-rate-limit');

const APIRateLimiter = rateLimit({
  windowMs: 7.9 * 60 * 60 * 1000, // 7 Hours in milliseconds
  max: 1,
  message: "You have reached maximum retries. Please try again after 7 Hours", 
  statusCode: 429,
  headers: true,
});

module.exports = { APIRateLimiter }