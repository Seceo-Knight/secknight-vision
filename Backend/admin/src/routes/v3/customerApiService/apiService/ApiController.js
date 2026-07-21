const ApiValidtor = require('./ApiValidator');
const ApiModel = require('./ApiModel');
const _ = require('underscore');
const moment = require('moment-timezone');
const EmployeeReportsModel = require('../../reports/employee/EmployeeReports.model');

const getReports = async (organization_id, employee_ids, start_date, end_date) => {
    const max_end_date = moment(start_date).add(2, 'month').format('YYYY-MM-DD');
    const attendanceData = await ApiModel.getAttandanceIdsGroupped({
        organization_id, employee_ids, start_date,
        end_date: end_date > max_end_date ? max_end_date : end_date
    });

    if (attendanceData.length == 0) {
        throw new Error('No Data Found!')
    }

    const attendanceById = {};
    const departmentIds = [];
    for (const { attendance_ids, first_name, last_name, timezone, name, department_id, employee_id, location, location_id } of attendanceData) {
        const data = { first_name, last_name, timezone, name, department_id, employee_id, location, location_id };
        departmentIds.push(department_id);
        for (const attendanceId of attendance_ids.split(',')) {
            attendanceById[attendanceId] = data;
        }
    }
    const attendanceIds = Object.keys(attendanceById).map(id => +id);
    const appsWebsById = {};
    let [applicationUsed, browserHistory] = await Promise.all([
        EmployeeReportsModel.getApplicationUsed(attendanceIds),
        EmployeeReportsModel.getBrowserHistory(attendanceIds),
    ]);

    let applicationIds = _.pluck([...browserHistory, ...applicationUsed], '_id');
    const browseryHistoryAppId = _.pluck([...browserHistory], 'application_id');
    applicationIds = applicationIds.concat(browseryHistoryAppId);

    const statuses = await EmployeeReportsModel.getApplicationsStatus(applicationIds, departmentIds);

    for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id, applicationIds)) {
        appsWebsById[_id] = name;
    }

    const mapper = (item) => {
        const { first_name, last_name, timezone, name, department_id, location } = attendanceById[item.attendance_id];
        const status = statuses[item._id];
        const { domain_id, application_id } = item;
        const result = {
            ..._.omit(item, '_id', 'attendance_id', 'domain_id', 'application_id', 'sortKey'),
            keystrokes: item.keystrokes.replace(/\u0000/g, ''),
            timezone: timezone,
            employee_name: `${first_name} ${last_name}`,
            department: name,
            location,
            status: item._id in statuses ? ('0' in status ? status['0'] : status[department_id]) : null,
        };
        if ('domain_id' in item) {
            result.browser_name = appsWebsById[application_id];
            result.domain_name = appsWebsById[domain_id];
        } else {
            result.app_name = appsWebsById[application_id];
        }
        return result;
    };
    const setSortKey = (item) => {
        item.sortKey = `${attendanceById[item.attendance_id].employee_id}-${+item.start_time}`;
    };
    const sorter = item => item.sortKey;

    browserHistory.forEach(setSortKey);
    applicationUsed.forEach(setSortKey);

    const results = {
        browser_history: _.sortBy(browserHistory, sorter).map(mapper),
        application_used: _.sortBy(applicationUsed, sorter).map(mapper),
    };
    return results;
}

class ApiControler {
    async getEpmloyees(req, res, next) {
        try {
            const { employee_id, organization_id, last_name, first_name, is_manager, a_email } = req.decoded;
            const { skip, limit, location_id, department_id, role_id, name_contains } = await ApiValidtor.getEmployees().validateAsync(req.query);
            let employesList = await ApiModel.getEmployee(employee_id, skip, limit, null, location_id, department_id, role_id, name_contains);
            if (employesList.length == 0) return res.json({ code: 400, data: null, message: "No Employees Found.", error: null })

            employesList = await Promise.all(employesList.map(async item => {

                let superior_assigned = await ApiModel.getAssignedDetails({ employee_id: item.employee_id, organization_id });
                return { ...item, superior_assigned }

            }
            )
            );

            return res.json({ code: 200, data: employesList, message: "Employees", error: null });
        } catch (err) {
            next(err)
        }

    }

