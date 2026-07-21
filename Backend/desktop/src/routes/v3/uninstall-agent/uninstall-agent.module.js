'use strict';
const router = require('express').Router();
const UninstallAgentController = require('./uninstall-agent.controller');
const { planCheck } = require('./services/planCheck.middleware');
const {authenticate} = require('../auth/services/auth.middleware');

class RequestModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.post('/check-uninstall-password', planCheck, authenticate, UninstallAgentController.checkAgentUninstallProcess);
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = RequestModule;