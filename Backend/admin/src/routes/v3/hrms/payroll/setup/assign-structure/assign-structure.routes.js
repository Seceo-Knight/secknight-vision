const assignStructureController = require('./assign-structure.controller');

const router = require('express').Router();

class PayrollAssignStructureRoutes {
    constructor() {
        this.payrollAssignStructureRoutes = router;
        this.core();
    }

    core() {
        this.payrollAssignStructureRoutes.get('/get-payroll-policy', assignStructureController.getPayrollPolicy);
        this.payrollAssignStructureRoutes.get('/', assignStructureController.getPayrollAssignStructure);
        this.payrollAssignStructureRoutes.put('/', assignStructureController.putPayrollAssignStructure);
        this.payrollAssignStructureRoutes.put('/bulk', assignStructureController.putBulkPayrollAssignStructure);
    }

    getRouters() {
        return this.payrollAssignStructureRoutes;
    }
}

module.exports = PayrollAssignStructureRoutes;