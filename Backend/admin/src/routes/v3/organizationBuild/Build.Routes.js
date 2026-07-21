const router = require('express').Router();

const BuildController = require('./Build.controllet')

class OrganizationBuild {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/build', BuildController.getBuild);
        this.myRoutes.get('/build-on-premise', BuildController.getBuildOnPremise);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = OrganizationBuild;