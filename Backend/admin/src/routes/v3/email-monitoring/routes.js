const router = require('express').Router();

const EmailMonitoringController = require('./controller');

class EmailMonitoringRoutes {

    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.get('/get-email-monitoring', EmailMonitoringController.getEmailMonitoring);
    }

    getRoutes() {
        return this.routes;
    }
}

module.exports = EmailMonitoringRoutes;