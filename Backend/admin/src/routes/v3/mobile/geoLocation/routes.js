'use strict';

const router = require('express').Router();
const geoLocationController = require('./geoLocation.controller');
const authMiddleware = require('../auth/auth.middleware');

class AuthModule {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {

        // All below routes for Project Crud Operations Dashboard
        this.myRoutes.post('/get-geo-log', authMiddleware.authenticate, geoLocationController.fetchGeoLocation);
        this.myRoutes.post('/get-total-task-time', authMiddleware.authenticate, geoLocationController.getTotalTaskTime);

        //API for filter data in geo-location page
        this.myRoutes.get('/get-all-employees', authMiddleware.authenticate, geoLocationController.getAllEmployees);

        // API to add geo location log
        this.myRoutes.get('/fetch-geo-log-status', authMiddleware.authenticateMobile, geoLocationController.fetchGeoLogStatus);
        this.myRoutes.post('/add-geo-log', authMiddleware.authenticateMobile, geoLocationController.addGeoLocationLogs);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AuthModule;