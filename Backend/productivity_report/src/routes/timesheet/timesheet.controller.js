'use strict';

const moment = require('moment');
const TimeSheetModel = require('./timesheet.model');
const TimeSheetValidator = require('./timesheet.validation');
const sendResponse = require('../../utils/myService').sendResponse;

class TimeSheetController {
    getUserAttendanceBasedOnLocationDepartment_old(req, res) {
        var validate = TimeSheetValidator.fetchUserParams(
            req.body.location_id, req.body.department_id,
            req.body.start_date, req.body.end_date, req.body.user_id
        );

        if (validate.error) {
            return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        }
        const admin_id = req['decoded'].jsonData.admin_id;

        let { location_id, department_id, user_id, start_date, end_date } = req.body;
        start_date = moment(start_date).format('YYYY-MM-DD');
        end_date = moment(end_date).format('YYYY-MM-DD');

        TimeSheetModel.getAttendanceUsingFilter(parseInt(admin_id), parseInt(location_id), parseInt(department_id), parseInt(user_id), start_date, end_date, (userErr, userData) => {
            if (userErr) return sendResponse(res, 400, null, 'User error', userErr);
            else if (userData.length === 0) return sendResponse(res, 400, null, 'Employees\'s log data not found !', null);
            else {
                return sendResponse(res, 200, { user_data: userData, }, 'User data', null);
            }
        });
    }
    async getUserAttendanceBasedOnLocationDepartment(req, res) {
        var validate = TimeSheetValidator.fetchUserParams(
            req.body.location_id, req.body.department_id,
            req.body.start_date, req.body.end_date, req.body.user_id
        );

        if (validate.error) {
            return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        }
        const admin_id = req['decoded'].jsonData.admin_id;

        let { location_id, department_id, user_id, start_date, end_date } = req.body;
        start_date = moment(start_date).format('YYYY-MM-DD');
        end_date = moment(end_date).format('YYYY-MM-DD');
        try {

            let promiseArr = [
                TimeSheetModel.getAttendanceUsingFilter(parseInt(admin_id), parseInt(location_id), parseInt(department_id), parseInt(user_id), start_date, end_date),
                TimeSheetModel.GetProductivityData(parseInt(admin_id), parseInt(location_id), parseInt(department_id), parseInt(user_id), start_date, end_date),
            ];
            let [userData, productivity] = await Promise.all(promiseArr);
            if (userData.length === 0) return sendResponse(res, 400, null, 'Employees\'s log data not found !', null);
            let op = userData.map((e, i) => {
                let temp = productivity.find(element => (element.date === moment(e.date).format('YYYY-MM-DD') && element.employee_id === e.id))
                if (temp) {
                    e.productive_duration = temp.productive_duration;
                    e.non_productive_duration = temp.non_productive_duration;
                    e.neutral_duration = temp.neutral_duration;
                    e.idle_duration = temp.idle_duration;
                    e.break_duration = temp.break_duration;
                } else {
                    e.productive_duration = 0;
                    e.non_productive_duration = 0;
                    e.neutral_duration = 0;
                    e.idle_duration = 0;
                    e.break_duration = 0;
                }
                var time1 = moment(e.start_time);
                var time2 = moment(e.end_time);
                e.total_time = time2.diff(time1, 'seconds');
                e.productivity = (e.productive_duration / e.total_time) * 100;
                return e;
            })

            return sendResponse(res, 200, { user_data: userData, }, 'User data', null);

        } catch (err) {
            console.log('=========', err);
            return sendResponse(res, 400, null, 'User error', err);
        }
    }

    getUserTimeSheetBreakUp(req, res) {
        var validate = TimeSheetValidator.fetchTimesheetBreakupParams(req.body);

        if (validate.error) {
            return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        }

        let { attendance_id } = req.body;

        TimeSheetModel.getTimeSheetDetails(attendance_id, (timesheetErr, timesheetData) => {
            if (timesheetErr) return sendResponse(res, 400, null, 'User error', timesheetErr);
            else if (timesheetData.length === 0) return sendResponse(res, 400, null, 'Employees\'s log data not found !', null);
            else {
                return sendResponse(res, 200, { user_data: timesheetData, }, 'User data', null);
            }
        });
    }
}

module.exports = new TimeSheetController;