const _ = require("underscore");
const Moment = require("moment-timezone");
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const AttendanceValidator = require('./attendance.validation');
const attendanceModel = require('./attendance.model');
const LeaveModel = require('../leave/leave.model');
const HolidayModel = require('../holiday/holiday.model');
const AttendanceHelper = require('./attendance.helper');
const { PfService } = require('../payroll/advancesettings/pfandesisettings/pfsettings/pf.service');
const sendResponse = require('../../../../utils/myService').sendResponse;
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { attendanceMessages } = require("../../../../utils/helpers/LanguageTranslate");
const { timesByDate } = require('./shift.utils');
const { getRemainingLeaves } = require('../leave/leave.controller');
const MANUAL_ATTENDANCE_ENABLED = 1;
const { logger: Logger } = require('../../../../../../admin/src/logger/Logger');
class AttendanceController extends AttendanceHelper {

    /**
    * Get attendance
    *
    * @function getAttendance
    * @memberof  AttendanceController
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    getAttendance = async (req, res) => {
        let { employee_id: loginEmployeeID, is_employee, organization_id, role_id: roleId, language } = req.decoded;
        try {
            let { location_id, department_id, role_id, date, name, sortOrder, sortColumn, skip, limit, status, employee_type, employee_id, start_date, end_date } = req.query;
            
            //if start_date & end_date are not given,then evaluating them according to given month
            if (typeof start_date == "undefined" && typeof end_date == 'undefined') {
                start_date = moment.utc(date, 'YYYYMM').startOf('month');
                end_date = start_date.clone().endOf('month');
                start_date = start_date.toISOString().split("T")[0];
                end_date = end_date.toISOString().split("T")[0];
            }
            const to_assigned_id = null;
            let non_adminID = null;

            if (is_employee) employee_id = loginEmployeeID && loginEmployeeID != 0 ? loginEmployeeID : employee_id;
            else non_adminID = loginEmployeeID;

            is_employee = employee_id && employee_id != 0 ? true : is_employee;
            if (!is_employee) employee_id = loginEmployeeID && loginEmployeeID != 0 ? loginEmployeeID : employee_id;

            if (name && name.length < 3) return sendResponse(res, 400, null, translate(attendanceMessages, "3", language), null);
        
            const { value, error } = AttendanceValidator.userValidation({ department_id, location_id, role_id, name, sortOrder, sortColumn, status, employee_type, employee_id, start_date, end_date });
            if (error) return sendResponse(res, 404, null, translate(attendanceMessages, "2", language), error.details[0].message);


            const { column, order } = this.sortAndSearch(sortOrder, sortColumn);

            let employees = await attendanceModel.userList(organization_id, location_id, department_id, role_id, name, skip, limit, employee_id, column, order, status, is_employee, value.employee_type, roleId, end_date, non_adminID);
            
            if (employees.length === 0) return sendResponse(res, 400, null, translate(attendanceMessages, "4", language), null);
            
            if (is_employee && employees[0].date_join !== null) {
                if (employees[0].date_join.toISOString().slice(0, 10) > `${moment(end_date).format("YYYY-MM-DD")}`) {
                   return sendResponse(res, 400, null, translate(attendanceMessages, "NO_DATA", language), null);
                }
            }
            


            let attendanceHours = await attendanceModel.getAttendanceHours("attendance_hours", organization_id);

            if (attendanceHours.length > 0) {
                const value = JSON.parse(attendanceHours[0].value);
                attendanceHours[0].value = Number(value.values);
                attendanceHours[0].type = Number(value.type);
                attendanceHours[0].manual_hours = value.manual_hours ? Number(value.manual_hours) : 0;
                let attendance_colors = attendanceHours[0].attendance_colors ? JSON.parse(attendanceHours[0].attendance_colors) : null;
                delete attendanceHours[0].attendance_colors;
                employees = employees.map(x => ({ ...x, attendance_colors }));
            }

            let manualEmps = [0], setupEmps = [0];
            // if (attendanceHours && attendanceHours[0].type != 4) {
        
            employees.map(x => {
                if (x.manual_clock_in == 1) manualEmps.push(x.id)
                else setupEmps.push(x.id)
            });
            // }

            const settings = await PfService.getOrgPFSettings(organization_id);
            const employee_ids = _.unique(_.pluck(employees, "id"));

            const employee_leaves = await LeaveModel.getLeaveByEmployee(employee_ids, moment(start_date).format("YYYY-MM%"), organization_id);


            let attendance = await attendanceModel.getAttendance(start_date, end_date, employee_ids, organization_id);

            let timesheet = await attendanceModel.getTimesheet(start_date, end_date, setupEmps, attendanceHours[0]?.type, organization_id);

            timesheet = timesheet.concat(await attendanceModel.getManualTimesheet(start_date, end_date, manualEmps, organization_id));
            employees = this.MatchEmployee(employees, attendance, settings, employee_leaves);

            let range = this.dateRange(new Date(start_date), new Date(end_date));
            range = range.map(date => date.toISOString().slice(0, 10));

            const [holidays, requestAttendance, employeeShifts] = await Promise.all([
                HolidayModel.getHolidayList(organization_id),
                attendanceModel.getRequestStatus(employee_ids, organization_id, start_date, end_date),
                attendanceModel.getEmployeeShifts(employee_ids, organization_id, start_date)
            ]);
            employees = this.AttendanceSheet(employees, range, attendanceHours, employee_leaves, holidays, timesheet, requestAttendance, employeeShifts);

            employees.total_count = this.total_count;
            if (employees.length > 0) return sendResponse(res, 200, employees, translate(attendanceMessages, "5", language), null);

            return sendResponse(res, 400, null, translate(attendanceMessages, "6", language), null);
        } catch (err) {
            Logger.error(`>>>>>>>>>> attendance selected orgId ${organization_id}>>>>>>>>>> Error ${err}>>>>>>>>`)
            return sendResponse(res, 400, null, translate(attendanceMessages, "7", language), err);
        }
    }
    

    getAttendanceFieldTracking = async (req, res) => {
        let language = 'en';
        try {
            let { location_id, department_id, role_id, date, name, sortOrder, sortColumn, skip, limit, status, employee_type, employee_id, start_date, end_date, organization_id, is_employee, loginEmployeeID, roleId } = req.body;
            
            //if start_date & end_date are not given,then evaluating them according to given month
            if (typeof start_date == "undefined" && typeof end_date == 'undefined') {
                start_date = moment.utc(date, 'YYYYMM').startOf('month');
                end_date = start_date.clone().endOf('month');
                start_date = start_date.toISOString().split("T")[0];
                end_date = end_date.toISOString().split("T")[0];
            }
            const to_assigned_id = null;
            let non_adminID = null;

            if (is_employee) employee_id = loginEmployeeID && loginEmployeeID != 0 ? loginEmployeeID : employee_id;
            else non_adminID = loginEmployeeID;

            is_employee = employee_id && employee_id != 0 ? true : is_employee;
            if (!is_employee) employee_id = loginEmployeeID && loginEmployeeID != 0 ? loginEmployeeID : employee_id;

            if (name && name.length < 3) return sendResponse(res, 400, null, translate(attendanceMessages, "3", language), null);
        
            const { value, error } = AttendanceValidator.userValidation({ department_id, location_id, role_id, name, sortOrder, sortColumn, status, employee_type, employee_id, start_date, end_date });
            if (error) return sendResponse(res, 404, null, translate(attendanceMessages, "2", language), error.details[0].message);


            const { column, order } = this.sortAndSearch(sortOrder, sortColumn);

            let employees = await attendanceModel.userList(organization_id, location_id, department_id, role_id, name, skip, limit, employee_id, column, order, status, is_employee, value.employee_type, roleId, end_date, non_adminID);
            
            if (employees.length === 0) return sendResponse(res, 400, null, translate(attendanceMessages, "4", language), null);
            
            if (is_employee && employees[0].date_join !== null) {
                if (employees[0].date_join.toISOString().slice(0, 10) > `${moment(end_date).format("YYYY-MM-DD")}`) {
                   return sendResponse(res, 400, null, translate(attendanceMessages, "NO_DATA", language), null);
                }
            }
            


            let attendanceHours = await attendanceModel.getAttendanceHours("attendance_hours", organization_id);

            if (attendanceHours.length > 0) {
                const value = JSON.parse(attendanceHours[0].value);
                attendanceHours[0].value = Number(value.values);
                attendanceHours[0].type = Number(value.type);
                attendanceHours[0].manual_hours = value.manual_hours ? Number(value.manual_hours) : 0;
                let attendance_colors = attendanceHours[0].attendance_colors ? JSON.parse(attendanceHours[0].attendance_colors) : null;
                delete attendanceHours[0].attendance_colors;
                employees = employees.map(x => ({ ...x, attendance_colors }));
            }

            let manualEmps = [0], setupEmps = [0];
            // if (attendanceHours && attendanceHours[0].type != 4) {
        
            employees.map(x => {
                if (x.manual_clock_in == 1) manualEmps.push(x.id)
                else setupEmps.push(x.id)
            });
            // }

            const settings = await PfService.getOrgPFSettings(organization_id);
            const employee_ids = _.unique(_.pluck(employees, "id"));

            const employee_leaves = await LeaveModel.getLeaveByEmployee(employee_ids, moment(start_date).format("YYYY-MM%"), organization_id);


            let attendance = await attendanceModel.getAttendance(start_date, end_date, employee_ids, organization_id);

            let timesheet = await attendanceModel.getTimesheet(start_date, end_date, setupEmps, attendanceHours[0]?.type, organization_id);

            timesheet = timesheet.concat(await attendanceModel.getManualTimesheet(start_date, end_date, manualEmps, organization_id));
            employees = this.MatchEmployee(employees, attendance, settings, employee_leaves);

            let range = this.dateRange(new Date(start_date), new Date(end_date));
            range = range.map(date => date.toISOString().slice(0, 10));

            const [holidays, requestAttendance, employeeShifts] = await Promise.all([
                HolidayModel.getHolidayList(organization_id),
                attendanceModel.getRequestStatus(employee_ids, organization_id, start_date, end_date),
                attendanceModel.getEmployeeShifts(employee_ids, organization_id, start_date)
            ]);
            employees = this.AttendanceSheet(employees, range, attendanceHours, employee_leaves, holidays, timesheet, requestAttendance, employeeShifts);

            employees.total_count = this.total_count;
            if (employees.length > 0) return sendResponse(res, 200, employees, translate(attendanceMessages, "5", language), null);

            return sendResponse(res, 400, null, translate(attendanceMessages, "6", language), null);
        } catch (err) { 
            Logger.error(`>>>>>>>>>> attendance selected orgId ${organization_id}>>>>>>>>>> Error ${err}>>>>>>>>`)
            return sendResponse(res, 400, null, translate(attendanceMessages, "7", language), err);
        }
    }

    /**
     * Get Attendance Custom API only used by CronsJobs & Auto Email Report Test Mail
     * @param {*} req 
     * @param {*} res 
     * @returns {} success
     */
    getAttendanceCustom = async (req, res) => {
        let language = "en";
        try {
            let { location_id, department_id, role_id, date, name, sortOrder, sortColumn, skip, limit, status, employee_type, employee_id, start_date, end_date, organization_id  } = req.query;
            //if start_date & end_date are not given,then evaluating them according to given month
            if (typeof start_date == "undefined" && typeof end_date == 'undefined') {
                start_date = moment.utc(date, 'YYYYMM').startOf('month');
                end_date = start_date.clone().endOf('month');
                start_date = start_date.toISOString().split("T")[0];
                end_date = end_date.toISOString().split("T")[0];
            }
            const to_assigned_id = null;
            let non_adminID = null;

            if (name && name.length < 3) return sendResponse(res, 400, null, translate(attendanceMessages, "3", language), null);
        
            const { value, error } = AttendanceValidator.userValidation({ department_id, location_id, role_id, name, sortOrder, sortColumn, status, employee_type, employee_id, start_date, end_date });
            if (error) return sendResponse(res, 404, null, translate(attendanceMessages, "2", language), error.details[0].message);

            const { column, order } = this.sortAndSearch(sortOrder, sortColumn);

            let employees = await attendanceModel.userList(organization_id, location_id, department_id, role_id, name, skip, limit, employee_id, column, order, status, false, value.employee_type, 0, end_date, non_adminID);

            if (employees.length === 0) return sendResponse(res, 400, null, translate(attendanceMessages, "4", language), null);

            let attendanceHours = await attendanceModel.getAttendanceHours("attendance_hours", organization_id);

            if (attendanceHours.length > 0) {
                const value = JSON.parse(attendanceHours[0].value);
                attendanceHours[0].value = Number(value.values);
                attendanceHours[0].type = Number(value.type);
                attendanceHours[0].manual_hours = value.manual_hours ? Number(value.manual_hours) : 0;
                let attendance_colors = attendanceHours[0].attendance_colors ? JSON.parse(attendanceHours[0].attendance_colors) : null;
                delete attendanceHours[0].attendance_colors;
                employees = employees.map(x => ({ ...x, attendance_colors }));
            }

            let manualEmps = [0], setupEmps = [0];
            // if (attendanceHours && attendanceHours[0].type != 4) {
        
            employees.map(x => {
                if (x.manual_clock_in == 1) manualEmps.push(x.id)
                else setupEmps.push(x.id)
            });
            // }

            const settings = await PfService.getOrgPFSettings(organization_id);
            const employee_ids = _.unique(_.pluck(employees, "id"));

            const employee_leaves = await LeaveModel.getLeaveByEmployee(employee_ids, moment(start_date).format("YYYY-MM%"), organization_id);

            let attendance = await attendanceModel.getAttendance(start_date, end_date, employee_ids, organization_id);

            let timesheet = await attendanceModel.getTimesheet(start_date, end_date, setupEmps, attendanceHours[0].type, organization_id);

            timesheet = timesheet.concat(await attendanceModel.getManualTimesheet(start_date, end_date, manualEmps, organization_id));
            employees = this.MatchEmployee(employees, attendance, settings, employee_leaves);

            let range = this.dateRange(new Date(start_date), new Date(end_date));
            range = range.map(date => date.toISOString().slice(0, 10));

            const [holidays, requestAttendance, employeeShifts] = await Promise.all([
                HolidayModel.getHolidayList(organization_id),
                attendanceModel.getRequestStatus(employee_ids, organization_id, start_date, end_date),
                attendanceModel.getEmployeeShifts(employee_ids, organization_id, start_date)
            ]);
            employees = this.AttendanceSheet(employees, range, attendanceHours, employee_leaves, holidays, timesheet, requestAttendance, employeeShifts);

            employees.total_count = this.total_count;
            if (employees.length > 0) return sendResponse(res, 200, employees, translate(attendanceMessages, "5", language), null);

            return sendResponse(res, 400, null, translate(attendanceMessages, "6", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "7", language), err);
        }
    }

