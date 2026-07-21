'use strict';
const router = require('express').Router();
const RDPRequestController = require('./RDPRequest.controller.js');
const {authenticate} = require('../auth/services/auth.middleware');

class RDPRequestModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.post('/rdp-connection-open', authenticate, RDPRequestController.rdpConnectionOpen);
        this.routes.post('/rdp-connection-close', authenticate, RDPRequestController.rdpConnectionClose);

        this.routes.get('/get-rdp-token', RDPRequestController.getRDPToken);
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = RDPRequestModule;