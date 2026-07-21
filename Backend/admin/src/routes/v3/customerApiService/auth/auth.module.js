'use strict';

const router = require('express').Router();
const auth = require('./auth.controller');
const AuthMiddleware = require('../auth/services/auth.middleware');

class AuthModule {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/login', auth.userAuth);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AuthModule;