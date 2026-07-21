// Salary on Hold routes

const router = require('express').Router();
const salaryOnHoldController = require('./salaryOnHold.controller');


class SalaryOnHoldRoutes {
    constructor() {
        this.salaryOnHoldRoutes = router;
        this.core();
    }

    core() {
        this.salaryOnHoldRoutes.get('/', salaryOnHoldController.getSalaryOnHold);
        this.salaryOnHoldRoutes.put('/', salaryOnHoldController.updateSalaryOnHold);
        this.salaryOnHoldRoutes.post('/', salaryOnHoldController.upsertSalaryOnHold);
    }

    getRouters() {
        return this.salaryOnHoldRoutes;
    }
}


module.exports = SalaryOnHoldRoutes;