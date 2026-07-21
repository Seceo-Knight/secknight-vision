'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const router = require('express').Router();
const delOrganizationController = require('./delOrganization.controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Adding all the routes here
        this.myRoutes.get('/get-OTP', delOrganizationController.sendOTPEmail);
        this.myRoutes.post('/OrgDeleteApi', delOrganizationController.OrgDeleteApi);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;