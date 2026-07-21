'use strict';

const UserService = require('../routes/v2/user/User.model')
const ErrorResponse = require('../utils/helpers/ErrorResponse');

class Middleware {
    async getUser(req, res, next) {
        try {
            const user = await UserService.getUser('*', `id = ${req.decoded.id}`);

            if (!user || user.length === 0) {
                return next(new ErrorResponse('user not found', 404));
            }

            req.user = user[0];
            next();
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new Middleware;