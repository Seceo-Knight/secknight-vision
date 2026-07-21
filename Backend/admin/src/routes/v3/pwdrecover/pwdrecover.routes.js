'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const router = require('express').Router();
const PwdRecoverController = require('./pwdrecover.controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Adding all the routes here
        this.myRoutes.post('/forgot-password', PwdRecoverController.forgotPassword);
        this.myRoutes.put('/reset-password', PwdRecoverController.restPassword);
        this.myRoutes.post('/admin/reset', PwdRecoverController.adminResetPassword);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;
