// Admin Charges Routes

const adminChargesController = require('./adminCharges.controller');
const router = require('express').Router();


// class
class AdminChargesRoutes {

    constructor() {
        this.adminChargesRoutes = router;
        this.core();
    }

    core() {
        this.adminChargesRoutes.get('/', adminChargesController.getAdminCharges);
        this.adminChargesRoutes.put('/', adminChargesController.updateAdminCharges);
    }

    getRouters() {
        return this.adminChargesRoutes;
    }
}


// exports
module.exports = AdminChargesRoutes;