const router = require('express').Router();

const EmployeeReports = require('./employee/EmployeeReports.controller');
const ProductivityReports = require('./productivity/Productivity.controller');
const EmailReports = require('./emailreport/emailReports.controller');
const TestEmailReport = require('./emailreport/testemail/reports.controller');
const EmailActivity = require('./emailactivity/emailactivity.controller');
const ReportLogs = require('./reportLogs/ReportLogs.controller');
const ReportActivityLogController = require('./reportActivityLog/reportActivityLog.controller');
const { WebUsagesController } = require('./web-usages/WebUsages.Controller.js');

const {APIRateLimiter} = require("./employee/OneHoursRate.middleware");

class ReportRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Employees
        this.myRoutes.get('/download-options', EmployeeReports.getDownloadOptions);
        this.myRoutes.post('/employee', EmployeeReports.getEmployeeReports);
        this.myRoutes.post('/employee-report', EmployeeReports.getEmployeeReportsCustomRate);
        this.myRoutes.post('/employee-activity', EmployeeReports.getEmployeeReportsCustomRate);
        this.myRoutes.post('/employee-csv', EmployeeReports.getEmployeeReports_CSV);
        this.myRoutes.post('/employee-excel', EmployeeReports.getEmployeeReports_excel);
        this.myRoutes.post('/employee-excel-combined', EmployeeReports.getEmployeeReports_excel_combined);
        this.myRoutes.post('/employee-log', ReportLogs.getEmployeeReports);
        this.myRoutes.post('/employee-new', EmployeeReports.getEmployeeReports_new)
        this.myRoutes.post('/employee-new-csv', EmployeeReports.getEmployeeReports_new_CSV)
        this.myRoutes.post('/get-dept-rules', EmployeeReports.getDepartmentRules);
        this.myRoutes.post('/employee-appweb-usage', EmployeeReports.getAppWebUsage);
        this.myRoutes.get('/employee-appweb-cumulative-usage', EmployeeReports.getAppWebCumulativeUsage);
        this.myRoutes.get('/employee-appweb-cumulative-usage-dateWise', EmployeeReports.getAppWebCumulativeUsageDateWise);
        this.myRoutes.get('/employee-login-activity',EmployeeReports.userActivityLogin);

        // Productivity
        this.myRoutes.get('/productivity', ProductivityReports.getProductivity);
        this.myRoutes.get('/productivity-list', ProductivityReports.getProductivityList);
        this.myRoutes.get('/productivity-list-download', ProductivityReports.getProductivityListForDownload);

        // New Routes for Productivity Reports Module
        this.myRoutes.get('/productivity-new', ProductivityReports.getProductivityNew);
        this.myRoutes.get('/productivity-list-new', ProductivityReports.getProductivityListNew);
        this.myRoutes.get('/productivity-list-download-new', ProductivityReports.getProductivityListForDownloadNew);

        this.myRoutes.post('/anomaly-detection', ProductivityReports.getAnomalyDetection);

        // email report
        this.myRoutes.post('/add-report', EmailReports.createNewReport);
        this.myRoutes.post('/test-email', TestEmailReport.sendTestEmailReport);
        this.myRoutes.get('/reports', EmailReports.getReports);
        this.myRoutes.get('/report', EmailReports.reportsingle);
        this.myRoutes.put('/edit-report', EmailReports.editReport);
        this.myRoutes.delete('/delete-reports', EmailReports.deleteReports);
        this.myRoutes.get('/unsubscribe', EmailReports.unSubscribe);

        //Email activity report
        this.myRoutes.get('/get-emails', EmailActivity.getMails);
        this.myRoutes.get('/email-client-types', EmailActivity.getUnicClients);
        this.myRoutes.get('/emails-report-graph', EmailActivity.emailDataGraph);

        //report activity log routes
        this.myRoutes.get('/get-activity-logs', ReportActivityLogController.getActivityLogs);

        // web user activity
        this.myRoutes.post('/user-web-usages', WebUsagesController.getWebUsages);
        this.myRoutes.post('/web-usages-user-list', WebUsagesController.getAppUsedUserList);
        this.myRoutes.post('/web-usages-weekly', WebUsagesController.getUserWeeklyApplicationUsage);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = ReportRoutes;