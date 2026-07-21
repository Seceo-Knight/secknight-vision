const router = require('express').Router();
const OverviewController = require('./overview.controller');

class OverviewRoutes {
    constructor() {
        this.overviewRoutes = router;
        this.core();
    }

    core() {
        this.overviewRoutes.get('/', OverviewController.getEmployees);
        this.overviewRoutes.put('/', OverviewController.updateSettings);
    }

    getRouters() {
        return this.overviewRoutes;
    }
}

module.exports = OverviewRoutes;