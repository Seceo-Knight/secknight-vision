const Moment = require("moment-timezone");
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
let duration = 0,
    total_count = 0,
    includeWeeklyOffs = false,
    includeHolidays = false;
class AttendanceHelper {

    MatchEmployee = (employees, attendance, settings, leaves = []) => {
        const employeeApprovedLeaves = {};
        for (const leave of leaves) {
            const { employee_id, day_status } = leave;
            let approvedDates = [];
            if (!employeeApprovedLeaves[employee_id]) {
                employeeApprovedLeaves[employee_id] = [];
            }
            try {
                const leaveDayStatusArr = day_status ? JSON.parse(day_status) : [];
                approvedDates = leaveDayStatusArr.map(ds => +ds.status ? ds.date : null).filter(i => i);
                employeeApprovedLeaves[employee_id] = [...employeeApprovedLeaves[employee_id], ...approvedDates];
            } catch (err) {
                employeeApprovedLeaves[employee_id] = [...employeeApprovedLeaves[employee_id], ...approvedDates];
            }
        }

        if (settings.length !== 0) ({ includeWeeklyOffs, includeHolidays } = JSON.parse(settings[0]['settings']));
        return employees.map((itr) => {
            itr.includeWeeklyOffs = includeWeeklyOffs;
            itr.includeHolidays = includeHolidays;
            itr.attendance = [];
            const attendanceObj = attendance.find((item) => item.employee_id === itr.id);
            const employeeApproveLeaveObj = employeeApprovedLeaves[itr.id] || [];

            attendanceObj && !employeeApproveLeaveObj.some(d => moment(d).format("YYYY-MM-DD") == moment(itr.date).format("YYYY-MM-DD")) ? itr.attendance.push(attendanceObj) : null;

            return itr;
        })
    };

    AttendanceStatus = (attendance, attendanceHours, manual_clock_in) => {
        const hours = (attendanceHours[0]) ? Number(attendanceHours[0].type) : 5;

      // attendance = attendance.map(item => {
      //   if ([2, 3].includes(+item.attendance_request_status)) {
      //      delete item.start_time;
      //    delete item.end_time;
      //  item.logged_duration = 0;
      //  return item;
      // }
      //    return item;
      //   })  

        switch (hours) {
            case 1:
                attendance = attendance.map(item => ({
                    ...item,
                    status: ((item.custom_status != 2 && manual_clock_in != 1 && item.logged_duration >= Number(attendanceHours[0].value)) || item.custom_status == 1) ? 1 : (manual_clock_in && manual_clock_in == 1 && item.logged_duration >= attendanceHours[0].manual_hours ? 1 : 0),
                    half_day: ((item.custom_status != 2 && manual_clock_in != 1 && item.logged_duration >= (Number(attendanceHours[0].value) / 2)) || item.custom_status == 3) ? 1 : (manual_clock_in && manual_clock_in == 1 && item.logged_duration >= (Number(attendanceHours[0].manual_hours) / 2) ? 1 : 0),
                }));
                break
            case 2:
                attendance = attendance.map(item => ({
                    ...item,
                    status: ((item.custom_status != 2 && manual_clock_in != 1 && item.office_time >= Number(attendanceHours[0].value)) || item.custom_status == 1) ? 1 : (manual_clock_in && manual_clock_in == 1 && item.logged_duration >= attendanceHours[0].manual_hours ? 1 : 0),
                    half_day: ((item.custom_status != 2 && manual_clock_in != 1 && item.office_time >= (Number(attendanceHours[0].value) / 2)) || item.custom_status == 3) ? 1 : (manual_clock_in && manual_clock_in == 1 && item.logged_duration >= (Number(attendanceHours[0].manual_hours) / 2) ? 1 : 0),
                }));
                break
            case 3:
                attendance = attendance.map(item => ({
                    ...item,
                    status: ((item.custom_status != 2 && manual_clock_in != 1 && item.active_time >= Number(attendanceHours[0].value)) || item.custom_status == 1) ? 1 : (manual_clock_in && manual_clock_in == 1 && item.logged_duration >= attendanceHours[0].manual_hours ? 1 : 0),
                    half_day: ((item.custom_status != 2 && manual_clock_in != 1 && item.active_time >= (Number(attendanceHours[0].value) / 2)) || item.custom_status == 3) ? 1 : (manual_clock_in && manual_clock_in == 1 && item.logged_duration >= (Number(attendanceHours[0].manual_hours) / 2) ? 1 : 0),
                }));
                break
            case 4:
                attendance = attendance.map(item => ({
                    ...item,
                    status: ((item.custom_status != 2 && item.logged_duration >= Number(attendanceHours[0].value)) || item.custom_status == 1) ? 1 : 0,
                    half_day: ((item.custom_status != 2 && item.logged_duration >= (Number(attendanceHours[0].value) / 2)) || item.custom_status == 3) ? 1 : 0,
                }));
                break
            default:
                attendance = attendance.map(item => ({
                    ...item,
                    status: (item.active_time >= 0) ? 1 : 0,
                    half_day: 0,
                }));
        }
        return attendance;
    };