    getAttendanceField = async (req, res) => {
        let language = "en";
        try {
            let { date, name, sortOrder, sortColumn, location_id, department_id,skip,limit,status,role_id, employee_type, employee_id, start_date, end_date, organization_id  } = req.body;
            //if start_date & end_date are not given,then evaluating them according to given month
            if (typeof start_date == "undefined" && typeof end_date == 'undefined') {
                start_date = moment.utc(date, 'YYYYMM').startOf('month');
                end_date = start_date.clone().endOf('month');
                start_date = start_date.toISOString().split("T")[0];
                end_date = end_date.toISOString().split("T")[0];
            }
            const to_assigned_id = null;
            let non_adminID = null;
            if (name && name.length < 3) return sendResponse(res, 400, null, translate(attendanceMessages, "3", language), null);
        
            const { value, error } = AttendanceValidator.userValidation({ department_id, location_id, role_id, name, sortOrder, sortColumn, status, employee_type, employee_id, start_date, end_date });
            if (error) return sendResponse(res, 404, null, translate(attendanceMessages, "2", language), error.details[0].message);
            const { column, order } = this.sortAndSearch(sortOrder, sortColumn);
            let employees = await attendanceModel.userList(organization_id, location_id, department_id, role_id, name, skip, limit, employee_id, column, order, status, true, value.employee_type, 0, end_date, non_adminID);
            
            if (employees.length === 0) return sendResponse(res, 400, null, translate(attendanceMessages, "4", language), null);
            let attendanceHours = await attendanceModel.getAttendanceHours("attendance_hours", organization_id);
            if (attendanceHours.length > 0) {
                const value = JSON.parse(attendanceHours[0].value);
                attendanceHours[0].value = Number(value.values);
                attendanceHours[0].type = Number(value.type);
                attendanceHours[0].manual_hours = value.manual_hours ? Number(value.manual_hours) : 0;
                let attendance_colors = attendanceHours[0].attendance_colors ? JSON.parse(attendanceHours[0].attendance_colors) : null;
                delete attendanceHours[0].attendance_colors;
                employees = employees.map(x => ({ ...x, attendance_colors }));
            }
            let manualEmps = [0], setupEmps = [0];
        
            employees.map(x => {
                if (x.manual_clock_in == 1) manualEmps.push(x.id)
                else setupEmps.push(x.id)
            });
            const settings = await PfService.getOrgPFSettings(organization_id);
            const employee_ids = _.unique(_.pluck(employees, "id"));
            const employee_leaves = await LeaveModel.getLeaveByEmployee(employee_ids, moment(start_date).format("YYYY-MM%"), organization_id);
            let attendance = await attendanceModel.getAttendance(start_date, end_date, employee_ids, organization_id);
            let timesheet = await attendanceModel.getTimesheet(start_date, end_date, setupEmps, attendanceHours[0].type, organization_id);
            timesheet = timesheet.concat(await attendanceModel.getManualTimesheet(start_date, end_date, manualEmps, organization_id));
            employees = this.MatchEmployee(employees, attendance, settings, employee_leaves);
            let range = this.dateRange(new Date(start_date), new Date(end_date));
            range = range.map(date => date.toISOString().slice(0, 10));
            const [holidays, requestAttendance, employeeShifts] = await Promise.all([
                HolidayModel.getHolidayList(organization_id),
                attendanceModel.getRequestStatus(employee_ids, organization_id, start_date, end_date),
                attendanceModel.getEmployeeShifts(employee_ids, organization_id, start_date)
            ]);
            employees = this.AttendanceSheet(employees, range, attendanceHours, employee_leaves, holidays, timesheet, requestAttendance, employeeShifts);
            employees.total_count = this.total_count;
            if (employees.length > 0) return sendResponse(res, 200, employees, translate(attendanceMessages, "5", language), null);
            return sendResponse(res, 400, null, translate(attendanceMessages, "6", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "7", language), err);
        }
    }

