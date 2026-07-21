const _ = require('underscore');
const moment = require('moment');
const fs = require('fs');
const stream = require('stream');
const Json2csvTransform = require('json2csv').Transform;
const ExcelJs = require('exceljs');

const EmployeeReportsModel = require('./EmployeeReports.model');
const EmployeeReportsValidator = require('./EmployeeReports.validator');
const actionsTracker = require('../../services/actionsTracker');
const { reportMessage, excelReportHeader } = require("../../../../utils/helpers/LanguageTranslate");
const ReportActivityLogModel = require('./../reportActivityLog/reportActivityLog.model');
const { WebSocketNotification } = require('../../../../messages/WebSocketNotification');

const maskingIP = require('../../../../utils/helpers/IPMasking');
const config = require('../../../../../../config/config');
const filterKeystrokes = require('../../../../utils/helpers/FilterKeystrokes');
const redis = require('../../auth/services/redis.service');
class EmployeeReportsController {
    
    constructor() {
        this.getEmployeeReports_excel = this.getEmployeeReports_excel.bind(this);
        this.getEmployeeReports_excel_combined = this.getEmployeeReports_excel_combined.bind(this);
    }
    
    getDownloadOptions(req, res, next) {
        const data = {
            choice_option: "DropDown",
            data: [
                { name: "Application Used", actual: "1" },
                { name: "Browser History", actual: "2" },
                { name: "All", actual: "3" }
            ]
        }
        actionsTracker(req, 'Report download options requested.');
        return res.json({ code: 200, data: data, message: 'Success.', error: null });
    }

    async getEmployeeReportNotInUse(req, res, next) {
        try {
            let { employee_ids, from_date, to_date } = await EmployeeReportsValidator.getEmployeeReport().validateAsync(req.body);
            const organization_id = req.decoded.organization_id;
            from_date = moment(from_date).format('YYYY-MM-DD');
            to_date = moment(to_date).format('YYYY-MM-DD');

            let result = [];
            for (const employee_id of employee_ids) {
                const promiseArr = [
                    EmployeeReportsModel.logDetails({ employee_id, from_date, to_date, skip: 0, limit: 400, organization_id }),
                    EmployeeReportsModel.keyStrokes({ employee_id, skip: 0, limit: 400, from_date, to_date, organization_id }),
                    EmployeeReportsModel.getBrowserHistory({ employee_id, skip: 0, limit: 2000, from_date, to_date }),
                    EmployeeReportsModel.userApplicationUsed({ employee_id, skip: 0, limit: 2000, from_date, to_date }),
                    EmployeeReportsModel.topApps({ employee_id, skip: 0, limit: 100, from_date, to_date }),
                    EmployeeReportsModel.topWebsites({ employee_id, skip: 0, limit: 100, from_date, to_date })
                ];

                const finalData = await Promise.all(promiseArr);

                result.push({
                    user_id: employee_id,
                    log_details: finalData[0].length > 0 ? finalData[0] : null,
                    key_stroke: finalData[1].length > 0 ? finalData[1] : null,
                    browser_history: finalData[2].length > 0 ? finalData[2] : null,
                    application_used: finalData[3].length > 0 ? finalData[3] : null,
                    top_apps: finalData[4].length > 0 ? finalData[4] : null,
                    top_websites: finalData[5].length > 0 ? finalData[5] : null
                });
            }
            return res.json({ code: 200, data: result, message: 'Users Reports', error: null });
        } catch (err) {
            next(err);
        }
    }

    async userActivityLogin(req, res, next) {
        let { organization_id } = req.decoded;
        try {
            let { employee_ids, department_ids, location_ids, EmployeeName, startDate, endDate, type } = req?.query;
            let condition = {};
            let limitValue = +req.query.limit || 10;
            let skipValue = +req.query.skip || 0;
            let orderBy = req.query.sortOrder || 'createdAt';
            let sortBy = {};
            let query = [];
            sortBy[orderBy] = req?.query?.sortOrder?.toString() === 'A' ? 1 : -1
            if (type) condition["type"] = type;
            if (startDate && endDate) {
                query.push({
                    createdAt: {
                        $gte: new Date(req?.query.startDate),
                        $lt: new Date(new Date(req?.query.endDate).setHours(23, 59, 59, 999)),
                    },
                });
                condition['$and'] = query;
            }
            condition[`organization`] = organization_id;

            let userData = [];
            if (department_ids || location_ids) {
                let findEmployeeIds = await EmployeeReportsModel.getEmployeeByLocationAndDepartment(department_ids, location_ids, organization_id);
                condition['employeeId'] = { $in: _.pluck(findEmployeeIds, 'id')};
            }

            let formattedData = [];

            formattedData = await EmployeeReportsModel.getLoginActivityLogsData(condition);
            let employee_id = _.pluck(formattedData, 'employeeId');
            if(formattedData.length > 0) userData = await EmployeeReportsModel.getEmployeeDetails(organization_id, employee_id)
            formattedData = formattedData.map((actionLogsData) => {
                let singleUserDetails = userData.filter(i => i.id == actionLogsData?.employeeId)[0];
                actionLogsData = {...actionLogsData, ...singleUserDetails}
                return actionLogsData;
            })

            if(formattedData.length > 0) return res.status(200).json({ code: 200, error: null, message: "Successfully fetched user login details", data: formattedData })
            else return res.status(200).json({ code: 200, error: 'No found login activity details', data: null });

        } catch (err) {
            next(err);
        }
    }

    async getEmployeeReports(req, res, next) {
        try {
            let { organization_id, role_id, employee_id, is_admin } = req.decoded;
            let {
                employee_ids, download_option, startDate: start_date, endDate: end_date, location_id, role_id: employee_role_id, department_ids, nonAdminId
            } = await EmployeeReportsValidator.downloadEmployeeReport().validateAsync(req.body);

            if(!employee_id && is_admin && nonAdminId) employee_id = nonAdminId;

            const max_end_date = moment(start_date).add(2, 'month').format('YYYY-MM-DD');

            if (employee_ids.length === 0 && employee_id) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(employee_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }
            const attendanceData = await EmployeeReportsModel.getAttandanceIdsGroupped({
                organization_id, employee_ids, start_date,
                end_date: end_date > max_end_date ? max_end_date : end_date, location_id, department_ids, employee_role_id
            });

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
            const attendanceIds = Object.keys(attendanceById).map(id => +id);
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

            
            let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
            if (ipMaskingOrgId.includes(String(organization_id))){
                results.browser_history = results.browser_history.map(x => {
                    x.domain_name = maskingIP(x.domain_name);
                    x.url = maskingIP(x.url);
                    return x;
                });
            }

            return res.json({ code: 200, data: results, message: 'Employee Report', error: null, employeeDetails: attendanceData });
        } catch (err) {
            console.log('------------', err);
            next(err);
        }
    }

    async getEmployeeReportsCustomRate(req, res, next) {
        try {
            const { organization_id, role_id, employee_id } = req.decoded;

            if(!req.tailored) {
                let requestTime = await redis.getAsync(`employee-report-${organization_id}`);
                if(requestTime) return res.status(429).json({code: 429, error: null, message: "You have reached maximum retries. Please try again after 60 minutes"})
                if(!requestTime) {
                    await redis.setAsync(
                        `employee-report-${organization_id}`,
                        Date.now(),
                        'EX',
                        60 * 60
                    );
                }
            }

            let {
                startDate: start_date, endDate: end_date,
                startTime, endTime, date
            } = await EmployeeReportsValidator.downloadEmployeeReportCustom().validateAsync(req.body);

            start_date = date;
            end_date = date;
            let startT = moment(date + ' ' + startTime, 'YYYY-MM-DD HH:mm A');
            let endT = moment(date + ' ' + endTime, 'YYYY-MM-DD HH:mm A');
            let timeDiff = endT.diff(startT, 'minutes');
            if (timeDiff > 86400)  return res.status(400).json({ code: 400, data: null, message: reportMessage.find(x => x.id === "21")["en"], error: null });

            let activeEmployee = await EmployeeReportsModel.getAllActiveEmployeeIds(organization_id);

            let employee_ids = activeEmployee.map((item) => (item.id));

            if (employee_ids.length === 0 && employee_id) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(employee_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.status(400).json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }

            const attendanceData = await EmployeeReportsModel.getAttandanceIdsGroupped({
                organization_id, employee_ids, start_date,
                end_date: end_date,
            });

            const attendanceById = {};
            const departmentIds = [];
            for (const { attendance_ids, first_name, last_name, timezone, name, department_id, employee_id, location, location_id, emp_code } of attendanceData) {
                const data = { first_name, last_name, timezone, name, department_id, employee_id, location, location_id, emp_code };
                departmentIds.push(department_id);
                for (const attendanceId of attendance_ids.split(',')) {
                    attendanceById[attendanceId] = data;
                }
            }
            const attendanceIds = Object.keys(attendanceById).map(id => +id);
            const appsWebsById = {};
            let applicationUsed = [];
            let browserHistory = [];

            [applicationUsed, browserHistory] = await Promise.all([
                EmployeeReportsModel.getApplicationUsedCustom(attendanceIds, startTime, endTime, start_date, end_date),
                EmployeeReportsModel.getBrowserHistoryCustom(attendanceIds, startTime, endTime, start_date, end_date),
            ]);

            let applicationIds = _.pluck([...applicationUsed], 'application_id');
            const browseryHistoryAppId = _.pluck([...browserHistory], 'application_id');
            const browserDomainId = _.pluck([...browserHistory,], 'domain_id');
            applicationIds = applicationIds.concat(browserDomainId);
            applicationIds = applicationIds.concat(browseryHistoryAppId);

            const statuses = await EmployeeReportsModel.getApplicationsStatus(applicationIds, departmentIds);
            for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id, applicationIds)) {
                appsWebsById[_id] = name;
            }

