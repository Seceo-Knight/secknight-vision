'use strict';
const router = require('express').Router();
const APIManagementRoutes = require('./apiManagement/apiManagement.routes');

class BuildModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.use('/api-management', new APIManagementRoutes().getRouters());
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = BuildModule;