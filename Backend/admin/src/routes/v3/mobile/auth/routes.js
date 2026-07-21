'use strict';

const router = require('express').Router();
const auth = require('./auth.controller');
const authMiddleware = require('./auth.middleware');

class AuthModule {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/user', auth.userAuth);
        this.myRoutes.post('/send-otp', auth.sendOTPAuth);
        this.myRoutes.post('/validate-otp', auth.validateOTP);
        this.myRoutes.post('/update-password', auth.updatePassword);
        this.myRoutes.get('/logout', authMiddleware.authenticateMobile, auth.userLogout);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AuthModule;