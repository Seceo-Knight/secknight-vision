'use strict';

const router = require('express').Router();
const Controller = require('./internalAnalytics.controller');

class InternalAnalyticsModule {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/email-report-concise', Controller.getAutoEmailReportConcise);
        this.myRoutes.get('/alert-report-concise', Controller.getAlertReportConcise);
        this.myRoutes.get('/system-logs-report', Controller.getSystemLogsReport);
        this.myRoutes.get('*', (req, res) => res.sendStatus(404));
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = InternalAnalyticsModule;