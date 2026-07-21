const router = require('express').Router();

const TimeSheetController = require('./Timesheet.controller');
const { APIRateLimiter } = require("./ThirtyMinRate.middleware")

class TimeSheetRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/', TimeSheetController.getTimesheet);
        this.myRoutes.get('/timesheet', TimeSheetController.getTimesheetData);
        this.myRoutes.get('/details', TimeSheetController.getEmployeeTimesheetBreakUp);
        this.myRoutes.get('/getUnProductiveEmployees', TimeSheetController.getUnProductiveEmployees);
        // Get Timesheet with rate Limit routes start here
        this.myRoutes.get('/employee-timesheet', TimeSheetController.getTimesheetDataCustom);
        this.myRoutes.get('/employee-timesheet-details', TimeSheetController.getTimesheetDataCustom);
        // Get Timesheet with rate Limit routes ends here

        this.myRoutes.get('/active-time-attendance', TimeSheetController.getActiveTimeAttendance);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = TimeSheetRoutes;