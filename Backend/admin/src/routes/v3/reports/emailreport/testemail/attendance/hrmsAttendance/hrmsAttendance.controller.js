const _ = require("underscore");
const moment = require("moment");
const attendanceHelper = require('./hrmsAttendance.helper');
const attendanceModel = require('./hrmsAttendance.model');

const { default: axios } = require("axios");

module.exports = async ({ orgId: organization_id, empIds: employeesId, depIds: department_ids, date,req }) => {
    // let data = await getHrmsAttendance({ orgId: organization_id, empIds: employeesId, depIds: department_ids, date });
    
    const startDate = moment(date).subtract(1, "months").format("YYYY-MM-DD");
    const endDate = moment(date).format("YYYY-MM-DD");
    let response = await axios.get(`https://service.empmonitor.com/api/v3/hrms/getAttendanceCustom?location_id=0&organization_id=${organization_id}&department_id=0&role_id=0&date=202207&sortOrder=A&skip=0&limit=500&status=1&start_date=${startDate}&end_date=${endDate}`,{ headers: {"Authorization" : `Bearer ${req.header('authorization').split(" ")[1]}`} });
    
    let temp = response?.data?.data ?? [];
    let data = [];

    if (department_ids?.length == 0 && employeesId?.length == 0) {
        data = temp;
    }

    temp?.map((item,index)=>{
        if(department_ids.includes(item?.department_id)) data.push(item);
        if(employeesId.includes(item?.id)) data.push(item);
    })

    if (!data) return null;

    return data.map(element => {
        element.P = 0;
        element.A = 0
        element.L = 0
        element.W = 0
        element.H = 0;
        let returnValue = {};

        element.attendance.forEach(emp => {
            const dateKey = moment(emp.date).format("YYYY-MM-DD");

            if ((emp.custom_status !== null) && (emp.overridden_by !== null) && (emp.overridden_by !== undefined)) {
                if (emp.custom_status === '1') {
                    element.P++;
                    returnValue[dateKey] = "P";
                } else if (emp.custom_status === '2') {
                    element.A++;
                    returnValue[dateKey] = "A";
                } else if (emp.custom_status === '3') {
                    element.P = element.P + 0.5;
                    element.A = element.A + 0.5;
                    returnValue[dateKey] = "HD | LOP";
                } else if ((emp.custom_status === '4') && (emp.leave_name !== null) && (emp.leave_name !== undefined)) {
                    element.L++;
                    returnValue[dateKey] = emp.leave_name;
                } else if (emp.custom_status === '5') {
                    element.W++;
                    returnValue[dateKey] = "WO";
                } else if (emp.custom_status === '6' && emp.half_day_status === 1) {
                    element.P = element.P + 0.5;
                    element.L = element.L + 0.5;
                    returnValue[dateKey] = `P | ${emp.leave_name}`;
                } else if (emp.custom_status === '7' && emp.half_day_status === 1) {
                    element.A = element.A + 0.5;
                    element.L = element.L + 0.5;
                    returnValue[dateKey] = `A | ${emp.leave_name}`;
                } else {
                    element.A = element.A + 1;
                    returnValue[dateKey] = `A`;
                }
            } else if (emp.status === 1 && (moment().isAfter(emp.date))) {
                element.P++;
                returnValue[dateKey] = `P`;
            } else if (emp.holiday_status === 1) {
                element.H++;
                returnValue[dateKey] = emp.holiday_name;
            } else if (emp.day_off === false) {
                element.W++;
                returnValue[dateKey] = "WO";
            } else {
                if (emp.open_request !== 0 && emp.open_request !== undefined && emp.open_request !== null) {
                    // AppendTR += '<td title="Open Request"><a href="leave-details?id=' + emp?.open_request?.id + '">Open Request</a></td>';
                } else if (emp.open_attendance_request !== undefined && emp.open_attendance_request !== null && emp.open_attendance_request.request_status === '3') {
                    // AppendTR += `<td title="Attendance Request"><a target="_blank" href="attendance-requests">Attendance Request</a></td>`;
                } else if (emp.half_day === 1 && moment().isAfter(emp.date)) {
    
                    let leave_name, half_day;
                    if (emp.half_day_status === 1 && emp.half_day_leave !== null && emp.half_day_leave !== undefined) {
                        leave_name = (emp.half_day_leave.charAt(0).toString().toUpperCase().replace(/,/g, '') + '' + (emp.half_day_leave.charAt(emp.half_day_leave.lastIndexOf(' ') + 1)).toString().toUpperCase().replace(/,/g, ''));
                        element.L = element.L + 0.5;
                    } else if (emp.half_day_status === 1 && emp.leave_type !== 0) {
                        leave_name = (emp.leave_name.charAt(0).toString().toUpperCase().replace(/,/g, '') + '' + (emp.leave_name.charAt(emp.leave_name.lastIndexOf(' ') + 1)).toString().toUpperCase().replace(/,/g, ''));
                        element.L = element.L + 0.5;
                    } else {
                        element.A = element.A + 0.5;
                        leave_name = 'LOP';
                    }
                    element.P = element.P + 0.5;
                    returnValue[dateKey] = `HD | ${leave_name}`;
                } else if (emp.half_day_status === 1) {
                    let leave_name = (emp.half_day_leave.charAt(0).toString().toUpperCase().replace(/,/g, '') + '' + (emp.half_day_leave.charAt(emp.half_day_leave.lastIndexOf(' ') + 1)).toString().toUpperCase().replace(/,/g, ''));
                    element.L = element.L + 0.5;
                    element.A = element.A + 0.5;
                    returnValue[dateKey] = `A | ${leave_name}`;
                } else if (emp.leave_type !== 0 && emp.leave_type !== undefined && emp.holiday_status === 0 && emp.half_day_status !== 1) {
                    let leave_name = (emp.leave_name) ? emp.leave_name : "A";
                    element.L = element.L + 0.5;
                    returnValue[dateKey] = leave_name;
                } else if (data.date_join != null && new Date(data.date_join) > new Date(emp.date)) {
                    returnValue[dateKey] = "--";
                } else if ((moment().isBefore(emp.date))) {
                    returnValue[dateKey] = "--";
                } else if (Number(data.is_attendance_override) === 1 && Number(data.tracking_rule_type) === 3 && (moment().isAfter(emp.date))) {
                    element.P++;
                    returnValue[dateKey] = "P";
                }
                else if(!emp. attendance_id&&!emp.min_hours) {
                    returnValue[dateKey] = "--";
                } else {
                    element.A++;
                    returnValue[dateKey] = "A";
                }
            }
        });
        element.attendance = returnValue;
        return element;
    });
};


