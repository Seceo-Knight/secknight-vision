
const router = require('express').Router();
const runPayrollPreviewController = require('./preview.controller');
class RunPayrollPreviewRoutes {
    constructor() {
        this.runPayrollPreviewRoutes = router;
        this.core();
    }

    core() {
        this.runPayrollPreviewRoutes.get('/', runPayrollPreviewController.getPreview);
        this.runPayrollPreviewRoutes.get('/complete', runPayrollPreviewController.completeAction);
        this.runPayrollPreviewRoutes.get('/employee-tds', runPayrollPreviewController.getEmployeeTds);
    }

    getRouters() {
        return this.runPayrollPreviewRoutes;
    }
}

module.exports = RunPayrollPreviewRoutes;