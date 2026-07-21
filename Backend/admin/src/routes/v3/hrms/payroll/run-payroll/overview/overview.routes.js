const router = require('express').Router();

const OverviewController = require('./overview.controller')

class OverviewRoutes {
    constructor() {
        this.overviewRoutes = router;
        this.core();
    }

    core() {
        // this.overviewRoutes.get('/', OverviewController.getOverview);
        this.overviewRoutes.get('/', OverviewController.getOverviewNew);
        this.overviewRoutes.get('/status', OverviewController.getOverviewMonths);
        this.overviewRoutes.post('/', OverviewController.updateOverview);
        this.overviewRoutes.get('/payout', OverviewController.getPayout);
    }

    getRouters() {
        return this.overviewRoutes;
    }
}

module.exports = OverviewRoutes;