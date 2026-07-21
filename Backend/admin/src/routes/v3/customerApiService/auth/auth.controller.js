"use strict";

// const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');
const authService = require('./services/auth.service');
// const eventService = require('./services/event.service');

/**
 * User Authentication routes
 *
 * @class AuthController
 */
class AuthController {
    async userAuth(req, res, next) {
        return await authService.userAuth(req, res, next);
    }
}

module.exports = new AuthController;