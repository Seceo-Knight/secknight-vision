const RunPayrollPayRegisterRoutes = require('./pay-register/pay-register.routes');
const RunPayrollPreviewRoutes = require('./preview/preview.routes');
const RunPayrollSalaryRevisionRoutes = require('./salary-revision/salary-revision.routes');
const OverviewRoutes = require('./overview/overview.routes')
const router = require('express').Router();

class RunPayrollRoutes {
    constructor() {
        this.runPayrollRoutes = router;
        this.core();
    }

    core() {
        this.runPayrollRoutes.use('/preview', new RunPayrollPreviewRoutes().getRouters());
        this.runPayrollRoutes.use('/salary-revision', new RunPayrollSalaryRevisionRoutes().getRouters());
        this.runPayrollRoutes.use('/pay-register', new RunPayrollPayRegisterRoutes().getRouters());
        this.runPayrollRoutes.use('/overview', new OverviewRoutes().getRouters());

    }

    getRouters() {
        return this.runPayrollRoutes;
    }
}

module.exports = RunPayrollRoutes;