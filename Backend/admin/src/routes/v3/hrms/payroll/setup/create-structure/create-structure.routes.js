const createStructureController = require('./create-structure.controller');

const router = require('express').Router();

class PayrollCreateStructureRoutes {
    constructor() {
        this.payrollCreateStructureRoutes = router;
        this.core();
    }

    core() {
        this.payrollCreateStructureRoutes.get('/', createStructureController.getPayrollCreateStructure);
        this.payrollCreateStructureRoutes.post('/', createStructureController.postPayrollCreateStructure);
        this.payrollCreateStructureRoutes.put('/', createStructureController.putPayrollCreateStructure);
        this.payrollCreateStructureRoutes.get('/salary-component', createStructureController.getSalaryComponentForCreateStructure);
    }

    getRouters() {
        return this.payrollCreateStructureRoutes;
    }
}

module.exports = PayrollCreateStructureRoutes;