            const mapper = (item) => {
                const { first_name, last_name, timezone, name, department_id, location, employee_id, emp_code} = attendanceById[item.attendance_id];
                const { domain_id, application_id } = item;
                item.productivity_id = item?.url ? domain_id : application_id;
                const status = statuses[item.productivity_id];
                const final_status = item.productivity_id in statuses ? ('0' in status ? status['0'] : status[department_id]) : null;
                let result = {
                    _id: item._id,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    total_duration: item.total_duration,
                    active_seconds: item.active_seconds,
                    keystrokes: item.keystrokes.replace(/\u0000/g, ''),
                    idle_seconds: item.total_duration - item.active_seconds,
                    timezone: timezone,
                    employee_id: employee_id,
                    employee_first_name: `${first_name}`,
                    employee_last_name: `${last_name}`,
                    emp_code,
                    department: name,
                    location,
                    status: final_status,
                    category: final_status == 0 ? "Netural" : final_status == 1 ? "Productive" : final_status == 2 ? "Unproductive" : ""
                };
                if (item?.url) {
                    result.browser_name = appsWebsById[application_id];
                    result.domain_name = appsWebsById[domain_id];
                    result.url = item.url;
                } else {
                    result.app_name = appsWebsById[application_id];
                }
                return result;
            };

            let results = {
                browser_history: browserHistory.map(mapper),
                application_used: applicationUsed.map(mapper),
            };