async function getHrmsAttendance({ orgId: organization_id, empIds: employeesId, depIds: department_ids, date }) {
    try {
        const startDate = moment(date).subtract(1, "months").format("YYYY-MM-DD");
        const endDate = moment(date).format("YYYY-MM-DD");

        let employees = await attendanceModel.userList(organization_id, employeesId, department_ids);
        if (employees.length === 0) return null;

        let attendanceHours = await attendanceModel.getAttendanceHours("attendance_hours", organization_id);
        if (attendanceHours.length > 0) {
            const value = JSON.parse(attendanceHours[0].value);
            attendanceHours[0].value = Number(value.values);
            attendanceHours[0].type = Number(value.type);
            attendanceHours[0].manual_hours = value.manual_hours ? Number(value.manual_hours) : 0;
            delete attendanceHours[0].attendance_colors;
        }

        let manualEmps = [0], setupEmps = [0];

        employees.map(x => {
            if (x.manual_clock_in == 1) manualEmps.push(x.id)
            else setupEmps.push(x.id)
        });

        const settings = await attendanceModel.getOrgPFSettings(organization_id);
        const employee_ids = _.unique(_.pluck(employees, "id"));

        const employee_leaves = await attendanceModel.getLeaveByEmployee(employee_ids, moment(startDate).format("YYYY-MM%"), organization_id);
        let attendance = await attendanceModel.getAttendance(startDate, endDate, employee_ids, organization_id);
        let timesheet = await attendanceModel.getTimesheet(startDate, endDate, setupEmps, attendanceHours[0].type, organization_id);

        timesheet = timesheet.concat(await attendanceModel.getManualTimesheet(startDate, endDate, manualEmps, organization_id));
        employees = attendanceHelper.MatchEmployee(employees, attendance, settings, employee_leaves);

        let range = attendanceHelper.dateRange(new Date(startDate), new Date(endDate));
        range = range.map(date => date.toISOString().slice(0, 10));

        const [holidays, requestAttendance, employeeShifts] = await Promise.all([
            attendanceModel.getHolidayList(organization_id),
            attendanceModel.getRequestStatus(employee_ids, organization_id, startDate, endDate),
            attendanceModel.getEmployeeShifts(employee_ids, organization_id, startDate)
        ]);
        employees = attendanceHelper.AttendanceSheet(employees, range, attendanceHours, employee_leaves, holidays, timesheet, requestAttendance, employeeShifts);
        return employees;
    } catch (err) {
        return null;
    }
}