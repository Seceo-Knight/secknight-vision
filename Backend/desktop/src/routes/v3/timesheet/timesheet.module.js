'use strict';
const router = require('express').Router();
const Controller = require('./timesheet.controller');

class TimesheetModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.get('/', Controller.getTimesheet);
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = TimesheetModule;