            return res.json({ code: 200, data: results, message: 'Employee Report', error: null });
        } catch (err) {
            console.log('------------', err);
            return res.status(500).json({ code: 500, data: null, message: 'Internal Server Error', error: 'Something went wrong' });
        }
    }

    async getEmployeeReports_new(req, res, next) {
        try {
            const { organization_id, role_id, employee_id } = req.decoded;
            let {
                employee_ids, download_option, startDate: start_date, endDate: end_date, location_id, role_id: employee_role_id, department_ids, skip, limit
            } = await EmployeeReportsValidator.downloadEmployeeReportNew().validateAsync(req.body);

            const max_end_date = moment(start_date).add(2, 'month').format('YYYY-MM-DD');

            if (employee_ids.length === 0 && employee_id) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(employee_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }
            const attendanceData = await EmployeeReportsModel.getAttandanceIdsGroupped_new({
                organization_id, employee_ids, start_date,
                end_date: end_date > max_end_date ? max_end_date : end_date, location_id, department_ids, employee_role_id, skip, limit
            });
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
            const attendanceIds = Object.keys(attendanceById).map(id => +id);
            let attendanceIdsArray = _.chunk(attendanceIds, attendanceIds.length / 3);
            let applicationUsed = [];
            let browserHistory = [];
            const appsWebsById = {};
            // for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id)) {
            //     appsWebsById[_id] = name;
            // }
            const result = await Promise.all([
                getbrowserandapplications(attendanceIdsArray[0], download_option),
                getbrowserandapplications(attendanceIdsArray[1], download_option),
                getbrowserandapplications(attendanceIdsArray[2], download_option)
            ])

            applicationUsed.push(...result[0].applicationUsed, ...result[1].applicationUsed, ...result[2].applicationUsed)
            browserHistory.push(...result[0].browserHistory, ...result[1].browserHistory, ...result[2].browserHistory)
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

            return res.json({ code: 200, data: results, message: 'Employee Report', error: null });
        } catch (err) {
            next(err);
        }
    }

    /** employee new csv download controller */
    async getEmployeeReports_new_CSV(req, res, next) {
        try {
            // console.time('res time');
            const fileDist = __dirname.split('src')[0] + 'public/temp/'
            if (!fs.existsSync(fileDist)) {
                fs.mkdirSync(fileDist);
            }
            let applicationUsedReadableStream = null;
            let browserHistoryReadableStream = null;
            let applicationUsedCsvfileName = null;
            let browserHistoryCsvfileName = null;
            let applicationUsedDownloadLink = null;
            let browserHistoryDownloadLink = null;
            /** json tranfer options */
            const opts = {};
            const transformOpts = { objectMode: true };

            const { organization_id, role_id, employee_id } = req.decoded;
            let {
                employee_ids, download_option, startDate: start_date, endDate: end_date, location_id, role_id: employee_role_id, department_ids, skip, limit
            } = await EmployeeReportsValidator.downloadEmployeeReportNew().validateAsync(req.body);

            const max_end_date = moment(start_date).add(2, 'month').format('YYYY-MM-DD');

            if (employee_ids.length === 0 && employee_id) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(employee_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }
            const attendanceData = await EmployeeReportsModel.getAttandanceIdsGroupped_new({
                organization_id, employee_ids, start_date,
                end_date: end_date > max_end_date ? max_end_date : end_date, location_id, department_ids, employee_role_id, skip, limit
            });
            actionsTracker(req, 'Employees ? reports (%i) requested.', [employee_ids, download_option]);

            /** application used donwload option and stream initilization */
            if (download_option == 1 || download_option == 3) {
                const csvFileName = `application_used_${new Date().getTime()}.csv`;
                applicationUsedReadableStream = new stream.Readable({ objectMode: true, read(size) { } });
                applicationUsedDownloadLink = `${req.headers.origin}/temp/${csvFileName}`;
                applicationUsedCsvfileName = `${fileDist}${csvFileName}`;
                applicationUsedReadableStream.pipe(new Json2csvTransform(opts, transformOpts)).pipe(fs.createWriteStream(applicationUsedCsvfileName));
            }

            /** browser history donwload option and stream initilization */
            if (download_option == 2 || download_option == 3) {
                const csvFileName = `browser_history_${new Date().getTime()}.csv`;
                browserHistoryReadableStream = new stream.Readable({ objectMode: true, read(size) { } });
                browserHistoryDownloadLink = `${req.headers.origin}/temp/${csvFileName}`;
                browserHistoryCsvfileName = `${fileDist}${csvFileName}`;
                browserHistoryReadableStream.pipe(new Json2csvTransform(opts, transformOpts)).pipe(fs.createWriteStream(browserHistoryCsvfileName));
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

            /** attendanceIdsChunkArr logic */
            let attendanceIdsChunkArr = _.chunk(attendanceIds, 10);
            let resultApplicationUsedArr = [];
            let resultbrowserHistoryArr = [];

            for (let i = 0; i < attendanceIdsChunkArr.length; i++) {
                const attendanceIdsArray = attendanceIdsChunkArr[i];

                let applicationUsed = [];
                let browserHistory = [];
                const appsWebsById = {};
                // for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id)) {
                //     appsWebsById[_id] = name;
                // }
                const result = await getbrowserandapplications(attendanceIdsArray, download_option);

                applicationUsed.push(...result.applicationUsed);
                browserHistory.push(...result.browserHistory);

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

                const browser_history_obj_arr = _.sortBy(browserHistory, sorter).map(mapper);
                const application_used_obj_arr = _.sortBy(applicationUsed, sorter).map(mapper);

                resultApplicationUsedArr = [...resultApplicationUsedArr, ...application_used_obj_arr];
                resultbrowserHistoryArr = [...resultbrowserHistoryArr, ...browser_history_obj_arr];
                /** stream writing for every 100 iteration */
                if (i % 100 == 0) {
                    /** writing to the application used stream */
                    if (applicationUsedReadableStream && resultApplicationUsedArr.length) {
                        for (let i = 0; i < resultApplicationUsedArr.length; i++) {
                            applicationUsedReadableStream.push(resultApplicationUsedArr[i]);
                        }
                        resultApplicationUsedArr = [];
                    }

                    /** writing to the browser history used stream */
                    if (browserHistoryReadableStream && resultbrowserHistoryArr.length) {
                        for (let i = 0; i < resultbrowserHistoryArr.length; i++) {
                            browserHistoryReadableStream.push(resultbrowserHistoryArr[i]);
                        }
                        resultbrowserHistoryArr = [];
                    }
                }
            }
            /** for loop ends */

            /** writing to the application used stream */
            if (applicationUsedReadableStream && resultApplicationUsedArr.length) {
                for (let i = 0; i < resultApplicationUsedArr.length; i++) {
                    applicationUsedReadableStream.push(resultApplicationUsedArr[i]);
                }
                resultApplicationUsedArr = [];
            }
            /** writing to the browser history used stream */
            if (browserHistoryReadableStream && resultbrowserHistoryArr.length) {
                for (let i = 0; i < resultbrowserHistoryArr.length; i++) {
                    browserHistoryReadableStream.push(resultbrowserHistoryArr[i]);
                }
                resultbrowserHistoryArr = [];
            }
            // console.timeEnd('res time');
            return res.json({ code: 200, data: { applicationUsedDownloadLink, browserHistoryDownloadLink }, message: 'Employee Report', error: null });
        } catch (err) {
            next(err);
        }
    }

    /** employee csv download with stream  */
    async getEmployeeReports_CSV(req, res, next) {
        try {
            // console.time('res time');
            const fileDist = __dirname.split('src')[0] + 'public/temp/'
            if (!fs.existsSync(fileDist)) {
                fs.mkdirSync(fileDist);
            }
            let applicationUsedReadableStream = null;
            let browserHistoryReadableStream = null;
            let applicationUsedCsvfileName = null;
            let browserHistoryCsvfileName = null;
            let applicationUsedDownloadLink = null;
            let browserHistoryDownloadLink = null;

            const { organization_id, role_id, employee_id } = req.decoded;
            let {
                employee_ids, download_option, startDate: start_date, endDate: end_date, location_id, role_id: employee_role_id, department_ids
            } = await EmployeeReportsValidator.downloadEmployeeReport().validateAsync(req.body);

            const max_end_date = moment(start_date).add(2, 'month').format('YYYY-MM-DD');

            /** json tranfer options */
            const opts = {};
            const transformOpts = { objectMode: true };

            /** application used donwload option and stream initilization */
            if (download_option == 1 || download_option == 3) {
                const csvFileName = `application_used_${new Date().getTime()}.csv`;
                applicationUsedReadableStream = new stream.Readable({ objectMode: true, read(size) { } });
                applicationUsedDownloadLink = `${req.headers.origin}/temp/${csvFileName}`;
                applicationUsedCsvfileName = `${fileDist}${csvFileName}`;
                applicationUsedReadableStream.pipe(new Json2csvTransform(opts, transformOpts)).pipe(fs.createWriteStream(applicationUsedCsvfileName));
            }

            /** browser history donwload option and stream initilization */
            if (download_option == 2 || download_option == 3) {
                const csvFileName = `browser_history_${new Date().getTime()}.csv`;
                browserHistoryReadableStream = new stream.Readable({ objectMode: true, read(size) { } });
                browserHistoryCsvfileName = `${fileDist}${csvFileName}`;
                browserHistoryDownloadLink = `${req.headers.origin}/temp/${csvFileName}`;
                browserHistoryReadableStream.pipe(new Json2csvTransform(opts, transformOpts)).pipe(fs.createWriteStream(browserHistoryCsvfileName));
            }


            if (employee_ids.length === 0 && employee_id) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(employee_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }
            const attendanceData = await EmployeeReportsModel.getAttandanceIdsGroupped({
                organization_id, employee_ids, start_date,
                end_date: end_date > max_end_date ? max_end_date : end_date, location_id, department_ids, employee_role_id
            });
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
            const attendanceIds = Object.keys(attendanceById).map(id => +id);
            /**
             * creating batches of appliction ids and fetching there activities
             */
            const attendanceIdsChunkArr = _.chunk(attendanceIds, 10);

            let resultApplicationUsedArr = [];
            let resultbrowserHistoryArr = [];
            /**  for loop for the batched attendance ids */
            for (let i = 0; i < attendanceIdsChunkArr.length; i++) {


                const attendanceIds = attendanceIdsChunkArr[i];
                const appsWebsById = {};
                // for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id, applicationIds)) {
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
                const statuses = await EmployeeReportsModel.getApplicationsStatus(applicationIds, departmentIds);

                for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id, applicationIds)) {
                    appsWebsById[_id] = name;
                }

                /** helper begin */
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
                /** helper end */

                // for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id, applicationIds)) {
                //     appsWebsById[_id] = name;
                // }

                browserHistory.forEach(setSortKey);
                applicationUsed.forEach(setSortKey);

                const browser_history_obj_arr = _.sortBy(browserHistory, sorter).map(mapper);
                const application_used_obj_arr = _.sortBy(applicationUsed, sorter).map(mapper);

                resultApplicationUsedArr = [...resultApplicationUsedArr, ...application_used_obj_arr];
                resultbrowserHistoryArr = [...resultbrowserHistoryArr, ...browser_history_obj_arr];

                /** stream writing for every 100 iteration */
                if (i % 100 == 0) {
                    /** writing to the application used stream */
                    if (applicationUsedReadableStream && resultApplicationUsedArr.length) {
                        for (let i = 0; i < resultApplicationUsedArr.length; i++) {
                            applicationUsedReadableStream.push(resultApplicationUsedArr[i]);
                        }
                        resultApplicationUsedArr = [];
                    }

                    /** writing to the browser history used stream */
                    if (browserHistoryReadableStream && resultbrowserHistoryArr.length) {
                        for (let i = 0; i < resultbrowserHistoryArr.length; i++) {
                            browserHistoryReadableStream.push(resultbrowserHistoryArr[i]);
                        }
                        resultbrowserHistoryArr = [];
                    }
                }
            }
            /** for loop ends */

            /** writing to the application used stream */
            if (applicationUsedReadableStream && resultApplicationUsedArr.length) {
                for (let i = 0; i < resultApplicationUsedArr.length; i++) {
                    applicationUsedReadableStream.push(resultApplicationUsedArr[i]);
                }
                resultApplicationUsedArr = [];
            }
            /** writing to the browser history used stream */
            if (browserHistoryReadableStream && resultbrowserHistoryArr.length) {
                for (let i = 0; i < resultbrowserHistoryArr.length; i++) {
                    browserHistoryReadableStream.push(resultbrowserHistoryArr[i]);
                }
                resultbrowserHistoryArr = [];
            }

            return res.json({ code: 200, data: { applicationUsedDownloadLink, browserHistoryDownloadLink }, message: 'Employee Report', error: null });
        } catch (err) {
            console.log('------------', err);
            next(err);
        }
    }


    /** employee excel download with stream  */
    async getEmployeeReports_excel(req, res, next) {
        if (config.COMBINED_REPORT_DOWNLOAD_ORG_ID.includes(req.decoded.organization_id)) {
            return this.getEmployeeReports_excel_combined(req, res, next);
        }
        /** function to get the sheet columns name and key */
        function getSheetColumns(obj) {
            let result = [];
            const columnArr = Object.keys(obj);
            for (let i = 0; i < columnArr.length; i++) {
                result.push({
                    key: columnArr[i],
                    header: columnArr[i].split('_').map(e => e[0].toUpperCase() + e.slice(1)).join(' '),
                    width: 20
                });
            }
            return result;
        }

        let applicationUsedReportActivityDoc = null;
        let browserHistoryReportActivityDoc = null
        try {
            const fileDist = __dirname.split('src')[0] + 'public/temp/'
            if (!fs.existsSync(fileDist)) {
                fs.mkdirSync(fileDist);
            }
            let applicationUsedExcelfileName = null;
            let browserHistoryExcelfileName = null;
            let applicationUsedDownloadLink = null;
            let browserHistoryDownloadLink = null;
            let ApplicationUsedWorkBook = null;
            let BrowserHistoryWorkBook = null;

            const { organization_id, role_id, employee_id, user_id, language, is_admin } = req.decoded;
            let {
                employee_ids, download_option, startDate: start_date, endDate: end_date, location_id, role_id: employee_role_id, department_ids, selected_columns, nonAdminId, searchKeyword
            } = await EmployeeReportsValidator.downloadEmployeeReport().validateAsync(req.body);

            let selectedColumns = selected_columns;
            const max_end_date = moment(start_date).add(2, 'month').format('YYYY-MM-DD');

            /** condition to restrict multiple file download */
            let typeArr = [];
            if (download_option == 1) {
                typeArr.push('application_used');
                const pendingRequestCount = await ReportActivityLogModel.getPendingReportDownloadCount({ user_id, organization_id, typeArr });
                if (pendingRequestCount >= typeArr.length) return res.json({ code: 400, data: null, message: 'Multiple Download request present', error: null })
            } else if (download_option == 2) {
                typeArr.push('browser_history');
                const pendingRequestCount = await ReportActivityLogModel.getPendingReportDownloadCount({ user_id, organization_id, typeArr });
                if (pendingRequestCount >= typeArr.length) return res.json({ code: 400, data: null, message: 'Multiple Download request present', error: null })
            } else if (download_option == 3) {
                typeArr.push('application_used');
                typeArr.push('browser_history');
                const pendingRequestCount = await ReportActivityLogModel.getPendingReportDownloadCount({ user_id, organization_id, typeArr });
                if (pendingRequestCount >= typeArr.length) return res.json({ code: 400, data: null, message: 'Multiple Download request present', error: null })
            }

            if (employee_ids.length === 0 && employee_id) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(employee_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }

            if (nonAdminId && is_admin) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(nonAdminId, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }

            /** application used donwload option and stream initilization */
            let apiUrlStr = process.env.NODE_ENV == 'development' ? process.env.API_URL_DEV : process.env.API_URL_PRODUCTION;
            if (download_option == 1 || download_option == 3) {
                const excelName = reportMessage.find(x => x.id === "18")[language] || reportMessage.find(x => x.id === "18")["en"];
                const excelFileName = `${excelName}_${user_id}_${new Date().getTime()}.xlsx`;
                applicationUsedDownloadLink = `https://${apiUrlStr}/temp/${excelFileName}`;
                applicationUsedExcelfileName = `${fileDist}${excelFileName}`;
                applicationUsedReportActivityDoc = await ReportActivityLogModel.addReportActivity({ type: 'application_used', filename: excelFileName, user_id, organization_id, file_path: applicationUsedExcelfileName });
                ApplicationUsedWorkBook = new ExcelJs.stream.xlsx.WorkbookWriter({ stream: fs.createWriteStream(applicationUsedExcelfileName) });
            }

            /** browser history donwload option and stream initilization */
            if (download_option == 2 || download_option == 3) {
                const excelName = reportMessage.find(x => x.id === "19")[language] || reportMessage.find(x => x.id === "19")["en"];
                const excelFileName = `${excelName}_${user_id}_${new Date().getTime()}.xlsx`;
                browserHistoryExcelfileName = `${fileDist}${excelFileName}`;
                browserHistoryDownloadLink = `https://${apiUrlStr}/temp/${excelFileName}`;
                browserHistoryReportActivityDoc = await ReportActivityLogModel.addReportActivity({ type: 'browser_history', filename: excelFileName, user_id, organization_id, file_path: browserHistoryExcelfileName });
                BrowserHistoryWorkBook = new ExcelJs.stream.xlsx.WorkbookWriter({ stream: fs.createWriteStream(browserHistoryExcelfileName) });
            }
            // for download option as all, we will download all the columns
            if (!selectedColumns || download_option == 3) {
                selectedColumns = [];
            }
            else {
                selectedColumns.push('computer_name')
            }

            const attendanceData = await EmployeeReportsModel.getAttandanceIdsGroupped({
                organization_id, employee_ids, start_date,
                end_date: end_date > max_end_date ? max_end_date : end_date, location_id, department_ids, employee_role_id
            });
            actionsTracker(req, 'Employees ? reports (%i) requested.', [employee_ids, download_option]);

            const attendanceById = {};
            const departmentIds = [];
            for (const { attendance_ids, first_name, last_name, timezone, name, department_id, employee_id, location, location_id, computer_name } of attendanceData) {
                const data = { first_name, last_name, timezone, name, department_id, employee_id, location, location_id, computer_name };
                departmentIds.push(department_id);
                for (const attendanceId of attendance_ids.split(',')) {
                    attendanceById[attendanceId] = data;
                }
            }
            const attendanceIds = Object.keys(attendanceById).map(id => +id);
            res.json({ code: 200, data: "Request Accepted, Report getting Generated !", message: 'Employee Report', error: null });

            /**
             * creating batches of appliction ids and fetching there activities
             */
            const attendanceIdsChunkArr = _.chunk(attendanceIds, 10);

            let resultApplicationUsedArr = [];
            let resultbrowserHistoryArr = [];
            let applicationUsedWorksheet = null;
            let browserHistoryWorksheet = null;
            let applicationUsedSheetNo = 1;
            let browserHistorySheetNo = 1;
            let applicationUsedWorkBookRowNo = 0;
            let browserHistoryWorkBookRowNo = 0;
            let dataResultApplicationUsedArr = 0;
            let dataResultBrowserHistoryArr = 0;

            if (applicationUsedReportActivityDoc) await ReportActivityLogModel.updateReportActivity({ _id: applicationUsedReportActivityDoc._id }, { stage: 'generating' });
            if (browserHistoryReportActivityDoc) await ReportActivityLogModel.updateReportActivity({ _id: browserHistoryReportActivityDoc._id }, { stage: 'generating' });
            /**  for loop for the batched attendance ids */
            for (let i = 0; i < attendanceIdsChunkArr.length; i++) {

                const attendanceIds = attendanceIdsChunkArr[i];
                const appsWebsById = {};
                let applicationUsed = [];
                let browserHistory = [];
                if (config?.SEARCH_REPORT_ORG.split(',').includes(organization_id.toString())) {
                    let searchWebUsed = await EmployeeReportsModel.getOrganizationAppsWebsNew(organization_id, searchKeyword)
                    let searchAppIds = _.pluck([...searchWebUsed], '_id');
                    switch (download_option) {
                        case 1: applicationUsed = await EmployeeReportsModel.getApplicationUsedNew(attendanceIds,searchAppIds);
                            break;
                        case 2:
                            browserHistory = await EmployeeReportsModel.getBrowserHistoryNew(attendanceIds,searchAppIds);
                            break;
                        case 3:
                            [applicationUsed, browserHistory] = await Promise.all([
                                EmployeeReportsModel.getApplicationUsedNew(attendanceIds, searchAppIds),
                                EmployeeReportsModel.getBrowserHistoryNew(attendanceIds, searchAppIds),
                            ]);
                            break;
                    }             
                } else {
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
            }
                let applicationIds = _.pluck([...browserHistory, ...applicationUsed], '_id');
                const browseryHistoryAppId = _.pluck([...browserHistory], 'application_id');
                applicationIds = applicationIds.concat(browseryHistoryAppId);
                const statuses = await EmployeeReportsModel.getApplicationsStatus(applicationIds, departmentIds);

                for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id, applicationIds)) {
                    appsWebsById[_id] = name;
                }

                /** helper begin */
                const mapper = (item) => {
                    const { first_name, last_name, timezone, name, department_id, location, computer_name } = attendanceById[item.attendance_id];
                    const status = statuses[item._id];
                    const { domain_id, application_id } = item;
                    let isFilterKeyStroke = config.KEYSTROKE_FILTER_TEXT.includes(organization_id);
                    const result = {
                        ..._.omit(item, '_id', 'attendance_id', 'domain_id', 'application_id', 'sortKey'),
                        keystrokes: filterKeystrokes(item.keystrokes.replace(/\u0000/g, ''), isFilterKeyStroke),
                        timezone: timezone,
                        employee_name: `${first_name} ${last_name}`,
                        computer_name: computer_name,
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
                    result.title = item.title || '';
                    return result;
                };
                const setSortKey = (item) => {
                    item.sortKey = `${attendanceById[item.attendance_id].employee_id}-${+item.start_time}`;
                };
                const sorter = item => item.sortKey;
                /** helper end */

                browserHistory.forEach(setSortKey);
                applicationUsed.forEach(setSortKey);

                const application_used_obj_arr = formatApplicationUsedFunction(_.sortBy(applicationUsed, sorter).map(mapper), language, selectedColumns, organization_id);
                const browser_history_obj_arr = formatBrowserHistoryFunction(_.sortBy(browserHistory, sorter).map(mapper), language, selectedColumns, organization_id);

                resultApplicationUsedArr = [...resultApplicationUsedArr, ...application_used_obj_arr];
                resultbrowserHistoryArr = [...resultbrowserHistoryArr, ...browser_history_obj_arr];
                dataResultApplicationUsedArr = resultApplicationUsedArr?.length;
                dataResultBrowserHistoryArr = resultbrowserHistoryArr?.length;
                let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
                if (ipMaskingOrgId.includes(String(organization_id))){
                    resultbrowserHistoryArr = resultbrowserHistoryArr.map(x => {
                        x.domain = maskingIP(x.domain);
                        x.URL = maskingIP(x.URL);
                        return x;
                    });
                }

                /** writing to the application used stream */
                if (resultApplicationUsedArr.length) {
                    for (let i = 0; i < resultApplicationUsedArr.length; i++) {
                        if (ApplicationUsedWorkBook && applicationUsedWorkBookRowNo % 500000 == 0) {
                            if (applicationUsedWorksheet) applicationUsedWorksheet.commit();
                            applicationUsedWorksheet = ApplicationUsedWorkBook.addWorksheet(`Sheet ${applicationUsedSheetNo++}`);
                            applicationUsedWorksheet.columns = getSheetColumns(resultApplicationUsedArr[i])
                        }
                        applicationUsedWorksheet.addRow(resultApplicationUsedArr[i]).commit();
                        applicationUsedWorkBookRowNo++;
                    }
                    resultApplicationUsedArr = [];
                }

                /** writing to the browser history used stream */
                if (resultbrowserHistoryArr.length) {
                    for (let i = 0; i < resultbrowserHistoryArr.length; i++) {
                        if (BrowserHistoryWorkBook && browserHistoryWorkBookRowNo % 500000 == 0) {
                            if (browserHistoryWorksheet) browserHistoryWorksheet.commit();
                            browserHistoryWorksheet = BrowserHistoryWorkBook.addWorksheet(`Sheet ${browserHistorySheetNo++}`);
                            browserHistoryWorksheet.columns = getSheetColumns(resultbrowserHistoryArr[i]);
                        }
                        browserHistoryWorksheet.addRow(resultbrowserHistoryArr[i]).commit();
                        browserHistoryWorkBookRowNo++;
                    }
                    resultbrowserHistoryArr = [];
                }
            }
            /** for loop ends */

            /** row commit if row is let then the batch */
            if (resultApplicationUsedArr.length) {
                for (let i = 0; i < resultApplicationUsedArr.length; i++) {
                    applicationUsedSheet.addRow(resultApplicationUsedArr[i]).commit();
                    applicationUsedWorkBookRowNo++;
                }
                resultApplicationUsedArr = [];
            }

            if (resultbrowserHistoryArr.length) {
                for (let i = 0; i < resultbrowserHistoryArr.length; i++) {
                    browserHistorySheet.addRow(resultbrowserHistoryArr[i]).commit();
                }
                resultbrowserHistoryArr = [];
            }

            /** final commit */
            if (applicationUsedWorksheet) applicationUsedWorksheet.commit();
            if (browserHistoryWorksheet) browserHistoryWorksheet.commit();
            if (ApplicationUsedWorkBook) ApplicationUsedWorkBook.commit();
            if (BrowserHistoryWorkBook) BrowserHistoryWorkBook.commit();

            /** log */
            if (applicationUsedReportActivityDoc) {
                const stats = fs.statSync(applicationUsedReportActivityDoc.file_path);
                await ReportActivityLogModel.updateReportActivity({ _id: applicationUsedReportActivityDoc._id }, { stage: 'done', download_link: applicationUsedDownloadLink, no_of_rows: applicationUsedWorkBookRowNo, file_size: `${stats.size} bytes` });
            }
            if (browserHistoryReportActivityDoc) {
                const stats = fs.statSync(browserHistoryReportActivityDoc.file_path);
                await ReportActivityLogModel.updateReportActivity({ _id: browserHistoryReportActivityDoc._id }, { stage: 'done', download_link: browserHistoryDownloadLink, no_of_rows: browserHistoryWorkBookRowNo, file_size: `${stats.size} bytes` });
            }

            /** send socket notification */
            await WebSocketNotification.sendReportMessage({
                message: `Files are ready to Download, and expires in ${process.env.REPORT_FILE_DELETE_AFTER_TIME.match(/[h]/) ? process.env.REPORT_FILE_DELETE_AFTER_TIME.replace('h', " hours") : process.env.REPORT_FILE_DELETE_AFTER_TIME.replace(/[a-z]/, " minutes")}`,
                userId: user_id
            });
            if (dataResultApplicationUsedArr == 0 || dataResultBrowserHistoryArr == 0) {
                // dataResultApplicationUsedArr
                // dataResultBrowserHistoryArr
                if (applicationUsedReportActivityDoc && dataResultApplicationUsedArr == 0 ) {
                    fs.unlink(applicationUsedReportActivityDoc.file_path, (err) => {
                        if (err) throw err;
                        console.log(`${applicationUsedReportActivityDoc.file_path} was deleted`);
                    });
                    await ReportActivityLogModel.updateReportActivity({ _id: applicationUsedReportActivityDoc._id }, { stage: 'done', download_link: applicationUsedDownloadLink, no_of_rows: applicationUsedWorkBookRowNo, is_deleted: false, is_active: false, is_downloaded: true });
                }
                if (browserHistoryReportActivityDoc && dataResultBrowserHistoryArr == 0) {
                    fs.unlink(browserHistoryReportActivityDoc.file_path, (err) => {
                        if (err) throw err;
                        console.log(`${browserHistoryReportActivityDoc.file_path} was deleted`);
                    });
                    await ReportActivityLogModel.updateReportActivity({ _id: browserHistoryReportActivityDoc._id }, { stage: 'done', download_link: browserHistoryDownloadLink, no_of_rows: browserHistoryWorkBookRowNo, is_deleted: false, is_active: false, is_downloaded: true });
                }
            }
        } catch (err) {
            console.log('------------', err);
            if (download_type === 1)
                await ReportActivityLogModel.updateReportActivity({ _id: applicationUsedReportActivityDoc._id }, { is_active: false, is_downloaded: true });
            else if (download_type === 2)
                await ReportActivityLogModel.updateReportActivity({ _id: browserHistoryReportActivityDoc._id }, { is_active: false, is_downloaded: true });
            else if (download_type === 3) {
                await Promise.all([
                    ReportActivityLogModel.updateReportActivity({ _id: applicationUsedReportActivityDoc._id }, { is_active: false, is_downloaded: true }),
                    ReportActivityLogModel.updateReportActivity({ _id: browserHistoryReportActivityDoc._id }, { is_active: false, is_downloaded: true })
                ]);
            }
            next(err);
        }
    }
    /** excel changes  */

    /** employee excel download with stream - combined report */
    async getEmployeeReports_excel_combined(req, res, next) {

        /** function to get the sheet columns name and key */
        function getSheetColumns(obj) {
            let result = [];
            const columnArr = Object.keys(obj);
            
            for (let i = 0; i < columnArr.length; i++) {
                const columnKey = columnArr[i];
                // Skip mouseClks fields as they are dynamic and don't need headers
                if (columnKey.startsWith('mouseClks_')) {
                    continue;
                }
                result.push({
                    key: columnKey,
                    header: columnKey,  // Use the key as-is since formatApplicationUsedFunction already provides translated headers
                    width: 20
                });
            }
            return result;
        }

        let reportActivityDoc = null;
        try {
            const fileDist = __dirname.split('src')[0] + 'public/temp/'
            if (!fs.existsSync(fileDist)) {
                fs.mkdirSync(fileDist);
            }
            let excelfileName = null;
            let downloadLink = null;
            let WorkBook = null;

            const { organization_id, role_id, employee_id, user_id, language, is_admin } = req.decoded;
            let {
                employee_ids, download_option, startDate: start_date, endDate: end_date, location_id, role_id: employee_role_id, department_ids, selected_columns, nonAdminId, searchKeyword
            } = await EmployeeReportsValidator.downloadEmployeeReport().validateAsync(req.body);

            let selectedColumns = selected_columns;
            const max_end_date = moment(start_date).add(2, 'month').format('YYYY-MM-DD');

            /** condition to restrict multiple file download */
            const typeArr = ['combined_report'];
            const pendingRequestCount = await ReportActivityLogModel.getPendingReportDownloadCount({ user_id, organization_id, typeArr });
            if (pendingRequestCount >= typeArr.length) return res.json({ code: 400, data: null, message: 'Multiple Download request present', error: null })

            if (employee_ids.length === 0 && employee_id) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(employee_id, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }

            if (nonAdminId && is_admin) {
                employee_ids = _.pluck(await EmployeeReportsModel.getEmployeeAssignedToManager(nonAdminId, role_id), 'employee_id');
                if (employee_ids.length === 0) return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "1")[language] || reportMessage.find(x => x.id === "1")["en"], error: null });
            }

            /** combined report stream initialization */
            let apiUrlStr = process.env.NODE_ENV == 'development' ? process.env.API_URL_DEV : process.env.API_URL_PRODUCTION;
            const excelName = reportMessage.find(x => x.id === "20") ? (reportMessage.find(x => x.id === "20")[language] || reportMessage.find(x => x.id === "20")["en"]) : "Combined_Employee_Report";
            const excelFileName = `Combined_Report_${user_id}_${new Date().getTime()}.xlsx`;
            downloadLink = `https://${apiUrlStr}/temp/${excelFileName}`;
            excelfileName = `${fileDist}${excelFileName}`;
            reportActivityDoc = await ReportActivityLogModel.addReportActivity({ type: 'combined_report', filename: excelFileName, user_id, organization_id, file_path: excelfileName });
            WorkBook = new ExcelJs.stream.xlsx.WorkbookWriter({ stream: fs.createWriteStream(excelfileName) });

            // For combined report, always download all columns (empty array means all columns)
            // If selectedColumns is provided and has values, add computer_name to it
            if (!selectedColumns || selectedColumns.length === 0) {
                selectedColumns = [];  // Empty array means ALL columns in format functions
            } else {
                // Only add computer_name if we have specific columns selected
                if (!selectedColumns.includes('computer_name')) {
                    selectedColumns.push('computer_name');
                }
            }

            const attendanceData = await EmployeeReportsModel.getAttandanceIdsGroupped({
                organization_id, employee_ids, start_date,
                end_date: end_date > max_end_date ? max_end_date : end_date, location_id, department_ids, employee_role_id
            });
            actionsTracker(req, 'Employees combined reports requested.', [employee_ids]);

            const attendanceById = {};
            const departmentIds = [];
            for (const { attendance_ids, first_name, last_name, timezone, name, department_id, employee_id, location, location_id, computer_name } of attendanceData) {
                const data = { first_name, last_name, timezone, name, department_id, employee_id, location, location_id, computer_name };
                departmentIds.push(department_id);
                for (const attendanceId of attendance_ids.split(',')) {
                    attendanceById[attendanceId] = data;
                }
            }
            const attendanceIds = Object.keys(attendanceById).map(id => +id);
            res.json({ code: 200, data: "Request Accepted, Report getting Generated !", message: 'Combined Employee Report', error: null });

            /**
             * creating batches of application ids and fetching their activities
             */
            const attendanceIdsChunkArr = _.chunk(attendanceIds, 10);

            let resultApplicationUsedArr = [];
            let resultbrowserHistoryArr = [];
            let applicationUsedWorksheet = null;
            let browserHistoryWorksheet = null;
            let applicationUsedSheetNo = 1;
            let browserHistorySheetNo = 1;
            let applicationUsedWorkBookRowNo = 0;
            let browserHistoryWorkBookRowNo = 0;
            let dataResultApplicationUsedArr = 0;
            let dataResultBrowserHistoryArr = 0;

            if (reportActivityDoc) await ReportActivityLogModel.updateReportActivity({ _id: reportActivityDoc._id }, { stage: 'generating' });

            /**  for loop for the batched attendance ids */
            for (let i = 0; i < attendanceIdsChunkArr.length; i++) {

                const attendanceIds = attendanceIdsChunkArr[i];
                const appsWebsById = {};
                let applicationUsed = [];
                let browserHistory = [];
                
                // Always fetch both application and browser history for combined report
                if (config?.SEARCH_REPORT_ORG.split(',').includes(organization_id.toString())) {
                    let searchWebUsed = await EmployeeReportsModel.getOrganizationAppsWebsNew(organization_id, searchKeyword)
                    let searchAppIds = _.pluck([...searchWebUsed], '_id');
                    [applicationUsed, browserHistory] = await Promise.all([
                        EmployeeReportsModel.getApplicationUsedNew(attendanceIds, searchAppIds),
                        EmployeeReportsModel.getBrowserHistoryNew(attendanceIds, searchAppIds),
                    ]);
                } else {
                    [applicationUsed, browserHistory] = await Promise.all([
                        EmployeeReportsModel.getApplicationUsed(attendanceIds),
                        EmployeeReportsModel.getBrowserHistory(attendanceIds),
                    ]);
                }

                let applicationIds = _.pluck([...browserHistory, ...applicationUsed], '_id');
                const browseryHistoryAppId = _.pluck([...browserHistory], 'application_id');
                applicationIds = applicationIds.concat(browseryHistoryAppId);
                const statuses = await EmployeeReportsModel.getApplicationsStatus(applicationIds, departmentIds);

                for (const { _id, name } of await EmployeeReportsModel.getOrganizationAppsWebs(organization_id, applicationIds)) {
                    appsWebsById[_id] = name;
                }

                /** helper begin */
                const mapper = (item) => {
                    const { first_name, last_name, timezone, name, department_id, location, computer_name } = attendanceById[item.attendance_id];
                    const status = statuses[item._id];
                    const { domain_id, application_id } = item;
                    let isFilterKeyStroke = config.KEYSTROKE_FILTER_TEXT.includes(organization_id);
                    const result = {
                        ..._.omit(item, '_id', 'attendance_id', 'domain_id', 'application_id', 'sortKey'),
                        keystrokes: filterKeystrokes(item.keystrokes.replace(/\u0000/g, ''), isFilterKeyStroke),
                        timezone: timezone,
                        employee_name: `${first_name} ${last_name}`,
                        computer_name: computer_name,
                        department: name,
                        location,
                        status: item._id in statuses ? ('0' in status ? status['0'] : status[department_id]) : null,
                        mouseClks: item.mouseClks,
                    };
                    if ('domain_id' in item) {
                        result.browser_name = appsWebsById[application_id];
                        result.domain_name = appsWebsById[domain_id];
                    } else {
                        result.app_name = appsWebsById[application_id];
                    }
                    result.title = item.title || '';
                    return result;
                };
                const setSortKey = (item) => {
                    item.sortKey = `${attendanceById[item.attendance_id].employee_id}-${+item.start_time}`;
                };
                const sorter = item => item.sortKey;
                /** helper end */

                browserHistory.forEach(setSortKey);
                applicationUsed.forEach(setSortKey);

                let application_used_obj_arr = formatApplicationUsedFunction(_.sortBy(applicationUsed, sorter).map(mapper), language, selectedColumns, organization_id);
                let browser_history_obj_arr = formatBrowserHistoryFunction(_.sortBy(browserHistory, sorter).map(mapper), language, selectedColumns, organization_id);

                // Remove mouseClks fields from the objects as they create dynamic columns
                application_used_obj_arr = application_used_obj_arr.map(obj => {
                    const cleanObj = {};
                    for (let key in obj) {
                        if (!key.startsWith('mouseClks_')) {
                            cleanObj[key] = obj[key];
                        }
                    }
                    return cleanObj;
                });

                browser_history_obj_arr = browser_history_obj_arr.map(obj => {
                    const cleanObj = {};
                    for (let key in obj) {
                        if (!key.startsWith('mouseClks_')) {
                            cleanObj[key] = obj[key];
                        }
                    }
                    return cleanObj;
                });

                resultApplicationUsedArr = [...resultApplicationUsedArr, ...application_used_obj_arr];
                resultbrowserHistoryArr = [...resultbrowserHistoryArr, ...browser_history_obj_arr];
                dataResultApplicationUsedArr = application_used_obj_arr?.length;
                dataResultBrowserHistoryArr = browser_history_obj_arr?.length;
                
                let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
                if (ipMaskingOrgId.includes(String(organization_id))){
                    resultbrowserHistoryArr = resultbrowserHistoryArr.map(x => {
                        x.domain = maskingIP(x.domain);
                        x.URL = maskingIP(x.URL);
                        return x;
                    });
                }

                /** writing to the application used sheet */
                if (resultApplicationUsedArr.length) {
                    for (let j = 0; j < resultApplicationUsedArr.length; j++) {
                        if (applicationUsedWorkBookRowNo % 500000 == 0) {
                            if (applicationUsedWorksheet) applicationUsedWorksheet.commit();
                            applicationUsedWorksheet = WorkBook.addWorksheet(`Application Used ${applicationUsedSheetNo++}`);
                            applicationUsedWorksheet.columns = getSheetColumns(resultApplicationUsedArr[j])
                        }
                        applicationUsedWorksheet.addRow(resultApplicationUsedArr[j]).commit();
                        applicationUsedWorkBookRowNo++;
                    }
                    resultApplicationUsedArr = [];
                }

                /** writing to the browser history sheet */
                if (resultbrowserHistoryArr.length) {
                    for (let k = 0; k < resultbrowserHistoryArr.length; k++) {
                        if (browserHistoryWorkBookRowNo % 500000 == 0) {
                            if (browserHistoryWorksheet) browserHistoryWorksheet.commit();
                            browserHistoryWorksheet = WorkBook.addWorksheet(`Browser History ${browserHistorySheetNo++}`);
                            browserHistoryWorksheet.columns = getSheetColumns(resultbrowserHistoryArr[k]);
                        }
                        browserHistoryWorksheet.addRow(resultbrowserHistoryArr[k]).commit();
                        browserHistoryWorkBookRowNo++;
                    }
                    resultbrowserHistoryArr = [];
                }
            }
            /** for loop ends */

            /** row commit if row is less than the batch */
            if (resultApplicationUsedArr.length) {
                for (let i = 0; i < resultApplicationUsedArr.length; i++) {
                    if (!applicationUsedWorksheet) {
                        applicationUsedWorksheet = WorkBook.addWorksheet(`Application Used ${applicationUsedSheetNo++}`);
                        applicationUsedWorksheet.columns = getSheetColumns(resultApplicationUsedArr[i]);
                    }
                    applicationUsedWorksheet.addRow(resultApplicationUsedArr[i]).commit();
                    applicationUsedWorkBookRowNo++;
                }
                resultApplicationUsedArr = [];
            }

            if (resultbrowserHistoryArr.length) {
                for (let i = 0; i < resultbrowserHistoryArr.length; i++) {
                    if (!browserHistoryWorksheet) {
                        browserHistoryWorksheet = WorkBook.addWorksheet(`Browser History ${browserHistorySheetNo++}`);
                        browserHistoryWorksheet.columns = getSheetColumns(resultbrowserHistoryArr[i]);
                    }
                    browserHistoryWorksheet.addRow(resultbrowserHistoryArr[i]).commit();
                    browserHistoryWorkBookRowNo++;
                }
                resultbrowserHistoryArr = [];
            }

            /** final commit */
            if (applicationUsedWorksheet) applicationUsedWorksheet.commit();
            if (browserHistoryWorksheet) browserHistoryWorksheet.commit();
            if (WorkBook) await WorkBook.commit();

            /** log */
            if (reportActivityDoc && (applicationUsedWorkBookRowNo > 0 || browserHistoryWorkBookRowNo > 0)) {
                const stats = fs.statSync(reportActivityDoc.file_path);
                await ReportActivityLogModel.updateReportActivity({ _id: reportActivityDoc._id }, { 
                    stage: 'done', 
                    download_link: downloadLink, 
                    no_of_rows: applicationUsedWorkBookRowNo + browserHistoryWorkBookRowNo, 
                    file_size: `${stats.size} bytes` 
                });
            }

            /** send socket notification */
            await WebSocketNotification.sendReportMessage({
                message: `Combined report is ready to Download, and expires in ${process.env.REPORT_FILE_DELETE_AFTER_TIME.match(/[h]/) ? process.env.REPORT_FILE_DELETE_AFTER_TIME.replace('h', " hours") : process.env.REPORT_FILE_DELETE_AFTER_TIME.replace(/[a-z]/, " minutes")}`,
                userId: user_id
            });

            if (applicationUsedWorkBookRowNo == 0 && browserHistoryWorkBookRowNo == 0) {
                if (reportActivityDoc) {
                    fs.unlink(reportActivityDoc.file_path, (err) => {
                        if (err) console.log('Error deleting file:', err);
                        console.log(`${reportActivityDoc.file_path} was deleted - no data found`);
                    });
                    await ReportActivityLogModel.updateReportActivity({ _id: reportActivityDoc._id }, { 
                        stage: 'done', 
                        download_link: downloadLink, 
                        no_of_rows: 0, 
                        is_deleted: false, 
                        is_active: false, 
                        is_downloaded: true 
                    });
                }
            }
        } catch (err) {
            console.log('Combined Report Error: ', err);
            if (reportActivityDoc) {
                await ReportActivityLogModel.updateReportActivity({ _id: reportActivityDoc._id }, { is_active: false, is_downloaded: true });
            }
            next(err);
        }
    }

    async getAppWebUsage(req, res, next) {

        const language = req.decoded.language;

        try {
            let { organization_id, role_id, employee_id: managerId } = req.decoded;
            let {
                employee_ids, request_option, startDate, location_ids, department_ids, endDate, skip, limit, sortOrder, sortColumn, nonAdminId
            } = await EmployeeReportsValidator.requestAppWebUsage().validateAsync(req.body);
            if (nonAdminId) managerId = nonAdminId;
            //pagination
            let order = '';
            let skipValue = 0;
            if (sortOrder) {
                if (sortOrder === 'D') {
                    order = -1;
                } else {
                    order = 1;
                }
            }
            if (skip == 0) {
                skipValue = limit;
            } else {
                skipValue = skip + limit;
            }
            let startdate = startDate.toString().replace(/-/g, '');
            let enddate = endDate.toString().replace(/-/g, '');

            // fetching employee ids present in system for non-admin
            let employeeIdsPresentInSystem = [];
            if (managerId) {
                employeeIdsPresentInSystem = await EmployeeReportsModel.getEmployeeAssignedToManager(managerId, role_id);
                employeeIdsPresentInSystem = employeeIdsPresentInSystem.map(emp => emp.employee_id);

                if (employee_ids && employee_ids.length) {
                    employee_ids = employeeIdsPresentInSystem.filter(id => employee_ids.some(i => i == id)); // get the common ids
                } else {
                    employee_ids = employeeIdsPresentInSystem;
                }
                // if no employee ids found for non-admin return
                if (!employee_ids.length) {
                    return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
                }
            }
            let searchname = req.body.search || '';
            let promiseArr = [
                EmployeeReportsModel.getAppWebDataCount(employee_ids, startdate, enddate, organization_id, request_option, searchname, location_ids, department_ids),
                EmployeeReportsModel.getAppWebData(employee_ids, order, sortColumn, startdate, enddate, organization_id, limit, skip, request_option, searchname, location_ids, department_ids)
            ];
            let [total, data] = await Promise.all(promiseArr);
            let totalCount = total.length > 0 ? total[0].count : 0;

            if (data.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }

            for (var i = 0; i < data.length; i++) {
                delete data[i]['lowercasename'];
            }
            if (total.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }
            if (data.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }
            data = data.filter(function (ele) { return (ele.duration != 0) })
            let topMostUsedDuration = 0;
            if (total.length > 0) {
                let sortArray = total.sort(sortByPropertyDesce("duration"));
                topMostUsedDuration = sortArray[0].duration;
            }

            let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
            if (ipMaskingOrgId.includes(String(organization_id))){
                data = data.map(x => {
                    x.name = maskingIP(x.name);
                    return x;
                });
            }

            return res.json({
                code: 200,
                total: totalCount,
                data: data,
                topMostUsedDuration: topMostUsedDuration,
                skipValue: skipValue,
                limit: limit,
                message: reportMessage.find(x => x.id === "14")[language] || reportMessage.find(x => x.id === "14")["en"],
                error: null
            });

        } catch (err) {
            // return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "15")[language] || reportMessage.find(x => x.id === "15")["en"], error: error.details[0].message });
            next(err)
        }
    }

    async getDepartmentRules(req, res) {

        const language = req.decoded.language;
        try {
            const organization_id = req.decoded.organization_id;
            let skipValue = 0;
            let application_id = req.body.application_id;
            let searchValue = req.body.search || ''
            let validate;
            try {
                validate = await EmployeeReportsValidator.getDepartmentRules().validateAsync(req.body);
            } catch (error) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"], error: error.message });
            }
            let { employee_ids, startDate, endDate, location_ids, department_ids, skip, limit, sortOrder, sortColumn, nonAdminId } = validate;
            let startdate = startDate.toString().replace(/-/g, '');
            let enddate = endDate.toString().replace(/-/g, '');

            let searchDeptsIds;
            if (searchValue) {
                searchDeptsIds = await EmployeeReportsModel.getDeptIdByName(searchValue, organization_id);
                searchDeptsIds = _.pluck(searchDeptsIds, "department_id")
                if (searchDeptsIds && searchDeptsIds.length > 0) {
                    department_ids = department_ids.concat(searchDeptsIds)
                }
            }
            if (!department_ids && department_ids.length == 0) {
                department_ids = [];
            }

            if (nonAdminId) {
                let nonAdmin = await EmployeeReportsModel.getEmployeeAssignedToManager(nonAdminId);
                employee_ids = _.pluck(nonAdmin, 'employee_id');
            }

            let promiseArr = [
                EmployeeReportsModel.getDeptRulesDataCount(application_id, employee_ids, startdate, enddate, organization_id, location_ids, department_ids),
                EmployeeReportsModel.getDeptRulesData(application_id, employee_ids, startdate, enddate, organization_id, location_ids, department_ids, skip, limit)
            ];
            let [total, deptWiseDurations] = await Promise.all(promiseArr);
            let totalCount = total.length > 0 ? total[0].count : 0;


            if (deptWiseDurations.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }
            let dept_Ids = _.pluck(deptWiseDurations, '_id');
            let dept_Names = await EmployeeReportsModel.getDepartmentNames(dept_Ids, organization_id, searchValue);
            if (dept_Names.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }
            if (searchValue) {
                totalCount = dept_Names.length;
            }
            let finaldata = [];
            dept_Names.forEach(function (val) {
                let name = "";
                let data = {}
                deptWiseDurations.map(ele => {

                    if (val.department_id == ele._id) {

                        name = val.name;
                        data = {
                            _id: ele._id,
                            duration: ele.duration,
                            name: name,
                        }
                    }
                })
                finaldata.push(data)
            })
            let order = ''
            //data has to come from mysql and mongo [combining] hence here sorting code appear
            if (sortOrder) {
                if (sortOrder === 'D') {
                    order = `DESC`;
                } else {
                    order = `ASC`;
                }
            }
            if (order) {
                if (order == "DESC") {
                    if (sortColumn == "name") {
                        finaldata.sort(sortByPropertyDesceLowercase(sortColumn));
                    }
                    else {
                        finaldata.sort(sortByPropertyDesce(sortColumn));
                    }
                }
                else {
                    if (sortColumn == "name") {
                        finaldata.sort(sortByPropertyAsceLowercase(sortColumn));
                    }
                    else {
                        finaldata.sort(sortByPropertyAsce(sortColumn));
                    }
                }
            }
            else {
                finaldata.sort(sortByPropertyDesce("duration"));
            }
            finaldata = finaldata.filter(function (val) { return (val.name != "") })

            if (skip == 0) {
                skipValue = limit;
            } else {
                skipValue = skip + limit;
            }

            return res.json({
                code: 200,
                total: totalCount,
                data: finaldata,
                skip: skipValue,
                limit: limit,
                message: reportMessage.find(x => x.id === "16")[language] || reportMessage.find(x => x.id === "16")["en"],
                error: null
            });
        } catch (error) {
            return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "15")[language] || reportMessage.find(x => x.id === "15")["en"], error: reportMessage.find(x => x.id === "15")[language] || reportMessage.find(x => x.id === "15")["en"] });
        }
    }

    /**
     * getAppWebCumulativeUsage -  function to get the cumulative reports
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async getAppWebCumulativeUsage(req, res, next) {
        let { organization_id, role_id, employee_id: managerId, language } = req.decoded;
        try {
            const {
                employee_ids, type, startDate, location_ids, department_ids, endDate, skip, limit, sortOrder, sortColumn, nonAdminId
            } = await EmployeeReportsValidator.requestAppWebCumulativeUsage().validateAsync(req.query);
            
            if (nonAdminId) managerId = nonAdminId;
            // sort logic
            let order = 1;
            if (sortOrder && sortOrder.toUpperCase() === 'D') {
                order = -1;
            }

            let startdate = startDate.toString().replace(/-/g, '');
            let enddate = endDate.toString().replace(/-/g, '');
            let searchname = req.body.search || '';

            // fetching employee ids present in system for admin and non-admin
            let employeeIdsPresentInSystem = [];
            if (managerId) {
                employeeIdsPresentInSystem = await EmployeeReportsModel.getEmployeeAssignedToManager(managerId, role_id);
                employeeIdsPresentInSystem = employeeIdsPresentInSystem.map(emp => emp.employee_id);
            } else {
                employeeIdsPresentInSystem = await EmployeeReportsModel.getActiveEmployeeIds(organization_id, sortColumn, sortOrder);
                employeeIdsPresentInSystem = employeeIdsPresentInSystem.map(emp => emp.id);
            }

            //get the count and data
            let [total, data] = await Promise.all([
                EmployeeReportsModel.getAppWebCumulativeData({
                    employee_ids, startdate, enddate, organization_id, type,
                    searchname, location_ids, department_ids, isCount: true, employeeIdsPresentInSystem
                }),
                EmployeeReportsModel.getAppWebCumulativeData({
                    employee_ids, order, sortColumn, startdate, enddate, organization_id, limit, skip,
                    type, searchname, location_ids, department_ids, employeeIdsPresentInSystem
                })
            ]);

            let totalCount = total.length > 0 ? total[0].count : 0;
            if (data.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }
            if (total.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }
            if (data.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }
            // employee details fetch from mysql
            const employeeIdsArr = [...new Set(data.map(d => d.employee_id))];
            const employeeDetails = await EmployeeReportsModel.getEmployees(employeeIdsArr, organization_id);

            // adding employee details for response
            data = data.map(d => { return { ...d, employee: employeeDetails.find(ed => ed.employee_id == d.employee_id) } });

            let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
            if (ipMaskingOrgId.includes(String(organization_id))){
                data = data.map(x => {
                    x.name = maskingIP(x.name);
                    return x;
                });
            }
            return res.json({
                code: 200,
                data: data,
                total: totalCount,
                skipValue: skip == 0 ? skip : skip + limit,
                limit: limit,
                hasMoreData: totalCount > skip + limit ? true : false,
                message: reportMessage.find(x => x.id === "14")[language] || reportMessage.find(x => x.id === "14")["en"],
                error: null
            });

        } catch (error) {
            return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "15")[language] || reportMessage.find(x => x.id === "15")["en"], error: error.details ? error.details[0].message : error.message });
        }
    }


    /**
     * getAppWebCumulativeUsage -  function to get the cumulative reports Date wise
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async getAppWebCumulativeUsageDateWise(req, res, _next) {
        const { organization_id, language } = req.decoded;
        try {

            let type = req.query?.type ? req.query.type : null;
            type = type == 1 || type == 2 ? type : null;

            let startdate1, startdate2, startdate3, enddate1, enddate2, enddate3;
            startdate1 = moment().subtract(90, 'days').format("YYYYMMDD");
            startdate2 = moment().subtract(60, 'days').format("YYYYMMDD");
            startdate3 = moment().subtract(30, 'days').format("YYYYMMDD");

            enddate1 = moment().subtract(61, 'days').format('YYYYMMDD');
            enddate2 = moment().subtract(31, 'days').format('YYYYMMDD');
            enddate3 = moment().format('YYYYMMDD');

            //get the count and data
            let [data1, data2, data3] = await Promise.all([
                EmployeeReportsModel.getAppWebCumulativeDataDateWise({ startdate: startdate1, enddate: enddate1, organization_id, type }),
                EmployeeReportsModel.getAppWebCumulativeDataDateWise({ startdate: startdate2, enddate: enddate2, organization_id, type }),
                EmployeeReportsModel.getAppWebCumulativeDataDateWise({ startdate: startdate3, enddate: enddate3, organization_id, type })
            ]);

            let data = [...data1, ...data2, ...data3];

            if (data.length == 0) {
                return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"], error: reportMessage.find(x => x.id === "13")[language] || reportMessage.find(x => x.id === "13")["en"] });
            }
            // employee details fetch from mysql
            const employeeIdsArr = [...new Set(data.map(d => d.employee_id))];
            const employeeDetails = await EmployeeReportsModel.getEmployees(employeeIdsArr, organization_id);

            // adding employee details for response
            data = data.map(d => { return { ...d, employee: employeeDetails.find(ed => ed.employee_id == d.employee_id) } });
            
            let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
            if (ipMaskingOrgId.includes(String(organization_id))){
                data = data.map(x => {
                    x.name = maskingIP(x.name);
                    return x;
                });
            }
            return res.json({
                code: 200,
                data: data,
                message: reportMessage.find(x => x.id === "14")[language] || reportMessage.find(x => x.id === "14")["en"],
                error: null
            });

        } catch (error) {
            return res.json({ code: 400, data: null, message: reportMessage.find(x => x.id === "15")[language] || reportMessage.find(x => x.id === "15")["en"], error: error.details ? error.details[0].message : error.message });
        }
    }
}
function sortByPropertyAsceLowercase(property) {
    return function (a, b) {

        if (a[property].toLowerCase() > b[property].toLowerCase())
            return 1;
        else if (a[property].toLowerCase() < b[property].toLowerCase())
            return -1;
        return 0;
    }
}

/** function to format application used report */
function formatApplicationUsedFunction(reportJsonObj, language, selectedColumns) {
    let resultArr = [];
    const reportApplicationUsedLang = excelReportHeader.application_used[language] || excelReportHeader.application_used['en'];

    for (let i = 0; i < reportJsonObj.length; i++) {
        let currentObj = reportJsonObj[i];
        let resultObj = {};
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'employee_name')) {
            resultObj[reportApplicationUsedLang.employee_name] = currentObj.employee_name;
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'location')) {
            resultObj[reportApplicationUsedLang.location] = currentObj.location || '';
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'department')) {
            resultObj[reportApplicationUsedLang.department] = currentObj.department || '';
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'computer_name')) {
            resultObj[reportApplicationUsedLang.computer_name] = currentObj.computer_name || '';
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'application_used')) {
            resultObj[reportApplicationUsedLang.application_used] = currentObj.app_name ? currentObj.app_name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).replace('.exe', '') : '';
        }
        resultObj[reportApplicationUsedLang.title] = currentObj.title;
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'start_date')) {
            resultObj[reportApplicationUsedLang.start_date] = moment(currentObj.start_time).tz(currentObj.timezone).format('DD-MM-YYYY');
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'start_time')) {
            resultObj[reportApplicationUsedLang.start_time] = moment(currentObj.start_time).tz(currentObj.timezone).format('HH:mm:ss');
        }
        // un-comment to add time in mins
        // if(!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'start_time_in_mins')) {
        //     let hmsToSeconds = convertHhMmSsToSeconds(moment(currentObj.start_time).tz(currentObj.timezone).format('HH:mm:ss'));
        //     resultObj[reportApplicationUsedLang.start_time_in_mins] = secondsToMmss(hmsToSeconds);
        // }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'end_date')) {
            resultObj[reportApplicationUsedLang.end_date] = moment(currentObj.end_time).tz(currentObj.timezone).format('DD-MM-YYYY');
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'end_time')) {
            resultObj[reportApplicationUsedLang.end_time] = moment(currentObj.end_time).tz(currentObj.timezone).format('HH:mm:ss');
        }
        // un-comment to add time in mins
        // if(!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'end_time_in_mins')) {
        //     let hmsToSeconds  = convertHhMmSsToSeconds(moment(currentObj.end_time).tz(currentObj.timezone).format('HH:mm:ss'));
        //     resultObj[reportApplicationUsedLang.end_time_in_mins] = secondsToMmss(hmsToSeconds);
        // }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'active_time')) {
            resultObj[reportApplicationUsedLang.active_time] = `${String(Math.floor((currentObj.active_seconds) / 3600)).padStart(2, '0')}${moment().startOf('day').seconds(currentObj.active_seconds).format(':mm:ss')}`;
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'active_time_in_mins')) {
            resultObj[reportApplicationUsedLang.active_time_in_mins] = secondsToMmss(currentObj.active_seconds);
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'idle_time')) {
            resultObj[reportApplicationUsedLang.idle_time] = `${String(Math.floor((currentObj.idle_seconds) / 3600)).padStart(2, '0')}${moment().startOf('day').seconds(currentObj.idle_seconds).format(':mm:ss')}`;
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'idle_time_in_mins')) {
            resultObj[reportApplicationUsedLang.idle_time_in_mins] = secondsToMmss(currentObj.idle_seconds);
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'total_time')) {
            resultObj[reportApplicationUsedLang.total_time] = `${String(Math.floor((currentObj.total_duration) / 3600)).padStart(2, '0')}${moment().startOf('day').seconds(currentObj.total_duration).format(':mm:ss')}`;
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'total_time_in_mins')) {
            resultObj[reportApplicationUsedLang.total_time_in_mins] = secondsToMmss(currentObj.total_duration);
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'key_strokes')) {
            resultObj[reportApplicationUsedLang.key_strokes] = currentObj.keystrokes.replace(/\n/g, " ");
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'category')) {
            resultObj[reportApplicationUsedLang.category] = currentObj.status == 1 ? 'Productive' : currentObj.status == 2 ? 'Non Productive' : 'Neutral';
        }
        resultArr.push(resultObj);
    }
    return resultArr;
}
/** function to format browser history report */
function formatBrowserHistoryFunction(reportJsonObj, language, selectedColumns, organization_id) {
    let resultArr = [];
    const reportBrowserHistoryLang = excelReportHeader.browser_history[language] || excelReportHeader.browser_history['en'];

    for (let i = 0; i < reportJsonObj.length; i++) {
        let currentObj = reportJsonObj[i];
        let resultObj = {};
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'employee_name')) {
            resultObj[reportBrowserHistoryLang.employee_name] = currentObj.employee_name;
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'location')) {
            resultObj[reportBrowserHistoryLang.location] = currentObj.location || '';
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'department')) {
            resultObj[reportBrowserHistoryLang.department] = currentObj.department || '';
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'computer_name')) {
            resultObj[reportBrowserHistoryLang.computer_name] = currentObj.computer_name || '';
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'domain')) {
            resultObj[reportBrowserHistoryLang.domain] = currentObj.domain_name || '';
        }
        resultObj[reportBrowserHistoryLang.title] = currentObj.title;
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'start_date')) {
            resultObj[reportBrowserHistoryLang.start_date] = moment(currentObj.start_time).tz(currentObj.timezone).format('DD-MM-YYYY');
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'start_time')) {
            resultObj[reportBrowserHistoryLang.start_time] = moment(currentObj.start_time).tz(currentObj.timezone).format('HH:mm:ss');
        }
        // un-comment to add time in mins
        // if(!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'start_time_in_mins')) {
        //     let hmsToSeconds = convertHhMmSsToSeconds(moment(currentObj.start_time).tz(currentObj.timezone).format('HH:mm:ss'));
        //     resultObj[reportBrowserHistoryLang.start_time_in_mins] = secondsToMmss(hmsToSeconds);
        // }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'end_date')) {
            resultObj[reportBrowserHistoryLang.end_date] = moment(currentObj.end_time).tz(currentObj.timezone).format('DD-MM-YYYY');
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'end_time')) {
            resultObj[reportBrowserHistoryLang.end_time] = moment(currentObj.end_time).tz(currentObj.timezone).format('HH:mm:ss');
        }
        // un-comment to add time in mins
        // if(!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'end_time_in_mins')) {
        //     let hmsToSeconds  = convertHhMmSsToSeconds(moment(currentObj.end_time).tz(currentObj.timezone).format('HH:mm:ss'));
        //     resultObj[reportBrowserHistoryLang.end_time_in_mins] = secondsToMmss(hmsToSeconds);
        // }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'active_time')) {
            resultObj[reportBrowserHistoryLang.active_time] = `${String(Math.floor((currentObj.active_seconds) / 3600)).padStart(2, '0')}${moment().startOf('day').seconds(currentObj.active_seconds).format(':mm:ss')}`;
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'active_time_in_mins')) {
            resultObj[reportBrowserHistoryLang.active_time_in_mins] = secondsToMmss(currentObj.active_seconds);
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'idle_time')) {
            resultObj[reportBrowserHistoryLang.idle_time] = `${String(Math.floor((currentObj.idle_seconds) / 3600)).padStart(2, '0')}${moment().startOf('day').seconds(currentObj.idle_seconds).format(':mm:ss')}`;
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'idle_time_in_mins')) {
            resultObj[reportBrowserHistoryLang.idle_time_in_mins] = secondsToMmss(currentObj.idle_seconds);
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'total_time')) {
            resultObj[reportBrowserHistoryLang.total_time] = `${String(Math.floor((currentObj.total_duration) / 3600)).padStart(2, '0')}${moment().startOf('day').seconds(currentObj.total_duration).format(':mm:ss')}`;
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'total_time_in_mins')) {
            resultObj[reportBrowserHistoryLang.total_time_in_mins] = secondsToMmss(currentObj.total_duration);
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'category')) {
            resultObj[reportBrowserHistoryLang.category] = currentObj.status == 1 ? 'Productive' : currentObj.status == 2 ? 'Non Productive' : 'Neutral';
        }
        if ((!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'key_strokes')) && !config.DISABLE_KEYSTROKE_FEATURE.includes(organization_id)) {
            resultObj[reportBrowserHistoryLang.key_strokes] = currentObj.keystrokes.replace(/\n/g, " ");
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'browser')) {
            resultObj[reportBrowserHistoryLang.browser] = currentObj.browser_name ? currentObj.browser_name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '';
        }
        if (!selectedColumns.length || selectedColumns.some(item => item.toLowerCase() == 'url')) {
            resultObj[reportBrowserHistoryLang.URL] = currentObj.url || '';
        }
        resultArr.push(resultObj);
    }
    return resultArr;
}