    /**
     * Manually Overrides Attendance
     * Status  - (1 => Present, 2 => Absent, 3 => Half-Day, 4 => Leave, 
     * 5 => Week-off, 6 => Half-Day-Leave/Present, 7 => Half-Day-Leave/Absent)
     * @param {*} req 
     * @param {*} res 
     * @returns {} success
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async attendanceOverride(req, res) {
        const { organization_id, user_id, timezone, language } = req.decoded;
        try {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const { value, error } = AttendanceValidator.attendanceOverride(req.body);
            if (error) return sendResponse(res, 400, null, translate(attendanceMessages, "2", language), error.details[0].message);
            value.date = moment(value.date).format('YYYY-MM-DD');
            let { employee_id, date, leave_id, status } = value;

            /** If requested for current/upcoming day */
            if (moment(date).tz(timezone).isSameOrAfter(moment().tz(timezone), 'day')) return sendResponse(res, 400, null, 'Not allowed to override attendance for today/upcoming dates', null);

            /** Get attendance and leave taken data */
            let [[type_data], leave_taken] = await Promise.all([
                attendanceModel.attendanceSettings(organization_id, employee_id),
                attendanceModel.getEmployeeLeave(organization_id, employee_id, date)
            ]);
            let [data] = await attendanceModel.checkAttendance(organization_id, employee_id, date, type_data);
            let details = data?.details ? JSON.parse(data.details) : "";


