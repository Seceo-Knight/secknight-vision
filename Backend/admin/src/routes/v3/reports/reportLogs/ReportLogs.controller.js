const _ = require('underscore');
const moment = require('moment');
const mongoose = require('mongoose');

const EmployeeReportsModel = require('./ReportLogs.model');
const EmployeeReportsValidator = require('./ReportLogs.validation');
const actionsTracker = require('../../services/actionsTracker');
const { reportMessage } = require("../../../../utils/helpers/LanguageTranslate");



class ReportLogs {
    async getEmployeeReports(req, res, next) {
        try {
            const { organization_id, role_id, employee_id } = req.decoded;
            let {
                employee_ids, download_option, startDate: start_date, endDate: end_date, location_id, role_id: employee_role_id, department_ids
            } = await EmployeeReportsValidator.downloadEmployeeReport().validateAsync(req.body);

            const max_end_date = moment(start_date).add(2, 'month').format('YYYY-MM-DD');

            if (employee_ids.length === 0 && employee_id) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(employee_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }
            const attendanceData = await EmployeeReportsModel.getAttandanceIdsGroupped({
                organization_id, employee_ids, start_date,
                end_date: end_date > max_end_date ? max_end_date : end_date, location_id, department_ids, employee_role_id
            });
            if (attendanceData.length > 250 && download_option === 3) {
                return res.json({ code: 400, data: null, message: 'Please select one month 15 employees,one week 50 employees and one day 300 employees.', error: null });
            } else if (attendanceData.length > 500 && (download_option === 1 || download_option === 2)) {
                return res.json({ code: 400, data: null, message: 'Please select one month 15 employees,one week 50 employees and one day 300 employees.', error: null });
            }

            actionsTracker(req, 'Employees ? reports (%i) requested.', [employee_ids, download_option]);

            const attendanceById = {};
            const departmentIds = [];
            for (const { attendance_ids, first_name, last_name, timezone, name, department_id, employee_id, location, location_id } of attendanceData) {
                const data = { first_name, last_name, timezone, name, department_id, employee_id, location, location_id };
                departmentIds.push(department_id);
                for (const attendanceId of attendance_ids.split(',')) {
                    attendanceById[attendanceId] = data;
                }
            }
            const attendanceIds = Object.keys(attendanceById).map(id => +id).sort().reverse();
            const appsWebsById = {};
            // for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id)) {
            //     appsWebsById[_id] = name;
            // }
            let applicationUsed = [];
            let browserHistory = [];
            switch (download_option) {
                case 1: applicationUsed = await EmployeeReportsModel.getApplicationUsed(attendanceIds);
                    break;
                case 2:
                    browserHistory = await EmployeeReportsModel.getBrowserHistory(attendanceIds);
                    break;
                case 3:
                    [applicationUsed, browserHistory] = await Promise.all([
                        EmployeeReportsModel.getApplicationUsed(attendanceIds),
                        EmployeeReportsModel.getBrowserHistory(attendanceIds),
                    ]);
                    break;
            }
            let applicationIds = _.pluck([...browserHistory, ...applicationUsed], '_id');
            const browseryHistoryAppId = _.pluck([...browserHistory], 'application_id');
            applicationIds = applicationIds.concat(browseryHistoryAppId);
            applicationIds = applicationIds.map(id => id.toString());
            console.log('------111111111111111----------------', applicationIds.length);
            applicationIds = [...new Set(applicationIds)];
            applicationIds = applicationIds.map(id => new mongoose.Types.ObjectId(id));
            console.log('-------22222222222222---------', applicationIds.length);

            const statuses = await EmployeeReportsModel.getApplicationsStatus(applicationIds, departmentIds);

            console.log('-------333333333333333---------');
            for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id, applicationIds)) {
                appsWebsById[_id] = name;
            }
            console.log('-------4444444444444444444---------');

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
            console.log('-------5555555555555555555---------');
            const setSortKey = (item) => {
                item.sortKey = `${attendanceById[item.attendance_id].employee_id}-${+item.start_time}`;
            };
            const sorter = item => item.sortKey;

            // browserHistory.forEach(setSortKey);
            // applicationUsed.forEach(setSortKey);
            console.log('-------666666666666666666666666---------');

            // const results = {
            //     browser_history: _.sortBy(browserHistory, sorter).map(mapper),
            //     application_used: _.sortBy(applicationUsed, sorter).map(mapper),
            // };
            const results = {
                browser_history: browserHistory.map(mapper),
                application_used: applicationUsed.map(mapper),
            };
            console.log('-------777777777777777777777777---------');

            return res.json({ code: 200, data: results, message: 'Employee Report', error: null });
        } catch (err) {
            console.log('------------', err);
            next(err);
        }
    }
}

module.exports = new ReportLogs;