const getbrowserandapplications = async (attendanceIds, download_option) => {
    try {
        let applicationUsed = [];
        let browserHistory = [];
        // if(download_option==1) {
        //     applicationUsed = await EmployeeReportsModel.getApplicationUsed(attendanceIds);
        //     return {applicationUsed, browserHistory};
        // }
        // else if(download_option==2){
        //     browserHistory = await EmployeeReportsModel.getBrowserHistory(attendanceIds);
        //     return {applicationUsed, browserHistory};
        // }
        // else if(download_option==3){
        //     [applicationUsed, browserHistory] = await Promise.all([
        //         EmployeeReportsModel.getApplicationUsed(attendanceIds),
        //         EmployeeReportsModel.getBrowserHistory(attendanceIds),
        //     ]);
        //     return {applicationUsed, browserHistory};
        // }
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
        return { applicationUsed, browserHistory };
    } catch (error) {

    }

}

function sortByPropertyAsce(property) {
    return function (a, b) {

        if (a[property] > b[property])
            return 1;
        else if (a[property] < b[property])
            return -1;
        return 0;
    }
}
function sortByPropertyDesceLowercase(property) {
    return function (a, b) {
        if (a[property].toLowerCase() > b[property].toLowerCase())
            return -1;
        else if (a[property].toLowerCase() < b[property].toLowerCase())
            return 1;
        return 0;
    }
}
function sortByPropertyDesce(property) {
    return function (a, b) {
        if (a[property] > b[property])
            return -1;
        else if (a[property] < b[property])
            return 1;
        return 0;
    }
}

