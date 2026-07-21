'use strict';

const router = require('express').Router();

const openRoutes = require('./open.controller');

class OpenModule {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/', openRoutes.entryRoute);
        this.myRoutes.get('/server-time', openRoutes.serverTime);
        this.myRoutes.get('/app-info', openRoutes.appInfo);
        this.myRoutes.post('/log', openRoutes.addLog);
        this.myRoutes.put('/app-info/update', openRoutes.updateAppInfo);
        this.myRoutes.post('/reset-redis', openRoutes.resetRedis);
        this.myRoutes.post('/get-employee-detail', openRoutes.getPlanExpiry);
        this.myRoutes.post('/get-organization-detail', openRoutes.getOrganizationPlanDetails);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = OpenModule;