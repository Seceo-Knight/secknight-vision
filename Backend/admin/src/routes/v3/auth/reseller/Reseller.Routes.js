const router = require('express').Router();
const AuthMiddleware = require('../services/auth.middleware');

const { ResellerController } = require('./Reseller.Controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/register-client', AuthMiddleware.authenticate, ResellerController.registerClient);
        this.myRoutes.post('/client', ResellerController.clientAuth);
        // Login API For Silah
        this.myRoutes.post('/client-login', AuthMiddleware.authenticate, ResellerController.clientAuthReseller);
        this.myRoutes.post('/client-employee-login', AuthMiddleware.authenticate, ResellerController.clientEmployeeAuthReseller);
    }
    getRoutes() {
        return this.myRoutes;
    }
}

module.exports.ResellerAuthRoutes = Routes;