
const router = require('express').Router();
const runPayrollSalaryRevisionController =  require('./salary-revision.controller');

class RunPayrollSalaryRevisionRoutes {
    constructor() {
        this.runPayrollSalaryRevisionRoutes = router;
        this.core();
    }

    core() {
        this.runPayrollSalaryRevisionRoutes.get('/', runPayrollSalaryRevisionController.getSalaryRevision);
    }

    getRouters() {
        return this.runPayrollSalaryRevisionRoutes;
    }
}

module.exports = RunPayrollSalaryRevisionRoutes;