    async getApplications(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            const { skip, limit } = await ApiValidtor.getEmployees().validateAsync(req.query);
            const applications = await ApiModel.getApplications(organization_id, skip, limit)
            if (applications.length == 0) return res.json({ code: 400, data: null, message: "No Application Found.", error: null })
            return res.json({ code: 200, data: applications, message: "Application", error: null })
        } catch (err) {
            next(err)
        }
    }

    async getDeveloperAppReports(req, res, next) {
        try {
            let empReports;
            const { organization_id, employee_id: employeeId } = req.decoded;
            let { employee_ids, applications, from_date, to_date, search_name } = await ApiValidtor.getDeveloperAppReports().validateAsync(req.body);
            from_date = moment(from_date).format('YYYY-MM-DD');
            to_date = moment(to_date).format('YYYY-MM-DD');
            applications = applications.map(i => i.toLowerCase());
            const employees = await ApiModel.getEmployee(employeeId, 0, 0, employee_ids, null, null, null, null);
            let employee_list = employees.map(i => ({ employee_name: i.name }))
            if (employees.length == 0) return res.json({ code: 404, data: null, message: "Invalid user ids", error: null })

            const empIds = _.pluck(employees, "employee_id")
            const check_employee = employee_ids.filter(i => { return !empIds.includes(i) });
            if (check_employee.length !== 0) return res.json({ code: 404, data: null, message: `Invalid user ids :- ${check_employee} `, error: null })

            const appsList = await ApiModel.getAppsByName(applications, organization_id);
            if (appsList.length == 0) return res.json({ code: 404, data: null, message: "No Such Application Found!", error: null })
            let appNames = _.pluck(appsList, "name");
            appNames = applications.filter(i => { return !appNames.includes(i) })
            if (appNames.length !== 0) return res.json({ code: 404, data: null, message: `Invalid Application names :- ${appNames}`, error: null })
            let devsReport = await ApiModel.getDeveloperAppReports(employee_ids, _.pluck(appsList, "_id"), from_date, to_date);
            if (devsReport.length == 0) {
                empReports = await getReports(organization_id, _.pluck(employees, "employee_id"), from_date, to_date);
                return res.json({ code: 200, data: { appllication_used_by: [], appllication_not_used_by: employee_list, reports: empReports }, message: `No users used the given applications`, error: null })
            }
            let appllication_used_by = devsReport.map(i => ({ employee_name: employees.find(x => { return x.employee_id == i.employee_id }) ? employees.find(x => { return x.employee_id == i.employee_id }).name : null, application: appsList.find(itr => { return i.application_id.toString() == itr._id.toString() }).name }))
            let devsReportEmpIds = _.pluck(devsReport, "employee_id");
            let devsNotWorkWithDevTools = employees.filter(i => { return !devsReportEmpIds.includes(i.employee_id) });
            let appllication_not_used_by = devsNotWorkWithDevTools.map(i => ({ employee_name: i.name }))
            if (devsNotWorkWithDevTools.length > 0) {
                let empIds = _.pluck(devsNotWorkWithDevTools, "employee_id")
                empReports = await getReports(organization_id, empIds, from_date, to_date);
                return res.json({ code: 200, data: { appllication_used_by, appllication_not_used_by, reports: empReports }, message: "Application usage reports", error: null });
            }
            return res.json({ code: 200, data: { appllication_used_by, appllication_not_used_by: [], reports: [] }, message: "Given all users used at least one application from the given applications", error: null });
        } catch (err) {
            next(err)
        }
    }

    async getAbsentEployeeDetails(req, res, next) {
        try {
            const { organization_id, employee_id, role_id } = req.decoded;
            let { date } = await ApiValidtor.getAbsentEmployee().validateAsync(req.query);
            let absentEmployees = await ApiModel.getAbsentEployeeDetails(date, employee_id, role_id);
            if (absentEmployees.length == 0) return res.json({ code: 400, data: null, message: "No employee found.", error: null });
            let absentEmpIds = _.pluck(absentEmployees, "id");
            const lastUdates = await ApiModel.getLastActivityTime(absentEmpIds, date);
            if (lastUdates.length == 0) return res.json({ code: 400, data: null, message: "No data found for this date.", error: null });

            const attendance_ids = await _.pluck(lastUdates, "id");
            absentEmployees = absentEmployees.map(itr => {
                itr = { ...itr, activity: null }
                let lastUpdateData = lastUdates.find(i => i.employee_id == itr.id)
                if (lastUpdateData) {
                    itr = {
                        ...itr, logout: lastUpdateData.end_time || null,
                        attendance_id: lastUdates.find(i => i.employee_id == itr.id).id || null
                    }
                } else {
                    itr = {
                        ...itr, logout: null,
                        attendance_id: null
                    }
                }
                return itr;
            })
            const activity = await ApiModel.getEmployeeActivity(attendance_ids);
            if (activity.length !== 0) {
                let apps = activity.filter(itr => itr.url === '');
                apps = apps.map(itr => ({ app: itr.app.name, title: itr.title, total_duration: itr.total_duration, active_seconds: itr.active_seconds, keystrokes: itr.keystrokes, attendance_id: itr.attendance_id }))
                let websites = activity.filter(itr => itr.url !== '');
                if (websites.length !== 0) websites = websites.map(itr => ({ domain: itr.web.name, url: itr.url, app: itr.app.name, title: itr.title, total_duration: itr.total_duration, active_seconds: itr.active_seconds, keystrokes: itr.keystrokes, attendance_id: itr.attendance_id }))
                absentEmployees = absentEmployees.map(itr => {
                    itr = {
                        ...itr,
                        activity: websites.find(i => i.attendance_id == itr.attendance_id) ||
                            apps.find(i => i.attendance_id == itr.attendance_id),
                    }
                    let lastUpdateData = lastUdates.find(i => i.employee_id == itr.id);
                    if (lastUpdateData) {
                        itr = {
                            ...itr,
                            activity: activity || null,
                            logout: lastUpdateData.end_time || null,
                        }
                    } else {
                        itr = {
                            ...itr,
                            activity: activity || null,
                            logout: null,
                        }
                    }
                    return itr;
                })
            }
            absentEmployees.map(itr => delete itr.attendance_id)
            return res.json({ code: 200, data: absentEmployees, message: "Absent employees data", error: null });
        } catch (err) {
            next(err)
        }
    }
}
module.exports = new ApiControler;

