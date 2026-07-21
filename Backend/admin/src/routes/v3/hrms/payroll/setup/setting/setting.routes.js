const router = require('express').Router();
const PayrollSetupSettingController = require('./setting.controller.js');


class PayrollSetupSettingRoutes {
    constructor() {
        this.payrollSetupSettingRoutes = router;
        this.core();
    }

    core() {
        this.payrollSetupSettingRoutes.get('/', PayrollSetupSettingController.getSetupSetting);
        this.payrollSetupSettingRoutes.put('/', PayrollSetupSettingController.putSetupSetting); 
    }

    getRouters() {
        return this.payrollSetupSettingRoutes;
    }
}

module.exports = PayrollSetupSettingRoutes;