    AttendanceSheet = (employees, range, attendanceHours, employee_leaves, holidays, timesheet, requestAttendance, employeeShifts) => {
        this.total_count = employees[0].total_count;
        employees = employees.map((emp) => {

            /**
             * No Data For Employees
             * whose Joining date is after this month
             */
          //  if (moment(range[0]).isBefore(moment(emp.date_join), 'month')) {
          //      emp.attendance = 'No Data!';
          //     return emp;
          //  }   
        

            emp.data = (emp.data != null) ? JSON.parse(emp.data) : 0;
            if (emp.attendance.length > 0) {
                const empDates = emp.attendance.map((x) => x.date);
                const unmatchedDates = range.filter((item) => {
                    return !empDates.includes(item);
                });
                emp.attendance = emp.attendance.map(item => ({
                    ...item,
                    min_hours: attendanceHours || 0,
                }));
                // emp.attendance = this.LogDetails(emp.id, timesheet, emp.attendance);
                // emp.attendance = this.HalfDay(emp.id, employee_leaves, emp.attendance);
                unmatchedDates.map((item) => {
                    // let { leave_type, leave_name, open_request } = this.MatchLeave(emp.id, employee_leaves, item);
                    // let { holiday_status, holiday_name } = this.MatchHoliday(holidays, item);
                    emp.attendance.push({
                        employee_id: emp.id,
                        attendance_id: null,
                        date: item,
                        active_time: 0,
                        office_time: 0,
                        total_time: 0,
                        logged_duration: 0,
                        // day_off: emp.data != 0 ? emp.data[new Date(item).toDateString().substr(0, 3).toLowerCase()].status : true,
                        min_hours: attendanceHours || 0,
                        is_manual_attendance: 0,
                    });
                });
                emp.attendance.sort((a, b) => new Date(a.date) - new Date(b.date));
                // emp.attendance = this.AttendanceStatus(emp.attendance, attendanceHours);
            } else {
                emp.attendance = [];
                range.map((item) => {
                    // emp.attendance = this.LogDetails(emp.id, timesheet, emp.attendance);
                    // let { leave_type, leave_name, open_request } = this.MatchLeave(emp.id, employee_leaves, item);
                    // let { holiday_status, holiday_name } = this.MatchHoliday(holidays, item);
                    emp.attendance.push({
                        employee_id: emp.id,
                        attendance_id: null,
                        date: item,
                        active_time: 0,
                        office_time: 0,
                        total_time: 0,
                        logged_duration: 0,
                        status: 0,
                        // day_off: emp.data != 0 ? emp.data[new Date(item).toDateString().substr(0, 3).toLowerCase()].status : true,
                        min_hours: attendanceHours || 0,
                        is_manual_attendance: 0,
                    });
                });
                // emp.attendance = this.HalfDay(emp.id, employee_leaves, emp.attendance);
            }

            emp.attendance = this.MatchLeave(emp.id, employee_leaves, emp.attendance);
            emp.attendance = this.MatchHoliday(holidays, emp.attendance);
            emp.attendance = this.LogDetails(emp.id, timesheet, emp.attendance);
            emp.attendance = this.HalfDay(emp.id, employee_leaves, emp.attendance);
            emp.attendance = this.AttendanceStatus(emp.attendance, attendanceHours, emp.manual_clock_in);
            emp.attendance = this.AttendanceRequest(requestAttendance, emp.attendance, emp.id);
            emp.attendance = this.employeeShifts(employeeShifts, emp.data, emp.attendance, emp.id);

            /** Employee Attendance Should be after joining date */
            emp.attendance = emp.attendance.map(element => {
                if (moment(element.date).isBefore(moment(emp.date_join), 'day')) return { date: element.date };
                else return element;
            });

            // duration = 1;
            return emp;
        });
        return employees;
    };

    sortAndSearch = (sortOrder, sortColumn) => {
        let column, order;

        if (sortOrder === 'D') {
            order = `DESC`;
        } else {
            order = `ASC`;
        }

        switch (sortColumn) {
            case 'Full Name':
                column = `u.first_name`
                break;
            case 'Email':
                column = `u.a_email`
                break;
            case 'Location':
                column = `ol.name`
                break;
            case 'Department':
                column = `od.name`
                break;
            case 'Role':
                column = `rn.name`
                break;
            case 'EMP-Code':
                column = `e.emp_code`
                break;
            case 'Agent Version':
                column = `e.software_version`
                break;
            case 'Computer Name':
                column = `u.computer_name`
                break;
            case 'Username':
                column = `u.username`
                break;
            case 'Domain':
                column = `u.domain`
                break;
            default:
                column = `e.created_at`;
                order = `DESC`
                break;
        }

        return { column, order };
    };

