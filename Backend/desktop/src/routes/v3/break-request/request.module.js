'use strict';
const router = require('express').Router();
const requestController = require('./request.controller');

class RequestModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.post('/create-request', requestController.create);
        this.routes.get('/get-offline-time', requestController.getOfflineTime);

        this.routes.post('/create-idle-request', requestController.createIdleRequest);
        this.routes.get('/reasons', requestController.getReasons);
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = RequestModule;