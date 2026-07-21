'use strict';

const router = require('express').Router();
const Employee = require('./ApiController');
const EmployeReports = require('../../reports/employee/EmployeeReports.controller')
class EmployeeRouter {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // this.myRoutes.post('/admin', auth.adminAuth);
        this.myRoutes.get('/employees', Employee.getEpmloyees);
        this.myRoutes.get('/applications', Employee.getApplications);
        this.myRoutes.post('/developer-reports', Employee.getDeveloperAppReports);
        this.myRoutes.get('/absent-employees', Employee.getAbsentEployeeDetails);
        this.myRoutes.post('/employee-reports', EmployeReports.getEmployeeReports);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = EmployeeRouter;