    addDays = (date, days = 1) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    dateRange = (start, end, range = []) => {
        if (start > end) return range;
        const next = this.addDays(start, 1);
        return this.dateRange(next, end, [...range, start]);
    };

    checkDateRange = (start_date, end_date, date) => {
        let range = moment().range(start_date, end_date);
        return range.contains(date);
    };

    MatchLeave = (employee_id, employee_leaves, attendance) => {
        let dayStatus = [];
        employee_leaves.forEach(item => {
            if (item.employee_id == employee_id && item.day_type == 2) {
                let leaveStatus = item.day_status ? JSON.parse(item.day_status) : [];
                leaveStatus.forEach(x => dayStatus.push({ ...x, leave_type_days: item.leave_type_days, id: item.id, leave_type: item.employee_leave_type, leave_name: item.leave_name }));
            }
        });

        if (dayStatus.length == 0) return attendance.map(x => ({ ...x, open_request: 0, leave_type: 0, leave_name: 'Unpaid' }));

        return attendance.map(element => {
            let date = moment(element.date).format('YYYY-MM-DD');
            let leave = dayStatus.find(x => x.date == date);

            if (leave) {
                if (leave.unpaid) {
                    element.leave_type = 0;
                    element.leave_name = `${leave.leave_name} | Unpaid`;
                } else if (leave.status == 1) {
                    element.leave_type = leave.leave_type;
                    element.leave_name = leave.leave_name;
                } else if (leave.status == 0) {
                    element.open_request = leave;
                } else {
                    element.leave_type = 0;
                    element.leave_name = 'Unpaid';
                }
            } else {
                element.leave_type = 0;
                element.leave_name = 'Unpaid';
            }
            element.open_request = element.open_request ? element.open_request : 0;
            return element;
        });
    };

    // MatchLeave = (employee_id, employee_leaves, item) => {
    //     let leave_type, leave_name, leave, openRequest, open_request, dayStatus;
    //     employee_leaves.map(element => {
    //         if (element.employee_id === employee_id) {
    //             let leaveStatus = JSON.parse(element.day_status);
    //             leaveStatus.map(x => {
    //                 if (x.date == item) {
    //                     dayStatus = x.status;
    //                     leave = element;
    //                 }
    //             })
    //         }
    //     });
    //     // leave = employee_leaves.find(element => (element.employee_id === employee_id && this.checkDateRange(new Date(element.start_date), new Date(element.end_date), new Date(item)) && element.day_type === 2 && element.status === 1));
    //     // openRequest = employee_leaves.find(element => (element.employee_id === employee_id && this.checkDateRange(new Date(element.start_date), new Date(element.end_date), new Date(item)) && element.day_type === 2 && element.status === 0));
    //     if (leave) {
    //         if (duration <= leave.leave_type_days && dayStatus == 1) {
    //             duration = duration + 1;
    //             leave_type = leave.employee_leave_type;
    //             leave_name = leave.leave_name;
    //         } else if (dayStatus == 0) {
    //             open_request = leave;
    //         } else {
    //             leave_type = 0;
    //             leave_name = 'Unpaid';
    //         }
    //     } else {
    //         leave_type = 0;
    //         leave_name = 'Unpaid';
    //     }
    //     // if (openRequest) open_request = openRequest;

    //     return { leave_type, leave_name, open_request };
    // };

    MatchHoliday = (holidays, attendance) => {
        return attendance.map(element => {
            let day = holidays.find(day => moment(day.holiday_date).format('YYYY-MM-DD') === moment(element.date).format('YYYY-MM-DD'));
            if (day) {
                element.holiday_name = day.holiday_name;
                element.holiday_status = 1;
            } else {
                element.holiday_name = "";
                element.holiday_status = 0;
            }
            return element;
        });
    }

    // MatchHoliday = (holidays, item) => {
    //     let holiday_name, holiday_status, holiday;
    //     holiday = holidays.find(day => (day.holiday_date.toISOString().split("T")[0] === item));
    //     if (holiday) {
    //         holiday_name = holiday.holiday_name;
    //         holiday_status = 1;
    //     } else {
    //         {
    //             holiday_name = "";
    //             holiday_status = 0;
    //         }
    //     }
    //     return { holiday_status, holiday_name }
    // }

