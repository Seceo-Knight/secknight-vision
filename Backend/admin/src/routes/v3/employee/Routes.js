const router = require('express').Router();

const EmployeeController = require('./Employee.controller');
const PermissionsMiddleware = require('../permissions/permission.middlewares');

class EmployeeRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/browser-history', EmployeeController.getBrowserHistory);
        this.myRoutes.get('/applications', EmployeeController.getApplicationsUsed);
        this.myRoutes.get('/browser-usage', EmployeeController.getBrowserHistoryCustom);
        this.myRoutes.get('/applications-usage', EmployeeController.getApplicationsUsedCustom);
        this.myRoutes.get('/app-web-combined', EmployeeController.getAppWebUsedCombined);
        this.myRoutes.get('/keystrokes', EmployeeController.getKeyStrokes);
        this.myRoutes.get('/attendance-sheet', EmployeeController.getEmployeesAttendanceSheet);
        this.myRoutes.get('/attendance', EmployeeController.getEmployeesAttendance);
        this.myRoutes.get('/url-analysis', EmployeeController.urlPrediction);
        this.myRoutes.get('/convesation-classification', EmployeeController.conversationClassification);
        this.myRoutes.get('/get-sentimental-data', EmployeeController.getSentimentalAnalysisData);
        this.myRoutes.get('/category-connection', EmployeeController.getUrlCannectionCategory)
        this.myRoutes.get('/get-employee-insights', EmployeeController.getEmployeeInsights)
        this.myRoutes.get('/get-employee-room-id', EmployeeController.getEmployeeRoomId);
        this.myRoutes.get('/keystrokes-data', EmployeeController.getKeyStrokesData);
        this.myRoutes.get("/employee-geolocation-logs", EmployeeController.getEmployeeGeolocationLogs);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = EmployeeRoutes;