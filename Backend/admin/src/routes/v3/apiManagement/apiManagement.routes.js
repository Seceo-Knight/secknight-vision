'use strict';
const router = require('express').Router();
const controller = require('./apiManagement.controller');

class BuildModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.post('/', controller.createToken);
        this.routes.delete('/', controller.deleteToken);
        this.routes.get('/', controller.getTokens);

        this.routes.get("/logs", controller.getAPILogs);
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = BuildModule;