'user strict';
const router = require('express').Router();
const reportController = require('./report.controller');

class ReportModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.post('/email-activity', reportController.addEmailcontent);
        this.routes.post('/add-email-activity', reportController.addEmailcontentNew);
    }

    getRoutes() {
        return this.routes;
    }
}

module.exports = ReportModule;