            /** If leave overridden then check leave id given */
            let leave = null;
            if (leave_id) {
                [leave] = await attendanceModel.getLeave(leave_id, organization_id);
                if (!leave) return sendResponse(res, 400, null, 'Wrong Leave ID.', null);
            }


            /** If leave taken on the given date */
            if (leave_taken.length) {
                for (let i = 0; i < leave_taken.length; i++) {
                    let day_type = leave_taken[i].day_type;
                    let day_status = leave_taken[i].day_status ? JSON.parse(leave_taken[i].day_status) : [];
                    day_status = day_status.find(x => moment(x.date).format("YYYY-MM-DD") == moment(date).format("YYYY-MM-DD"))?.status || 0;


                    /** If Leave accepted then get no of leaves remaining */
                    let previous_org_leaves = 0;
                    if (day_status == 1) {
                        let { total_org_leaves, total_annual_accepted } = await getRemainingLeaves(leave_taken[i].leave_type, employee_id, organization_id);
                        previous_org_leaves = total_org_leaves > total_annual_accepted ? (total_org_leaves - total_annual_accepted) : 0;
                    }

                    /** Delete if leave is taken */
                    if (
                        [1, 3].includes(leave_taken[i].day_type) ||
                        (+leave_taken[i].number_of_days <= 1)
                    ) await attendanceModel.deleteLeave(leave_taken[i].id);

                    else if (+leave_taken[i].number_of_days > 1) {
                        leave_taken[i].day_status = leave_taken[i].day_status ? JSON.parse(leave_taken[i].day_status) : [];
                        leave_taken[i].day_status = leave_taken[i].day_status.filter(x => moment(x.date).format("YYYY-MM-DD") != moment(date).format("YYYY-MM-DD"));
                        leave_taken[i].day_status = JSON.stringify(leave_taken[i].day_status);
                        await attendanceModel.updateLeave(leave_taken[i]);
                    }

                    /** If Leave accepted then add extra leave to no of leaves remaining */
                    if (day_status == 1) {
                        let leave_to_add = day_type == 2 ? 1 : 0.5;
                        let { total_org_leaves, total_annual_accepted, overridden_data } = await getRemainingLeaves(leave_taken[i].leave_type, employee_id, organization_id);
                        let org_leaves = total_org_leaves > total_annual_accepted ? total_org_leaves - total_annual_accepted : 0;
                        if (org_leaves <= previous_org_leaves) {
                            overridden_data[overridden_data.findIndex(x => x.leave_id == leave_taken[i].leave_type)].no_of_leaves += leave_to_add;
                            let update_overridden_leave = await attendanceModel.updateEmployeeLeave([JSON.stringify(overridden_data), employee_id]);
                            if (!update_overridden_leave.affectedRows) return sendResponse(res, 400, null, "SOMETHING_WENT_WRONG", null);
                        }
                    }
                }
            }


            /** If attendance requested on given date */
            if (details?.request_status) details.request_status = 2;