const secondsToMmss = (seconds) => {
    let hh = parseInt(seconds / 3600);
    let mm = parseInt((seconds % 3600) / 60);
    let ss = seconds % 60;
    let mins = String(hh * 60 + mm).padStart(2, '0');
    if (ss < 10) ss = `0${ss}`;

    return `${mins}:${ss}`;
};

const convertHhMmSsToSeconds = (hmsStr) => {
    var hmsArr = hmsStr.split(':'); // split it at the colons

    // minutes are worth 60 seconds. Hours are worth 60 minutes.
    let h = (+hmsArr[0]) ? (+hmsArr[0]) * 60 * 60 : 0;
    let m = (+hmsArr[1]) ? (+hmsArr[1]) * 60 : 0;
    let s = (+hmsArr[2]) ? (+hmsArr[2]) : 0;
    return h + m + s;
}

module.exports = new EmployeeReportsController;

(async () => {

    // const ids = _.pluck(attIDs, 'attendance_id');
    // console.log('---', ids.length);
    // // const count = await EmployeeReportsModel.count(ids);
    // // console.log('---------', count);
    // const disticts = await EmployeeReportsModel.disticts(ids);
    // console.log('---------', disticts);
    // const employees = await EmployeeReportsModel.employees(disticts);
    // console.log('--------', employees);

    // const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    // const csvWriter = createCsvWriter({
    //     path: './2020-09-17_file.csv',
    //     header: [
    //         { id: 'first_name', title: 'FIRST NAME' },
    //         { id: 'last_name', title: 'LAST NAME' },
    //         { id: 'a_email', title: 'EMAIL' }
    //     ]
    // });

    // csvWriter.writeRecords(employees)       // returns a promise
    //     .then(() => {
    //         console.log('...Done');
    //     });


})()
