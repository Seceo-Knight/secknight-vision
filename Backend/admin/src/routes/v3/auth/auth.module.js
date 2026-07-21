'use strict';

const router = require('express').Router();
const auth = require('./auth.controller');
const AuthMiddleware = require('../auth/services/auth.middleware');
const { ResellerAuthRoutes } = require('./reseller/Reseller.Routes');
class AuthModule {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/sso', auth.ssoAuth);
        this.myRoutes.post('/admin', auth.adminAuth);
        this.myRoutes.post('/user', auth.userAuth);
        this.myRoutes.post('/info', auth.info);
        this.myRoutes.post('/info-custom', auth.infoCustom);
        this.myRoutes.post('/validate-otp-2fa', auth.validateOTP2FA);
        this.myRoutes.post('/validate-otp-2fa-organization', auth.validateOTP2FAOrganization);

        this.myRoutes.post('/role-account-switch', AuthMiddleware.authenticate, auth.accountSwitch);
        this.myRoutes.post('/admin-send-email', AuthMiddleware.authenticate, auth.adminSendEmail);
        this.myRoutes.post('/admin-resend-email', auth.adminSendEmail);
        this.myRoutes.post('/employee-resend-email', auth.employeeSendEmail);

        this.myRoutes.get('/logout', AuthMiddleware.authenticate, auth.logout);
        this.myRoutes.get('/agent-logout', AuthMiddleware.authenticate, auth.agentLogout);

        this.myRoutes.post("/amember-logout", auth.amemberLogout);

        this.myRoutes.use('/', new ResellerAuthRoutes().getRoutes());
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AuthModule;