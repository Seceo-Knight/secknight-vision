'use strict';
const router = require('express').Router();
const controller = require('./apiManagement.controller');

const middleware = (req, res, next) => {
    if(req.decoded = 246) return next();
    else return res.json({
        code: 400,
        message: "Something went wrong"
    })
}

class Routes {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.post('/update', controller.updateAdminLimit);
        this.routes.get('/get', controller.getAdminLimit);
        this.routes.get('/get-all-admin', controller.getAllAdmin);
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = Routes;