const router = require('express').Router();
const PayrollController = require('./payroll.controller');

class PayrollRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/', PayrollController.getSettings);
        this.myRoutes.put('/', PayrollController.updateSettings);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = PayrollRoutes;