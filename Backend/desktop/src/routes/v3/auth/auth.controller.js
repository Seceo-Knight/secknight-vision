"use strict";

const authService = require('./services/auth.service');

/**
 * User Authentication routes
 *
 * @class AuthController
 */
class AuthController {
    async authenticate(req, res, next) {
        return await authService.authenticate(req, res, next);
    }

    async registerUsingMacAddress(req, res, next) {
        return await authService.registerUsingMacAddress(req, res, next);
    }

    async authenticateLoginAgent(req, res, next) {
        return await authService.authenticateLoginAgent(req, res, next);
    }

    async keyCheck(req, res, next) {
        const { text } = req.body;
        const result = await authService.checkShortenKey(text);
        res.status(200).json({
            code: 200, msg: 'Fetched',
            data: result, error: null
        });
    }
}

module.exports = new AuthController;