            /** If leave overridden then create leave for that day */
            if ([4, 6, 7].includes(status)) {
                let leave_to_take = status == 4 ? 1 : 0.5;
                let day_type = status == 4 ? 2 : 3;

                let { total_org_leaves, total_annual_accepted, overridden_leaves, overridden_data } = await getRemainingLeaves(leave_id, employee_id, organization_id);

                if (total_annual_accepted >= total_org_leaves && overridden_leaves < leave_to_take) return sendResponse(res, 400, null, "Employee don't have leave remaining with this leave type.", null);

                if (total_annual_accepted > total_org_leaves && overridden_leaves >= leave_to_take) {
                    overridden_data[overridden_data.findIndex(x => x.leave_id == leave_id)].no_of_leaves -= leave_to_take;
                    let update_overridden_leave = await attendanceModel.updateEmployeeLeave([JSON.stringify(overridden_data), employee_id])
                    if (!update_overridden_leave.affectedRows) return sendResponse(res, 400, null, "SOMETHING_WENT_WRONG", null);
                }

                let createLeave = await attendanceModel.createLeaveOverride([employee_id, organization_id, date, date, leave_id, day_type, 1, leave_to_take, 'Overridden Leave.', `[${JSON.stringify({ date, status: '1' })}]`]);
                if (!createLeave.insertId) return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language), null);
            }


            // For creating/editing details
            // Status - (1 => Present, 2 => Absent, 3 => Half-Day, 4 => Leave, 
            // 5 => Week-off, 6 => Half-Day-Leave/Present, 7 => Half-Day-Leave/Absent)
            if (data && data.details) {
                details = JSON.parse(data.details);
                details.status = status;
                details.overriddenAttendance = true;
                details.updatedBy_IP = ip;
                if (details.status != 4 && details.leave_id) delete details.leave_id;
                if (details.status == 4) details.leave_id = leave_id;
                details = JSON.stringify(details);
            }
            else {
                details = { status };
                if (details.status == 4) details.leave_id = leave_id;
                details.overriddenAttendance = true;
                details.updatedBy_IP = ip;
                details = JSON.stringify(details);
            }

            // for creating /editing attendance
            if (data) {
                let result = await attendanceModel.addOverrideStatus(organization_id, employee_id, date, details, user_id, type_data);
                if (!result.affectedRows) return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language));
            } else {
                let result = await attendanceModel.createAttendanceOverride(organization_id, employee_id, date, details, user_id, type_data);
                if (!result.insertId) return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language));
            }
            return sendResponse(res, 200, null, translate(attendanceMessages, "1", language));
        } catch (err) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language), err);
        }
    }

    /**
     * Gives Requested attendance Data
     * @param {*} req 
     * @param {*} res
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async getRequestAttendance(req, res) {
        const { organization_id, timezone, employee_id, role_id, is_manager, is_teamlead, language } = req.decoded;
        try {
            const { value, error } = AttendanceValidator.getRequestAttendance(req.query);
            if (error) return sendResponse(res, 400, null, translate(attendanceMessages, "2", language), error.details[0].message);
            let { id, status, date, month } = value;

            if (date) date = moment(date).format('YYYY-MM-DD');
            if (month) month = moment(month).format('YYYY-MM%');

            let to_assigned_id = is_manager || is_teamlead ? employee_id : null;

            let data = await attendanceModel.getRequestAttendanceData(organization_id, { status, id, date, month, employee_id, to_assigned_id, role_id });
            if (!data.length) return sendResponse(res, 200, null, translate(attendanceMessages, "NO_DATA", language));

            data.forEach(element => {
                element.admin_timezone = timezone;
                element.details = JSON.parse(element.details);
            });

            return sendResponse(res, 200, data, translate(attendanceMessages, "1", language));
        } catch (err) {
            console.log("----------err------------", err);
            return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language), err);
        }
    }

    /**
     * Updates Request Attendance
     * Status - 1 => Approved, 2 => Rejected, 3 => Pending
     * @param {*} req 
     * @param {*} res 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async postRequestAttendance(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { value, error } = AttendanceValidator.postRequestAttendance(req.body);
            if (error) return sendResponse(res, 400, null, translate(attendanceMessages, "2", language), error.details[0].message);
            const { id, status } = value;

            let [data] = await attendanceModel.getRequestAttendanceData(organization_id, { id });
            if (!data || data.id != id || !data.details) return sendResponse(res, 200, null, "Data on ID not Found.");

            let details = JSON.parse(data.details);
            if ([1, 2].includes(Number(details.request_status))) return sendResponse(res, 200, null, `Request is already Approved/Rejected.`);

            details.request_status = status;

            let result = await attendanceModel.updateRequestAttendance(organization_id, id, status, details);
            if (result.affectedRows < 1) return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language));

            return sendResponse(res, 200, null, translate(attendanceMessages, "1", language));
        } catch (err) {
            console.log("----------err------------", err);
            return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language), err);
        }
    }

    /**
     * markAttendance - function to mark attendance for the employee
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async getMarkAttendance(req, res) {
        const { employee_id, timezone, organization_id, language } = req.decoded;
        let { shift } = req.decoded;

        if (!employee_id) return sendResponse(res, 400, null, translate(attendanceMessages, "NOT_AUTHORIZED", language), null);

        /** Getting Employee Shift */
        let [empShift] = await attendanceModel.getEmpShiftForAttendanceMark(organization_id, employee_id, moment().format("YYYY-MM-DD"));
        shift = empShift?.data ? JSON.parse(empShift.data) : shift;

        let resultData = {
            employee_id, timezone, isCheckedIn: false,
            date: moment().format('YYYY-MM-DD'), checkIn: null, checkOut: null, is_manual_clock: false
        };

        // orgGroupEmployee setting details
        const [orgGroupEmployeeTrackDetails] = await attendanceModel.getOrgGroupEmployeeTrackDetails(employee_id);
        const [orgHrmsSettings] = await attendanceModel.checkAttendanceSettings(organization_id);
        const jsonHrmsSettings = orgHrmsSettings && orgHrmsSettings.value ? JSON.parse(orgHrmsSettings.value) : {};
        // manual clock in flag from the org/emp/group settings
        if (orgGroupEmployeeTrackDetails) {
            // if (orgGroupEmployeeTrackDetails.tracking_rule_type == 1) { //organization setting applied
            //     const orgSettings = JSON.parse(orgGroupEmployeeTrackDetails.organization_rules);
            //     if (orgSettings.manual_clock_in) {
            //         resultData.is_manual_clock = true;
            //     }
            // } else if (orgGroupEmployeeTrackDetails.tracking_rule_type == 2) { // group setting applied
            //     const groupSettings = JSON.parse(orgGroupEmployeeTrackDetails.group_rules);
            //     if (groupSettings.manual_clock_in) {
            //         resultData.is_manual_clock = true;
            //     }
            // } else if (orgGroupEmployeeTrackDetails.tracking_rule_type == 3) { // employee setting applied
            const employeeSettings = JSON.parse(orgGroupEmployeeTrackDetails.custom_tracking_rule);
            if (employeeSettings.manual_clock_in || jsonHrmsSettings.type == 4) {
                resultData.is_manual_clock = true;

                let [employeeData] = await attendanceModel.getEmployeeDataBio(employee_id, organization_id);
                if (!employeeData.permission_id) resultData.is_manual_clock = true;
                if ((employeeData.manual_status || employeeData.bio_user_id) && employeeData.permission_id) {
                    employeeData.manual_status = JSON.parse(employeeData?.manual_status);
                    if (employeeData.manual_status.start_date && employeeData.manual_status.end_date) {
                        let employeeTime = Moment().tz(employeeData.timezone).format('YYYY-MM-DD');
                        let startTime = moment(employeeData.manual_status.start_date).utc().format('YYYY-MM-DD');
                        let endTime = moment(employeeData.manual_status.end_date).utc().add(24, 'hours').format('YYYY-MM-DD');
                        if (employeeData.manual_status.start_date == employeeData.manual_status.end_date && employeeTime == startTime) resultData.is_manual_clock = true;
                        else {
                            let currentTime = moment(employeeTime);
                            startTime = moment(startTime);
                            endTime = moment(endTime);
                            if (currentTime.isBetween(startTime, endTime)) resultData.is_manual_clock = true;
                            else resultData.is_manual_clock = false;
                        }
                    }
                    else if (employeeData.manual_status.custom == 'disable') resultData.is_manual_clock = false;
                    else {
                        if(employeeData.manual_status.custom === "enable") resultData.is_manual_clock = true;
                        else resultData.is_manual_clock = false;
                    }
                }
            }
            // }
        }

        // get the attendance
        const [attendanceObj] = await attendanceModel.getHrmsEmployeeAttendance(
            { employee_id, organization_id, order_col: 'date', order: 'D', limit: 1, less_then_equal_date: moment().format('YYYY-MM-DD') }
        );

        let dayShift = null;
        if (shift) {
            dayShift = await timesByDate(shift, attendanceObj ? attendanceObj.date : new Date(), timezone);
        }
        if (!attendanceObj) {
            return sendResponse(res, 200, { ...resultData, shift: dayShift }, translate(attendanceMessages, "1", language), null);
        }


        // if attendance start and end time are same 
        // then its not a complete attendance
        const attStartTime = moment(attendanceObj.start_time);
        const attEndTime = moment(attendanceObj.end_time);
        const nowTz = moment();

        //getting max log out time for the employee on basic of the shift
        let maxLogoutTime = attStartTime.clone().tz(timezone).endOf('day');
        if (dayShift && dayShift.start && moment(dayShift.end).isAfter(maxLogoutTime)) {
            maxLogoutTime = dayShift.end;
        }

        const nowDate = nowTz.format('YYYY-MM-DD');
        if (attStartTime.isSame(attEndTime) || nowTz.isBefore(maxLogoutTime)) {
            if (moment(nowDate).isSame(moment(attendanceObj.date).format('YYYY-MM-DD'))) {
                resultData.date = moment(attendanceObj.date).format('YYYY-MM-DD');
            } else {
                resultData.date = moment(nowTz).clone().subtract(1, "day").format('YYYY-MM-DD');
            }
        } else {
            resultData.date = nowTz.format('YYYY-MM-DD');
        }

        // check is the user is checkin
        if (
            nowTz.isBetween(attStartTime, maxLogoutTime) ||
            (
                nowTz.isSameOrBefore(attStartTime) &&
                moment(nowDate).isSame(moment(attendanceObj ? attendanceObj.date : nowTz).format('YYYY-MM-DD'))
            )
        ) {
            resultData.isCheckedIn = true;
        }

        // if user is not checkin then send now date
        if (!resultData.isCheckedIn) {
            resultData.date = nowDate;
        }

        resultData.checkIn = attendanceObj.start_time;
        resultData.checkOut = attEndTime.isSame(attStartTime) ? null : attendanceObj.end_time;

        return sendResponse(res, 200, { ...resultData, shift: dayShift }, translate(attendanceMessages, "1", language), null);
    }

    /**
     * markAttendance - function to mark attendance for the employee
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async markAttendance(req, res) {
        const { employee_id, timezone, organization_id, language } = req.decoded;

        if (!employee_id) return sendResponse(res, 400, null, translate(attendanceMessages, "NOT_AUTHORIZED", language), null);

        const { value, error } = AttendanceValidator.postMarkAttendanceValidate(req.body);
        if (error) return sendResponse(res, 404, null, translate(attendanceMessages, "2", language), error.details[0].message);

        const { check_time, date, ip, device_os, device_type, browser, city, internet_provider, region, country, latitude, longitude, geolocation_enabled } = value;
        const startOrEndTime = moment(check_time).utc().format('YYYY-MM-DD HH:mm:ss');
        const attendanceDate = moment(date).format('YYYY-MM-DD');

        // get the attendance
        const [attendanceObj] = await attendanceModel.getHrmsEmployeeAttendance({ employee_id, organization_id, date: attendanceDate });

        if (attendanceObj && !attendanceObj.is_manual_attendance) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "NOT_AUTHORIZED", language), null);
        }

        let attendanceCreateOrUpdateStatus = null;
        let msgTime = null;

        let checkTimeMoment = moment(check_time);
        if (timezone) checkTimeMoment = checkTimeMoment.tz(timezone);

        let is_manual_clock = true;
        let [employeeData] = await attendanceModel.getEmployeeDataBio(employee_id, organization_id);
        if (!employeeData.permission_id) is_manual_clock = true;
        if (employeeData.manual_status && employeeData.bio_user_id && employeeData.permission_id) {
            employeeData.manual_status = JSON.parse(employeeData?.manual_status);
            if (employeeData.manual_status.start_date && employeeData.manual_status.end_date) {
                let employeeTime = Moment().tz(employeeData.timezone).format('YYYY-MM-DD');
                let startTime = moment(employeeData.manual_status.start_date).utc().format('YYYY-MM-DD');
                let endTime = moment(employeeData.manual_status.end_date).utc().add(24, 'hours').format('YYYY-MM-DD');
                if (employeeData.manual_status.start_date == employeeData.manual_status.end_date && employeeTime == startTime) is_manual_clock = true;
                else {
                    let currentTime = moment(employeeTime);
                    startTime = moment(startTime);
                    endTime = moment(endTime);
                    if (currentTime.isBetween(startTime, endTime)) is_manual_clock = true;
                    else is_manual_clock = false;
                }
            }
            else if (employeeData.manual_status.custom == 'disable') is_manual_clock = false;
        }
        if(is_manual_clock == false) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "NOT_AUTHORIZED", language), null);
        }

        if (attendanceObj) {
            //update the attendance end_time
            attendanceCreateOrUpdateStatus = await attendanceModel.updateHrmsAttendance({ id: attendanceObj.id }, { end_time: startOrEndTime, check_out_detail :JSON.stringify({ ip, device_os, device_type, browser, city, internet_provider, region, country, latitude, longitude, geolocation_enabled }) });
            msgTime = "Successfully Checked Out at " + checkTimeMoment.format('YYYY-MM-DD HH:mm:ss');
        } else {
            // create the attendance
            attendanceCreateOrUpdateStatus = await attendanceModel.createHrmsAttendance({
                organization_id, employee_id, date: attendanceDate,
                start_time: startOrEndTime, end_time: startOrEndTime, is_manual_attendance: MANUAL_ATTENDANCE_ENABLED,
                check_in_detail :JSON.stringify({ ip, device_os, device_type, browser, city, internet_provider, region, country, latitude, longitude, geolocation_enabled })
            });
            msgTime = "Successfully Checked In at " + checkTimeMoment.format('YYYY-MM-DD HH:mm:ss');
        }
        if (!attendanceCreateOrUpdateStatus) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language), null);
        }
        return sendResponse(res, 200, null, msgTime, null);
    }

    getAttendanceField = async (req, res) => {
        let language = "en";
        try {
            let { date, name, sortOrder, sortColumn, location_id, department_id,skip,limit,status,role_id, employee_type, employee_id, start_date, end_date, organization_id  } = req.body;
            //if start_date & end_date are not given,then evaluating them according to given month
            if (typeof start_date == "undefined" && typeof end_date == 'undefined') {
                start_date = moment.utc(date, 'YYYYMM').startOf('month');
                end_date = start_date.clone().endOf('month');
                start_date = start_date.toISOString().split("T")[0];
                end_date = end_date.toISOString().split("T")[0];
            }
            const to_assigned_id = null;
            let non_adminID = null;
            if (name && name.length < 3) return sendResponse(res, 400, null, translate(attendanceMessages, "3", language), null);
        
            const { value, error } = AttendanceValidator.userValidation({ department_id, location_id, role_id, name, sortOrder, sortColumn, status, employee_type, employee_id, start_date, end_date });
            if (error) return sendResponse(res, 404, null, translate(attendanceMessages, "2", language), error.details[0].message);
            const { column, order } = this.sortAndSearch(sortOrder, sortColumn);
            let employees = await attendanceModel.userList(organization_id, location_id, department_id, role_id, name, skip, limit, employee_id, column, order, status, true, value.employee_type, 0, end_date, non_adminID);
            
            if (employees.length === 0) return sendResponse(res, 400, null, translate(attendanceMessages, "4", language), null);
            let attendanceHours = await attendanceModel.getAttendanceHours("attendance_hours", organization_id);
            if (attendanceHours.length > 0) {
                const value = JSON.parse(attendanceHours[0].value);
                attendanceHours[0].value = Number(value.values);
                attendanceHours[0].type = Number(value.type);
                attendanceHours[0].manual_hours = value.manual_hours ? Number(value.manual_hours) : 0;
                let attendance_colors = attendanceHours[0].attendance_colors ? JSON.parse(attendanceHours[0].attendance_colors) : null;
                delete attendanceHours[0].attendance_colors;
                employees = employees.map(x => ({ ...x, attendance_colors }));
            }
            let manualEmps = [0], setupEmps = [0];
        
            employees.map(x => {
                if (x.manual_clock_in == 1) manualEmps.push(x.id)
                else setupEmps.push(x.id)
            });
            const settings = await PfService.getOrgPFSettings(organization_id);
            const employee_ids = _.unique(_.pluck(employees, "id"));
            const employee_leaves = await LeaveModel.getLeaveByEmployee(employee_ids, moment(start_date).format("YYYY-MM%"), organization_id);
            let attendance = await attendanceModel.getAttendance(start_date, end_date, employee_ids, organization_id);
            let timesheet = await attendanceModel.getTimesheet(start_date, end_date, setupEmps, attendanceHours[0].type, organization_id);
            timesheet = timesheet.concat(await attendanceModel.getManualTimesheet(start_date, end_date, manualEmps, organization_id));
            employees = this.MatchEmployee(employees, attendance, settings, employee_leaves);
            let range = this.dateRange(new Date(start_date), new Date(end_date));
            range = range.map(date => date.toISOString().slice(0, 10));
            const [holidays, requestAttendance, employeeShifts] = await Promise.all([
                HolidayModel.getHolidayList(organization_id),
                attendanceModel.getRequestStatus(employee_ids, organization_id, start_date, end_date),
                attendanceModel.getEmployeeShifts(employee_ids, organization_id, start_date)
            ]);
            employees = this.AttendanceSheet(employees, range, attendanceHours, employee_leaves, holidays, timesheet, requestAttendance, employeeShifts);
            employees.total_count = this.total_count;
            if (employees.length > 0) return sendResponse(res, 200, employees, translate(attendanceMessages, "5", language), null);
            return sendResponse(res, 400, null, translate(attendanceMessages, "6", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "7", language), err);
        }
    }

    async markAttendanceField(req, res) {
        try{
        const { employee_id, timezone, organization_id } = req.body;
        const attendanceDate = moment().format('YYYY-MM-DD');
        const [attendanceObj] = await attendanceModel.getHrmsEmployeeAttendance({ employee_id, organization_id, date: attendanceDate });
                let punchInTime = new Date();
                const startOrEndTime = moment(punchInTime).utc().format('YYYY-MM-DD HH:mm:ss');
                let punchTimeMoment = moment(punchInTime);
                if (timezone) punchTimeMoment = punchTimeMoment.tz(timezone);
                let attendanceCreateOrUpdateStatus;
                if (attendanceObj) {
                    const currentTime = moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
                    const RestricEndTime = moment(attendanceObj.start_time).toISOString();
                    let ms = moment(currentTime).diff(moment(RestricEndTime),"minutes");
                    if(ms < 60 ){
                        return sendResponse(res, 403, { time:punchTimeMoment.format('YYYY-MM-DD HH:mm:ss') }, "CheckOut Restricted", null)
                    }
                    let startTime = moment(attendanceObj.start_time);
                    let endTime = moment()
    
                    //update the attendance end_time
                    attendanceCreateOrUpdateStatus = await attendanceModel.updateHrmsAttendanceField({ id: attendanceObj.id, end_time: startOrEndTime });
                    return sendResponse(res, 200, {  time:punchTimeMoment.format('YYYY-MM-DD HH:mm:ss'), }, "Successfully Checked Out", null)
                } else {
                    // create the attendance
                    attendanceCreateOrUpdateStatus = await attendanceModel.createHrmsAttendanceField({
                        organization_id, employee_id, date: attendanceDate,
                        start_time: startOrEndTime,  is_manual_attendance: 2,
                    });
                    return sendResponse(res, 200, { time:punchTimeMoment.format('YYYY-MM-DD HH:mm:ss') }, "Successfully Checked In", null)
                }
        }catch(err){
            throw err;
        }
    }
    async fetchAttendance(req, res) {
        try{
        const { employee_id, timezone, organization_id } = req.body;
        const attendanceDate = moment().format('YYYY-MM-DD');
        const [attendanceObj] = await attendanceModel.getHrmsEmployeeAttendance({ employee_id, organization_id, date: attendanceDate });
        // if (timezone) punchTimeMoment = punchTimeMoment.tz(timezone);
        if (attendanceObj) {
            let check_in = attendanceObj.start_time ? moment(attendanceObj.start_time).tz(timezone).format("YYYY-MM-DD HH:mm:ss") : null;
            let check_out =attendanceObj.end_time ?  moment(attendanceObj.end_time).tz(timezone).format('YYYY-MM-DD HH:mm:ss') : null;
            return sendResponse(res, 200, { check_in:check_in,check_out:check_out  }, "Successfully Fetched", null)
        } else {
            return sendResponse(res, 200, { check_in:null,check_out:null }, "Successfully Fetched", null)
        }
        }catch(err){
            return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language), err);
        }
    }

    async attendanceFieldRequest(req, res) {
        const { organization_id, employee_id, timezone, language } = req.body;
        try {
            const { value, error } = AttendanceValidator.attendanceRequest(req.body);
            value.date = moment(value.date).format('YYYY-MM-DD');
            value.check_in = moment(value.check_in).utc().format('YYYY-MM-DD HH:mm:ss');
            value.check_out = moment(value.check_out).utc().format('YYYY-MM-DD HH:mm:ss');
            if (moment(value.date).tz(timezone).isSameOrAfter(moment().tz(timezone), 'day')) return sendResponse(res, 400, null, 'Not allowed to request attendance for today/upcoming dates', null);
            let attendance,
                get_attendance = await attendanceModel.getDayAttendance(employee_id, value.date, organization_id);
            if (get_attendance.length > 0) {
                value.request_status = 3;
                get_attendance.details = get_attendance.details ? get_attendance.details : {};
                get_attendance.details = { ...get_attendance.details, ...value };
                attendance = await attendanceModel.updateAttendanceRequest(employee_id, value.date, get_attendance.check_in, get_attendance.check_out, JSON.stringify(get_attendance.details), organization_id);
                if (attendance.affectedRows === 1) return sendResponse(res, 200, null, "Request updated Successfully.", null);
            } else {
                value.request_status = 3;
                attendance = await attendanceModel.attendanceRequest(employee_id, value.date, value.check_in, value.check_out, JSON.stringify(value), organization_id);
                if (attendance.affectedRows === 1) return sendResponse(res, 200, null, "Request created Successfully.", null);
            }
            return sendResponse(res, 400, null, "Unable to send Request.", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language), err);
        }
    }

    async attendanceRequest(req, res) {
        const { organization_id, employee_id, timezone, language } = req.decoded;
        try {
            const { value, error } = AttendanceValidator.attendanceRequest(req.body);
            if (error) return sendResponse(res, 400, null, translate(attendanceMessages, "2", language), error.details[0].message);
            value.date = moment(value.date).format('YYYY-MM-DD');
            value.check_in = moment(value.check_in).utc().format('YYYY-MM-DD HH:mm:ss');
            value.check_out = moment(value.check_out).utc().format('YYYY-MM-DD HH:mm:ss');

            if (moment(value.date).tz(timezone).isSameOrAfter(moment().tz(timezone), 'day')) return sendResponse(res, 400, null, 'Not allowed to request attendance for today/upcoming dates', null);

            let attendance,
                get_attendance = await attendanceModel.getDayAttendance(employee_id, value.date, organization_id);

            if (get_attendance.length > 0) {
                value.request_status = 3;
                get_attendance.details = get_attendance.details ? get_attendance.details : {};
                get_attendance.details = { ...get_attendance.details, ...value };
                attendance = await attendanceModel.updateAttendanceRequest(employee_id, value.date, get_attendance.check_in, get_attendance.check_out, JSON.stringify(get_attendance.details), organization_id);
                if (attendance.affectedRows === 1) return sendResponse(res, 200, null, "Request updated Successfully.", null);
            } else {
                value.request_status = 3;
                attendance = await attendanceModel.attendanceRequest(employee_id, value.date, value.check_in, value.check_out, JSON.stringify(value), organization_id);
                if (attendance.affectedRows === 1) return sendResponse(res, 200, null, "Request created Successfully.", null);
            }

            return sendResponse(res, 400, null, "Unable to send Request.", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(attendanceMessages, "SOMETHING_WENT_WRONG", language), err);
        }
    }
}

module.exports = new AttendanceController;