"use strict";

const openService = require('./open.service');

/**
 * contains unauthenticated routes's and server status routes's callback
 *
 * @class RootIndex
 */
class OpenController {

    /**
     * Index route to check if server is running or not.
     * 
     * @function entryRoute
     * @returns {String}
     * @see also {@link http://localhost:3003/api/v3/explorer/#/Open/get_}
     */
    async entryRoute(req, res, next) {
        return await openService.entryRoute(req, res, next);
    }

    /**
     * Sends Current Server Time.
     *
     * @function serverTime
     * @param {*} req
     * @param {*} res
     * @returns {Object} - current server time.
     * @memberof RootIndex
     * @see also {@link http://localhost:3000/api/v1/explorer/#/Open/get_server_time}
     */
    async serverTime(req, res, next) {
        return await openService.serverTime(req, res, next);
    }

    async appInfo(req, res, next) {
        return await openService.appInfo(req, res, next);
    }

    async updateAppInfo(req, res, next) {
        return await openService.updateAppInfo(req, res, next);
    }

    async resetRedis(req, res, next) {
        return await openService.resetRedis(req, res, next);
    }

    async addLog(req, res, next) {
        return await openService.addLog(req, res, next);
    }

    async getPlanExpiry(req, res, next) {
        return await openService.getPlanExpiry(req, res, next);
    }

    async getOrganizationPlanDetails(req, res, next) {
        return await openService.getOrganizationPlanDetails(req, res, next);
    }
}

module.exports = new OpenController;