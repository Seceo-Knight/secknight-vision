'use strict';

const router = require('express').Router();
const auth = require('./auth/auth.controller');
const AuthMiddleware = require('../auth/services/auth.middleware');

const ApiService = require('./apiService/Routes')

class ApiRouter {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/login', auth.userAuth);

        this.myRoutes.use(AuthMiddleware.authenticate);
        this.myRoutes.use('/reports', new ApiService().getRouters())
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = ApiRouter;