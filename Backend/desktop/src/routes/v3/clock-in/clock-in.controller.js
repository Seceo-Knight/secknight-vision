'use strict';

const clockInService = require('./clock-in.service');

class ClockInController {
    async record(req, res, next) {
        return await clockInService.record(req, res, next);
    }

    async details(req, res, next) {
        return await clockInService.details(req, res, next);
    }
}

module.exports = new ClockInController;