(async () => {
    const activity = await ApiModel.getEmployeeActivity([39115, 39116, 38969, 36667]);
    let apps = activity.filter(itr => itr.url === '');
    apps = apps.map(itr => ({ app: itr.app.name, title: itr.title, total_duration: itr.total_duration, active_seconds: itr.active_seconds, keystrokes: itr.keystrokes, attendance_id: itr.attendance_id }))
    let websites = activity.filter(itr => itr.url !== '');
    if (websites.length !== 0) websites = websites.map(itr => ({ domain: itr.web.name, url: itr.url, app: itr.app.name, title: itr.title, total_duration: itr.total_duration, active_seconds: itr.active_seconds, keystrokes: itr.keystrokes, attendance_id: itr.attendance_id }))

    console.log(apps, websites)
})

// {
//     user_id: 17121,
//     employee_id: 2930,
//     organization_id: 1,
//     first_name: 'Asit',
//     last_name: 'Test',
//     email: 'asitdasglb@gmail.com',
//     a_email: 'asitdasglb@gmail.com',
//     email_verified_at: '2020-09-29T07:56:05.000Z',
//     contact_number: 'null',
//     emp_code: 'EE2',
//     location_id: 71,
//     location_name: 'Bhilai',
//     department_id: 39,
//     department_name: 'phpp',
//     photo_path: '/default/profilePic/user.png',
//     address: null,
//     role_id: 2,
//     role: 'Employee',
//     status: 1,
//     timezone: 'Asia/Kolkata',
//     is_manager: false,
//     is_teamlead: false,
//     is_employee: true,
//     is_admin: false,
//     weekday_start: 'sunday',
//     language: 'en',
//     permission_ids: [ 56, 57, 58, 59, 60, 61 ],
//     setting: {
//       system: { type: 0, visibility: false, autoUpdate: 0 },
//       screenshot: {
//         frequencyPerHour: 30,
//         employeeAccessibility: false,
//         employeeCanDelete: false
//       },
//       breakInMinute: 30,
//       idleInMinute: 2,
//       trackingMode: 'unlimited',
//       tracking: {
//         unlimited: [Object],
//         fixed: [Object],
//         app: [Object],
//         domain: [Object]
//       },
//       task: { employeeCanCreateTask: false },
//       features: {
//         application_usage: 1,
//         keystrokes: 1,
//         web_usage: 1,
//         block_websites: 0,
//         screenshots: 1
//       },
//       pack: { id: 1, expiry: '2037-12-31' },
//       logoutOptions: {
//         option: '2',
//         specificTimeUTC: '23:59',
//         specificTimeUser: '23:59',
//         afterFixedHours: '8'
//       }
//     },
//     shift: ''
//   }