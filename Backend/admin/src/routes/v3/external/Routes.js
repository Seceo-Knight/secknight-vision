const router = require('express').Router();
const ExternalController = require('./External.controller');

const rateLimit = require('express-rate-limit');

const apiRateLimitAutoOne = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 min in milliseconds
    max: 1,
    message: "You have reached maximum retries. Please try again after 5 minutes",
    statusCode: 429,
    headers: true,
});

class ExternalRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        /* Tele-work Client API Routes */
        this.myRoutes.get('/get-data-teleworks', ExternalController.getTeleWorksData);
        this.myRoutes.post('/add-token-teleworks', ExternalController.addTokenTeleWorksData);
        this.myRoutes.get('/get-token-teleworks', ExternalController.getTokenTeleWorksData);
        this.myRoutes.get('/get-assigned-employee-manager', ExternalController.getAssignedEmployeeManager);
        this.myRoutes.get('/get-non-admin-list', ExternalController.getNonAdminList);
        this.myRoutes.post('/assigned-to-employee', ExternalController.assignToEmployee);
        this.myRoutes.delete('/delete-assigned-employees', ExternalController.deleteAssignedEmployees);
        this.myRoutes.post('/assign-employee-reseller', ExternalController.assignEmployeeReseller);
        this.myRoutes.get('/get-assign-employee-reseller', ExternalController.getAssignedEmployeeReseller);
        this.myRoutes.delete('/delete-assign-employee-reseller', ExternalController.removedAssignedEmployeeReseller);
        this.myRoutes.get('/get-employee-assigned-company', ExternalController.getEmployeeCompany);
        this.myRoutes.get('/timesheet-data', ExternalController.getTimesheetData);
        this.myRoutes.get('/all-employee', ExternalController.getAllEmployee);

        this.myRoutes.get('/get-employee-statistics', ExternalController.getEmployeeStatistics);
        this.myRoutes.get('/get-manager-statistics', ExternalController.getManagerStatistics);


        /* API Route for SMS AND LATE LOGIN ALERT CLIENT */
        this.myRoutes.post("/update-status", ExternalController.updateStatusCustom);
        this.myRoutes.get("/get-update-status", ExternalController.getStatusCustom);

        /* API Route for SMS AND LATE LOGIN ALERT CLIENT */
        this.myRoutes.post("/add-on-prem-domain", ExternalController.addOnPremDomain);
        this.myRoutes.post("/add-env-on-premsie", ExternalController.addOnPremEnvs);
        this.myRoutes.get("/fetch-env-on-premsie", ExternalController.fetchEnvs);

        /*Auto One Client API Routes for custom mobile web usage */
        this.myRoutes.get('/get-web-usage', ExternalController.getWebUsage);
        this.myRoutes.post('/add-web-usage', apiRateLimitAutoOne, ExternalController.addWebUsage);

    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = ExternalRoutes;