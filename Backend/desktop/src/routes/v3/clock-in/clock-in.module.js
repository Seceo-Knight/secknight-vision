'use strict';
const router = require('express').Router();
const clockInController = require('./clock-in.controller');

class UserModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.post('/record', clockInController.record);
        this.routes.post('/details', clockInController.details);
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = UserModule;