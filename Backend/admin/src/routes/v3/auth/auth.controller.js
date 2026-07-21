"use strict";

const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');
const authService = require('./services/auth.service');
const eventService = require('./services/event.service');

/**
 * User Authentication routes
 *
 * @class AuthController
 */
class AuthController {
    async userAuth(req, res, next) {
        return await authService.userAuth(req, res, next);
    }

    async adminAuth(req, res, next) {
        return await authService.adminAuth(req, res, next);
    }

    async adminSendEmail(req, res, next) {
        return await authService.adminSendEmail(req, res, next);
    }
    async employeeSendEmail(req, res, next) {
        return await authService.employeeSendEmail(req, res, next);
    }

    async accountSwitch(req, res, next) {
        return await authService.accountSwitch(req, res, next);
    }

    async logout(req, res, next) {
        return await authService.logout(req, res, next);
    }

    async agentLogout(req, res, next) {
        return await authService.agentLogout(req, res, next);
    }

    async info(req, res, next) {
        return await authService.getOrganization(req, res, next);
    }

    async infoCustom(req, res, next) {
        return await authService.infoCustom(req, res, next);
    }

    async validateOTP2FA(req, res, next) {
        return await authService.validateOTP2FA(req, res, next);
    }

    async validateOTP2FAOrganization(req, res, next) {
        return await authService.validateOTP2FAOrganization(req, res, next);
    }

    async amemberLogout(req, res, next) {
        return await authService.amemberLogout(req, res, next);
    }

    async ssoAuth(req, res, next) {
        return await authService.ssoLogin(req, res, next);
    }
}

module.exports = new AuthController;