const router = require('express').Router();
const DeclarationSettingRoutes = require('./declaration-settings/declaration-setting.routes');
const PfAndEsiRoutes = require('./pfandesisettings/pfandesi.routes');
const PayrollRoutes = require('./payrollsettings/payroll.routes');
const { PTRoutes } = require('./ptsettings/seetings.routes');
const SalaryOnHoldRoutes = require('./salary-on-hold/salaryOnHold.routes');
const SalaryInHandRoutes = require('./salary-in-hand/salaryInHand.routes');

class AdvanceSettingRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.use('/pf-esi', new PfAndEsiRoutes().getRouters());
        this.myRoutes.use('/declaration-setting', new DeclarationSettingRoutes().getRouters());
        this.myRoutes.use('/payroll', new PayrollRoutes().getRouters());
        this.myRoutes.use('/pt', new PTRoutes().getRouters());
        this.myRoutes.use('/salary-hold', new SalaryOnHoldRoutes().getRouters());
        this.myRoutes.use('/salary-in-hand', new SalaryInHandRoutes().getRouters());
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AdvanceSettingRoutes;