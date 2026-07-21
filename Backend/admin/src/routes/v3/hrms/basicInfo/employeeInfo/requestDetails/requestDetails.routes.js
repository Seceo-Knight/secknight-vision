// Request Details Routes

const requestDetailsController = require('./requestDetails.controller');
const router = require('express').Router();

// Request Details
class RequestDetails {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/', requestDetailsController.getRequestDetails)
        this.myRoutes.post('/', requestDetailsController.createRequestDetails)
        this.myRoutes.put('/', requestDetailsController.updateRequestDetails)
    }

    getRouters() {
        return this.myRoutes;
    }
}

// exports
module.exports = RequestDetails;