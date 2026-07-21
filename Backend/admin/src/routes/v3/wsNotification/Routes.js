'use strict';

const router = require('express').Router();
const WsNotificationController = require('./wsNotification.controller');

class WsNotificationRoutes {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/', WsNotificationController.sendReportBeforeDeleteMessage);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = WsNotificationRoutes;