const PayrollSetupRoutes = require('./setup/setup.routes.js');
const AdvanceSettingRoutes = require('./advancesettings/advancesetting.routes');
const RunPayrollRoutes = require('./run-payroll/run-payroll.routes.js');
const DeclarationRoutes = require('./declaration/declaration.routes');
const CustomSalaryRoutes = require('./custom-salary/custom-salary.routes.js');

const router = require('express').Router();

class PayrollRoutes {
    constructor() {
        this.payrollRoutes = router;
        this.core();
    }

    core() {
        this.payrollRoutes.use('/setup', new PayrollSetupRoutes().getRouters());
        this.payrollRoutes.use('/advance-settings', new AdvanceSettingRoutes().getRouters());
        this.payrollRoutes.use('/run-payroll', new RunPayrollRoutes().getRouters());
        this.payrollRoutes.use('/declaration', new DeclarationRoutes().getRouters());
        this.payrollRoutes.use('/custom-salary', new CustomSalaryRoutes().getRouters());
    }

    getRouters() {
        return this.payrollRoutes;
    }
}

module.exports = PayrollRoutes;