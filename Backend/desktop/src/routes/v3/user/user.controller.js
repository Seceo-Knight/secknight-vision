'use strict';

const userService = require('./services/user.service');
const configService = require('./services/config.service');

class UserController {
    async me(req, res, next) {
        return await userService.me(req, res, next);
    }

    async configs(req, res, next) {
        return await configService.configs(req, res, next);
    }

    async systemInfo(req, res, next) {
        return await configService.systemInfo(req, res, next);
    }

    async uninstallCodeCheck(req, res, next) {
        return await userService.uninstallCodeCheck(req, res, next);
    }
    
    async userLogOut(req, res, next) {
        return await userService.userLogOut(req, res, next);
    }

    async raisedAlert(req, res, next) {
        return await userService.raisedAlert(req, res, next);
    }

    async getStorageDetails(req, res, next) {
        return await userService.getStorageDetails(req, res, next);
    }

    async saveSystemLog(req, res, next) {
        return await userService.saveSystemLog(req, res, next);
    }

    async saveEmailMonitoringLog(req, res, next) {
        return await userService.saveEmailMonitoringLog(req, res, next);
    }
}

module.exports = new UserController;