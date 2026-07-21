const rateLimit = require('express-rate-limit');

const APIAuthRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 60 Seconds in milliseconds
  max: 20, // total 20*3 requests per minuute
  message: "You have reached maximum retries. Please try again after 1 minutes", 
  statusCode: 429,
  headers: true,
});

const APIRateLimiterSystemInfo = rateLimit({
  windowMs: 1 * 60 * 1000, // 60 Seconds in milliseconds
  max: 4, // total 4*3 request per minutes
  message: "You have reached maximum retries. Please try again after 1 minutes", 
  statusCode: 429,
  headers: true,
});

module.exports = { APIAuthRateLimiter, APIRateLimiterSystemInfo }