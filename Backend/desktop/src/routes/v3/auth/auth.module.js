'use strict';

const router = require('express').Router();
const auth = require('./auth.controller');

const { APIAuthRateLimiter } = require("./services/Rate.middleware");

class AuthModule {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/register', auth.registerUsingMacAddress);
        this.myRoutes.post('/authenticate', auth.authenticate);
        this.myRoutes.post('/authenticate-extension', auth.authenticateLoginAgent);
        this.myRoutes.post('/check-key', auth.keyCheck);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AuthModule;