const router = require('express').Router();
const customSalaryController = require('./custom-salary.controller');

class CustomSalaryRoutes {
    constructor() {
        this.customSalaryRoutes = router;
        this.core();
    }

    core() {
        this.customSalaryRoutes.post('/bulk', customSalaryController.bulkUpload);
        // this.customSalaryRoutes.post('/update-custom-details', customSalaryController.updateCustomDetails);
        this.customSalaryRoutes.get('/employees-custom-details', customSalaryController.getEmployeeCustomDetails);
        this.customSalaryRoutes.post('/employees-custom-details', customSalaryController.postCustomDetails);
        this.customSalaryRoutes.get('/org-custum-details', customSalaryController.getEmployeeCustomDetails);
        this.customSalaryRoutes.get('/org-components', customSalaryController.getOrgComponents);
        this.customSalaryRoutes.post('/org-components', customSalaryController.postOrgComponents);
    }

    getRouters() {
        return this.customSalaryRoutes;
    }
}

module.exports = CustomSalaryRoutes;