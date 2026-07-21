const router = require('express').Router();

const Dashboard = require('./Dashboard.controller');
const {APIRateLimiter} = require("./OneMinRate.middleware");

class DashboardRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/employees', Dashboard.getEmployees);
        this.myRoutes.get('/workForce-validate',Dashboard.projManageVal);
        this.myRoutes.get('/employees_old', Dashboard.getEmployees_old);
        this.myRoutes.get('/productivity/employee', Dashboard.getEmployeeProductivity);
        this.myRoutes.get('/productivity/location', Dashboard.getLocationProductivity);
        this.myRoutes.get('/productivity/department', Dashboard.getDepartmentProductivity);
        this.myRoutes.get('/productivity/organization', Dashboard.getOrganizationProductivity);
        this.myRoutes.get('/active-days', Dashboard.getActiveDays);

        // new Dashboard
        this.myRoutes.get('/top-app-web', Dashboard.getTopAppWeb);
        this.myRoutes.get('/performance', Dashboard.getPerformance);
        this.myRoutes.get('/productive-and-nonproductive', Dashboard.getProductiveAndNonProductive);
        this.myRoutes.get('/activity-breakdown', Dashboard.getActivityBreakdown);
        this.myRoutes.get('/get-ideal-user-details', Dashboard.getIdealUserDetails);
        this.myRoutes.post('/get-web-app-activity-productive-employees', Dashboard.getWebAppActivities);
        this.myRoutes.post('/get-web-app', Dashboard.getWebApps);

        // Get Employees with rate Limit routes start here
        this.myRoutes.get('/employees-status', Dashboard.getEmployeesRateLimit);
        this.myRoutes.get('/employees-stats', Dashboard.getEmployeesRateLimit);
        // Get Employees with rate Limit routes end here
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = DashboardRoutes;