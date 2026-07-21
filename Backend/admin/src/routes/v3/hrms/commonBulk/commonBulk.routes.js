const commonBulkController = require('./commonBulk.controller');

const router = require('express').Router();

class CommonBulkRoutes {
    constructor() {
        this.commonBulkRoute = router;
        this.core();
    }

    core() {
        this.commonBulkRoute.post('/upload', commonBulkController.bulkUpload);
    }

    getRouters() {
        return this.commonBulkRoute;
    }
}

module.exports = CommonBulkRoutes;