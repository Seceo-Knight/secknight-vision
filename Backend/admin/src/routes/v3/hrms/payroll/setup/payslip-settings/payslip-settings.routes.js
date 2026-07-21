/** Payslip Settings Routes */

/** Importing */
const routes = require("express").Router();
const controller = require("./payslip-settings.controller");


/**
 * @class PayslipSettingsRoutes 
 * Routes for payslip 
 * Get and Post 
 */
class PayslipSettingsRoutes {

    /** Constructor */
    constructor() {
        this.routes = routes;
        this.core();
    }

    /** Method for Routes */
    core() {
        this.routes.get("/", controller.getPayslipSettings);
        this.routes.post("/", controller.updatePayslipSettings);
    }

    /** Returns Routes */
    getRouters() {
        return this.routes;
    }
}


/** exports */
module.exports = PayslipSettingsRoutes;