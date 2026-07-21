
const router = require('express').Router();
const runPayrollPayRegisterController =  require('./pay-register.controller');

class RunPayrollPayRegisterRoutes {
    constructor() {
        this.runPayrollPayRegisterRoutes = router;
        this.core();
    }

    core() {
        this.runPayrollPayRegisterRoutes.get('/', runPayrollPayRegisterController.getPayRegister);
    }

    getRouters() {
        return this.runPayrollPayRegisterRoutes;
    }
}

module.exports = RunPayrollPayRegisterRoutes;