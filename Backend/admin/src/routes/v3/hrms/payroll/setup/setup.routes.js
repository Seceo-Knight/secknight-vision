const router = require('express').Router();
const PayrollSetupSettingRoutes = require('./setting/setting.routes.js');
const PayrollCreateStructureRoutes = require('./create-structure/create-structure.routes.js');
const PayrollAssignStructureRoutes = require('./assign-structure/assign-structure.routes.js');
const PayslipSettingsRoutes = require("./payslip-settings/payslip-settings.routes");


class PayrollSetupRoutes {
    constructor() {
        this.payrollSetupRoutes = router;
        this.core();
    }

    core() {
        this.payrollSetupRoutes.use('/setting', new PayrollSetupSettingRoutes().getRouters());
        this.payrollSetupRoutes.use('/create-structure', new PayrollCreateStructureRoutes().getRouters());
        this.payrollSetupRoutes.use('/assign-structure', new PayrollAssignStructureRoutes().getRouters());
        this.payrollSetupRoutes.use('/payslip-settings', new PayslipSettingsRoutes().getRouters());
    }

    getRouters() {
        return this.payrollSetupRoutes;
    }
}

module.exports = PayrollSetupRoutes;