    DateConverter = (holiday) => {
        let date = holiday.split("-");
        return holiday = date[2] + '-' + date[1] + '-' + date[0];
    }

    HalfDay = (employee_id, employee_leaves, attendance) => {
        let day = employee_leaves.filter(leave => (leave.employee_id === employee_id && (leave.day_type === 1 || leave.day_type === 3) && leave.status === 1));
        let openRequest = employee_leaves.filter(leave => (leave.employee_id === employee_id && (leave.day_type === 1 || leave.day_type === 3) && leave.status === 0));

        if (day.length) {
            attendance.map(element => {
                day.map(item => {
                    if (moment(element.date).format("YYYY-MM-DD") === moment(item.start_date).format("YYYY-MM-DD")) {
                        element.half_day_status = 1;
                        element.half_day_leave = item.leave_name;
                        return;
                    }
                });
            });
        }

        if (openRequest.length) {
            attendance.map(element => {
                openRequest.map(item => {
                    if (moment(element.date).format("YYYY-MM-DD") === moment(item.start_date).format("YYYY-MM-DD")) {
                        element.open_request = item;
                        return;
                    }
                });
            });
        }

        return attendance;
    }


    // HalfDay = (employee_id, employee_leaves, attendance) => {
    //     let day, openRequest;
    //     day = employee_leaves.find(leave => (leave.employee_id === employee_id && (leave.day_type === 1 || leave.day_type === 3) && leave.status === 1));
    //     openRequest = employee_leaves.find(leave => (leave.employee_id === employee_id && (leave.day_type === 1 || leave.day_type === 3) && leave.status === 0));
    //     if (day) {
    //         attendance = attendance.map(item => ({
    //             ...item,
    //             half_day_status: (item.date === day.start_date.toISOString().split("T")[0]) ? 1 : 0,
    //             half_day_leave: (item.date === day.start_date.toISOString().split("T")[0]) ? day.leave_name : null,
    //         }));
    //     }
    //     if (openRequest) {
    //         attendance = attendance.map(item => ({
    //             ...item,
    //             open_request: (item.date === openRequest.start_date.toISOString().split("T")[0] && !item.open_request) ? openRequest : item.open_request,
    //         }));
    //     }
    //     return attendance;
    // }

    LogDetails = (employee_id, timesheet, attendance) => {
        attendance = attendance.map(item => {
            let custom_day_off = null;
            let data = {
                ...item,
                ...timesheet.find((x) => {
                    if (x.employee_id == item.employee_id && (x.date.toISOString().split("T")[0]) == item.date) {
                        const { start_time, end_time, is_manual_attendance, logged_duration, custom_status, attendance_id, overridden_by } = x;
                        custom_day_off = custom_status && custom_status == 5 ? false : custom_day_off;
                        return [start_time, end_time, is_manual_attendance, logged_duration, custom_status, attendance_id, overridden_by];
                    }
                })
            };
            data.day_off = custom_day_off ?? data.day_off;
            return data;
        });

        return attendance;
    }

    AttendanceRequest = (requestAttendance, attendance, employee_id) => {
        return attendance.map(item => ({
            ...item,
            open_attendance_request: requestAttendance.find(x => x.employee_id == employee_id && moment(x.date).format('YYYY-MM-DD') == moment(item.date).format('YYYY-MM-DD')) || null
        }));
    }

    /**
     * Assign shifts to employee attendance per day
     */
    employeeShifts(employeeShifts, defaultShift, attendance, employee_id) {

        let shiftsArray = [], shiftsDataArray = new Map();
        employeeShifts.forEach(x => {
            if (x.employee_id == employee_id) {
                let range = this.dateRange(x.start_date, x.end_date);
                if (range.length) range.forEach(y => { shiftsArray.push({ date: y, shift_id: x.shift_id }); });
            }
            shiftsDataArray.set(x.shift_id, JSON.parse(x.data));
        });

        return attendance.map(element => {

            if (shiftsArray.length) {
                let data = shiftsArray.find(x => moment(x.date).format("YYYY-MM-DD") == moment(element.date).format("YYYY-MM-DD"))
                if (data?.shift_id) {
                    data = shiftsDataArray.get(data.shift_id);
                    element.day_off = data[new Date(element.date).toDateString().substr(0, 3).toLowerCase()].status;
                }
                else
                    element.day_off = defaultShift ? defaultShift[new Date(element.date).toDateString().substr(0, 3).toLowerCase()].status : true;
            }
            else element.day_off = defaultShift ? defaultShift[new Date(element.date).toDateString().substr(0, 3).toLowerCase()].status : true;

            return element;
        });
    }
}

module.exports = AttendanceHelper;