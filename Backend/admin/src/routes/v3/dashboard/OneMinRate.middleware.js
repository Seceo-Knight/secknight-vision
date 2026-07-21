const rateLimit = require('express-rate-limit');


const APIRateLimiter = rateLimit({
  windowMs: 59 * 1000, // 59 Seconds in milliseconds
  max: 1,
  message: "You have reached maximum retries. Please try again after 60 Seconds", 
  statusCode: 429,
  headers: true,
});

module.exports = { APIRateLimiter }