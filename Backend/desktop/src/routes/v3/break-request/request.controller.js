'use strict';

const requestService = require('./request.service');

class RequestController {
   

    async create(req, res, next) {
        return await requestService.create(req, res, next);
    }

    async getOfflineTime(req, res, next) {
        return await requestService.getOfflineTime(req, res, next);
    }

    async createIdleRequest(req, res, next) {
        return await requestService.createIdleRequest(req, res, next);
    }

    async getReasons(req, res, next) {
        return await requestService.getReasons(req, res, next);
    }
}

module.exports = new RequestController;