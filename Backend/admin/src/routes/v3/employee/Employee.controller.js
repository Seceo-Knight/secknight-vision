const _ = require('underscore');
const moment = require('moment');
const EmployeeModel = require('./Employee.model');
const EmployeeValidator = require('./Employee.validator');
const EmployeeHelper = require('./Employee.helper');
const actionsTracker = require('../services/actionsTracker');
const { count } = require('../logs/UserActionsLogModel');
const { employeeMessages, reportMessage } = require("../../../utils/helpers/LanguageTranslate");
const { translate } = require('googleapis/build/src/apis/translate');
const PrService = require('../reports/productivity/Productivity.model');
const maskingIP = require('../../../utils/helpers/IPMasking');
const { translate: LangTranslate } = require(`${utilsFolder}/messageTranslation`);
const config = require('../../../../../config/config');
const mongoose = require('mongoose');
const filterKeystrokes = require('../../../utils/helpers/FilterKeystrokes');
class EmployeeController {
    async getEmployeesAttendanceSheet(req, res, next) {
        try {
            const { organization_id, role_id } = req.decoded;
            const language = req.decoded.language;

            const {
                date,
                skip,
                non_admin_id,
                limit,
                sortColumn,
                sortOrder,
                ...queries
            } = await EmployeeValidator.getEmployeesAttendanceSheet().validateAsync(req.query);

            const manager_id = req.decoded.employee_id || non_admin_id || null;
            let employee_ids;
            if (manager_id) {
                employee_ids = _.pluck(await EmployeeModel.getEmployeeAssignedToManager(manager_id, role_id), 'employee_id');
                if(employee_ids.length === 0) {
                    return res.json({
                        code: 404,
                        data: null,
                        message: employeeMessages.find(x => x.id === "1")[language] || employeeMessages.find(x => x.id === "1")["en"],
                        error: null,
                    });

                }
            }

            const { pageCount, empCount, сonditionQuery } = await EmployeeModel.getEmpPageCount({
                organization_id,
                queries,
                limit,
                employee_ids
            });

            if (isNaN(pageCount) || pageCount === 0) {
                return res.json({
                    code: 404,
                    data: null,
                    message: employeeMessages.find(x => x.id === "1")[language] || employeeMessages.find(x => x.id === "1")["en"],
                    error: null,
                });
            }
            const limitInstruction = EmployeeHelper.parseLimitInstruct(limit, skip);
            const sortQuery = EmployeeHelper.parseSortQuery(sortColumn, sortOrder);

            const empData = await EmployeeModel.getEmployeeForAttSheet({
                organization_id,
                сonditionQuery,
                limitInstruction,
                sortQuery,
                employee_ids
            });

            if (empData.length === 0) {
                return res.json({
                    code: 404,
                    data: null,
                    message: employeeMessages.find(x => x.id === "1")[language] || employeeMessages.find(x => x.id === "1")["en"],
                    error: null,
                });
            }

            const employeesId = EmployeeHelper.getEmpId(empData);
            const shiftsId = EmployeeHelper.getShifts(empData);
            if (shiftsId.length === 0) {
                return res.json({
                    code: 400,
                    data: null,
                    message: employeeMessages.find(x => x.id === "3")[language] || employeeMessages.find(x => x.id === "3")["en"],
                    error: null,
                });
            }

            const [attendanceData, shifts, orgTimezone] = await Promise.all([
                EmployeeModel.getAttendanceSheet({
                    organization_id,
                    employeesId,
                    date,
                }),
                EmployeeModel.getOrganizationShift(shiftsId),
                EmployeeModel.getOrgTimezone(organization_id),
            ]);
            const employeesAttendanceData = EmployeeHelper.employeeAttendanceMapper({
                empData,
                attendanceData,
                shifts,
                date,
                orgTimezone,
            });

            return res.json({
                code: 200,
                data: { [date]: employeesAttendanceData, pageCount, empCount },
                message: employeeMessages.find(x => x.id === "4")[language] || employeeMessages.find(x => x.id === "4")["en"],
                error: null,
            });
        } catch (err) {
            err = EmployeeHelper.checkError(err);
            next(err);
        }
    }

    async getEmployeesAttendance(req, res, next) {
        try {
            const { organization_id, role_id } = req.decoded;
            const language = req.decoded.language;

            const { date, skip, non_admin_id, limit, sortColumn, sortOrder, shift_id, ...queries } = await EmployeeValidator.getEmployeesAttendanceSheet().validateAsync(req.query);

            const manager_id = req.decoded.employee_id || non_admin_id || null;
            let employee_ids;
            if (manager_id) {
                employee_ids = _.pluck(await EmployeeModel.getEmployeeAssignedToManager(manager_id, role_id), 'employee_id');
                if (employee_ids.length === 0) {
                    return res.json({
                        code: 404,
                        data: null,
                        message: employeeMessages.find(x => x.id === '1')[language] || employeeMessages.find(x => x.id === '1')['en'],
                        error: null,
                    });
                }
            }

            const { pageCount, empCount, сonditionQuery } = await EmployeeModel.getEmpPageCount({
                organization_id,
                queries,
                limit,
                employee_ids,
                shift_id,
            });

            if (isNaN(pageCount) || pageCount === 0) {
                return res.json({
                    code: 404,
                    data: null,
                    message: employeeMessages.find(x => x.id === '1')[language] || employeeMessages.find(x => x.id === '1')['en'],
                    error: null,
                });
            }
            const limitInstruction = EmployeeHelper.parseLimitInstruct(limit, skip);
            const sortQuery = EmployeeHelper.parseSortQuery(sortColumn, sortOrder);

            const empData = await EmployeeModel.getEmployeeForAttSheet({
                organization_id,
                сonditionQuery,
                limitInstruction,
                sortQuery,
                employee_ids,
                shift_id
            });

            if (empData.length === 0) {
                return res.json({
                    code: 404,
                    data: null,
                    message: employeeMessages.find(x => x.id === '1')[language] || employeeMessages.find(x => x.id === '1')['en'],
                    error: null,
                });
            }

            const employeesId = EmployeeHelper.getEmpId(empData);
            const shiftsId = EmployeeHelper.getShifts(empData);
            if (shiftsId.length === 0) {
                return res.json({
                    code: 400,
                    data: null,
                    message: employeeMessages.find(x => x.id === '3')[language] || employeeMessages.find(x => x.id === '3')['en'],
                    error: null,
                });
            }

            const [attendanceData, shifts, orgTimezone] = await Promise.all([
                EmployeeModel.getAttendanceSheet({
                    organization_id,
                    employeesId,
                    date,
                }),
                EmployeeModel.getOrganizationShifts(shiftsId),
                EmployeeModel.getOrgTimezone(organization_id),
            ]);

            const employeesAttendanceData = await EmployeeHelper.AttendanceMapper({
                empData,
                attendanceData,
                shifts,
                date,
                orgTimezone,
            });

            return res.json({
                code: 200,
                data: { [date]: employeesAttendanceData, pageCount, empCount },
                message: employeeMessages.find(x => x.id === '4')[language] || employeeMessages.find(x => x.id === '4')['en'],
                error: null,
            });
        } catch (err) {
            err = EmployeeHelper.checkError(err);
            next(err);
        }
    }
    async getBrowserHistory(req, res, next) {
        try {
            if (req.decoded.role === 'Employee') {
                req.query.employee_id = req.decoded.employee_id;
            }
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const {
                employee_id,
                startDate,
                endDate,
                skip,
                limit,
            } = await EmployeeValidator.getBrowserHistory().validateAsync(req.query);
            actionsTracker(req, 'Employee %i browser history details requested', [employee_id]);

            const attendanceData = await EmployeeModel.getAttandanceIds({
                organization_id,
                employee_id,
                startDate,
                endDate,
            });

            if (attendanceData.length === 0) {
                return res.json({
                    code: 404,
                    data: [],
                    message: employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                    hasMoreData: false,
                    error: null,
                });
            }

            // const attendance_ids = [1];
            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [distinctDataArr, browserHistories] = await Promise.all([
                EmployeeModel.getBrowserHistoryCount(attendance_ids),
                EmployeeModel.getBrowserHistory({
                    attendance_ids,
                    skip,
                    limit,
                }),
            ]);
            const hasBrowserHistory = browserHistories.length > 0;

            if (hasBrowserHistory) {
                const application_ids = _.pluck(browserHistories, '_id');
                const appProductivityStatus = await EmployeeModel.getApplicationsProductivity(application_ids, attendanceData[0].department_id);
                browserHistories = browserHistories.map((item) => {
                    const status = appProductivityStatus[item._id];
                    const data = {
                        ...item,
                        idle_duration: item.total_duration - item.active_seconds,
                        productivity_status: item._id in appProductivityStatus ? ('0' in status ? status['0'] : status[attendanceData[0].department_id]) : null,
                    };
                    delete data._id;

                    return data;
                });
            }

            // IP Masking Start Custom Code
            let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID.split(",");
            if (ipMaskingOrgId.includes(String(organization_id))) {
                browserHistories = browserHistories.map(x => {
                    x.domain = maskingIP(x.domain);
                    x.urls = x.urls.map(y=>{
                        y.url = maskingIP(y.url);
                        y.title = maskingIP(y.title);
                        return y;
                    })
                    return x;
                });
            }
            // IP Masking End Custom Code

            return res.json({
                code: hasBrowserHistory ? 200 : 404,
                data: browserHistories,
                hasMoreData: distinctDataArr.length > skip + limit,
                message: hasBrowserHistory ? employeeMessages.find(x => x.id === "6")[language] || employeeMessages.find(x => x.id === "6")["en"] : employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                error: null,
            });
        } catch (err) {
            next(err);
        }
    }
    
    async getBrowserHistoryCustom(req, res, next) {
        try {
            if (req.decoded.role === 'Employee') {
                req.query.employee_id = req.decoded.employee_id;
            }
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const {
                employee_id,
                startDate,
                endDate,
            } = await EmployeeValidator.getBrowserHistory().validateAsync(req.query);
            
            // Check if date range exceeds 31 days
            const daysDifference = moment(endDate).diff(moment(startDate), 'days');
            if (daysDifference > 15) {
                return res.status(400).json({
                    code: 400,
                    data: null,
                    message: employeeMessages.find(x => x.id === "17")[language] || employeeMessages.find(x => x.id === "17")["en"] || "Date range cannot exceed 15 days",
                    error: null,
                });
            }

            const attendanceData = await EmployeeModel.getAttandanceIds({
                organization_id,
                employee_id,
                startDate,
                endDate,
            });

            if (attendanceData.length === 0) {
                return res.status(404).json({
                    code: 404,
                    data: [],
                    message: employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                    hasMoreData: false,
                    error: null,
                });
            }

            // const attendance_ids = [1];
            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [distinctDataArr, browserHistories] = await Promise.all([
                EmployeeModel.getBrowserHistoryCount(attendance_ids),
                EmployeeModel.getBrowserHistoryCustom({
                    attendance_ids,
                }),
            ]);
            const hasBrowserHistory = browserHistories.length > 0;

            if (hasBrowserHistory) {
                const application_ids = _.pluck(browserHistories, '_id');
                const appProductivityStatus = await EmployeeModel.getApplicationsProductivity(application_ids, attendanceData[0].department_id);
                browserHistories = browserHistories.map((item) => {
                    const status = appProductivityStatus[item._id];
                    const data = {
                        ...item,
                        idle_duration: item.total_duration - item.active_seconds,
                        productivity_status: item._id in appProductivityStatus ? ('0' in status ? status['0'] : status[attendanceData[0].department_id]) : null,
                    };
                    delete data._id;

                    return data;
                });
            }

            return res.json({
                code: hasBrowserHistory ? 200 : 404,
                data: browserHistories,
                message: hasBrowserHistory ? employeeMessages.find(x => x.id === "6")[language] || employeeMessages.find(x => x.id === "6")["en"] : employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                error: null,
            });
        } catch (err) {
            next(err);
        }
    }

    async getApplicationsUsed(req, res, next) {
        try {
            if (req.decoded.role === 'Employee') {
                req.query.employee_id = req.decoded.employee_id;
            }
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const {
                employee_id,
                startDate,
                endDate,
                skip,
                limit,
            } = await EmployeeValidator.getApplicationsUsed().validateAsync(req.query);
            actionsTracker(req, 'Employee %i applications used details requested', [employee_id]);

            const attendanceData = await EmployeeModel.getAttandanceIds({
                organization_id,
                employee_id,
                startDate,
                endDate,
            });
            if (attendanceData.length === 0) {
                return res.json({
                    code: 404,
                    data: [],
                    message: employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                    hasMoreData: false,
                    error: null,
                });
            }

            // const attendance_ids = [1];
            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [distinctDataArr, applications] = await Promise.all([
                EmployeeModel.getApplicationsUsedCount(attendance_ids),
                EmployeeModel.getApplicationsUsed({
                    attendance_ids,
                    skip,
                    limit,
                }),
            ]);

            if (applications.length > 0) {
                const application_ids = _.pluck(applications, '_id');

                const appProductivityStatus = await EmployeeModel.getApplicationsProductivity(
                    application_ids,
                    attendanceData[0].department_id
                );

                applications = applications.map((item) => {
                    const status = appProductivityStatus[item._id];
                    const data = {
                        ...item,
                        app_name: item.app_name.replace('.exe', ''),
                        productivity_status: item._id in appProductivityStatus ? ('0' in status ? status['0'] : status[attendanceData[0].department_id]) : null,
                        idle_duration: item.total_duration - item.active_seconds
                    };
                    delete data._id;

                    return data;
                });
            }

            return res.json({
                code: applications.length > 0 ? 200 : 404,
                data: applications,
                hasMoreData: distinctDataArr.length > skip + limit ? true : false,
                message: applications.length > 0 ? employeeMessages.find(x => x.id === "7")[language] || employeeMessages.find(x => x.id === "7")["en"] : employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                error: null,
            });
        } catch (err) {
            next(err);
        }
    }

    async getApplicationsUsedCustom(req, res, next) {
        try {
            if (req.decoded.role === 'Employee') {
                req.query.employee_id = req.decoded.employee_id;
            }
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const {
                employee_id,
                startDate,
                endDate,
            } = await EmployeeValidator.getApplicationsUsed().validateAsync(req.query);
            
            // Check if date range exceeds 31 days
            const daysDifference = moment(endDate).diff(moment(startDate), 'days');
            if (daysDifference > 15) {
                return res.status(400).json({
                    code: 400,
                    data: null,
                    message: employeeMessages.find(x => x.id === "17")[language] || employeeMessages.find(x => x.id === "17")["en"] || "Date range cannot exceed 15 days",
                    error: null,
                });
            }

            const attendanceData = await EmployeeModel.getAttandanceIds({
                organization_id,
                employee_id,
                startDate,
                endDate,
            });
            if (attendanceData.length === 0) {
                return res.status(404).json({
                    code: 404,
                    data: [],
                    message: employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                    hasMoreData: false,
                    error: null,
                });
            }

            // const attendance_ids = [1];
            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [distinctDataArr, applications] = await Promise.all([
                EmployeeModel.getApplicationsUsedCount(attendance_ids),
                EmployeeModel.getApplicationsUsedCustom({
                    attendance_ids,
                }),
            ]);

            if (applications.length > 0) {
                const application_ids = _.pluck(applications, '_id');

                const appProductivityStatus = await EmployeeModel.getApplicationsProductivity(
                    application_ids,
                    attendanceData[0].department_id
                );

                applications = applications.map((item) => {
                    const status = appProductivityStatus[item._id];
                    const data = {
                        ...item,
                        app_name: item.app_name.replace('.exe', ''),
                        productivity_status: item._id in appProductivityStatus ? ('0' in status ? status['0'] : status[attendanceData[0].department_id]) : null,
                        idle_duration: item.total_duration - item.active_seconds
                    };
                    delete data._id;

                    return data;
                });
            }

            return res.json({
                code: applications.length > 0 ? 200 : 404,
                data: applications,
                message: applications.length > 0 ? employeeMessages.find(x => x.id === "7")[language] || employeeMessages.find(x => x.id === "7")["en"] : employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                error: null,
            });
        } catch (err) {
            next(err);
        }
    }

    async getAppWebUsedCombined(req, res, next) {
        try {
            if (req.decoded.role === 'Employee') {
                req.query.employee_id = req.decoded.employee_id;
            }
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            let { employee_id, startDate, endDate, skip, limit, type, category } = await EmployeeValidator.getAppWebUsedCombined().validateAsync(req.query);
            
            type = +type;
            category = +category;

            const attendanceData = await EmployeeModel.getAttandanceIds({
                organization_id,
                employee_id,
                startDate,
                endDate,
            });
            
            if (attendanceData.length === 0) {
                return res.json({
                    code: 404,
                    data: [],
                    message: employeeMessages.find(x => x.id === '5')[language] || employeeMessages.find(x => x.id === '5')['en'],
                    error: null,
                });
            }

            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let app_web_data = await EmployeeModel.getAppDomainId(attendance_ids);
            const application_ids = new Set([..._.pluck(app_web_data, 'application_id').filter(i => i)]);
            const domain_ids = new Set([..._.pluck(app_web_data, 'domain_id').filter(i => i)]);

            const appProductivityStatus = await EmployeeModel.getApplicationsProductivity([...application_ids, ...domain_ids], attendanceData[0].department_id);
            let final_application_id = [];
            Object.keys(appProductivityStatus).map( i => {
                appProductivityStatus[i][0]  === category ? final_application_id.push(new mongoose.Types.ObjectId(i))  : appProductivityStatus[i][attendanceData[0].department_id] === category ? final_application_id.push(new mongoose.Types.ObjectId(i)) : null;
            })

            let totalCount, app_web_usage_data;

            if(type == 1) {
                [totalCount, app_web_usage_data] = await Promise.all([
                    EmployeeModel.getAppUsageRecordCount(attendance_ids, final_application_id),
                    EmployeeModel.getAppUsageRecord(attendance_ids, final_application_id, skip, limit)
                ])
                
            } else {
                [totalCount, app_web_usage_data] = await Promise.all([
                    EmployeeModel.getWebUsageRecordCount(attendance_ids, final_application_id),
                    EmployeeModel.getWebUsageRecord(attendance_ids, final_application_id, skip, limit)
                ])
            }

            return res.status(200).json({
                code: app_web_usage_data.length > 0 ? 200 : 404,
                data: app_web_usage_data,
                count: totalCount[0]?.count || 0,
                message:
                    app_web_usage_data.length > 0
                        ? type == 1 ? employeeMessages.find(x => x.id === '7')[language] || employeeMessages.find(x => x.id === '7')['en'] : 
                            employeeMessages.find(x => x.id === '6')[language] || employeeMessages.find(x => x.id === '6')['en'] 
                        : employeeMessages.find(x => x.id === '5')[language] || employeeMessages.find(x => x.id === '5')['en'],
                error: null,
            });

        } catch (error) {
            return next(error)
        }
    }

    async getKeyStrokes(req, res, next) {
        try {
            if (req.decoded.role === 'Employee') {
                req.query.employee_id = req.decoded.employee_id;
            }

            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const {
                employee_id,
                startDate,
                endDate,
                skip,
                limit,
            } = await EmployeeValidator.getKeyStrokes().validateAsync(req.query);
            actionsTracker(req, 'Employee %i KeyStrokes details requested', [employee_id]);

            const attendanceData = await EmployeeModel.getAttandanceIds({
                organization_id,
                employee_id,
                startDate,
                endDate,
            });

            if (attendanceData.length === 0) {
                return res.json({
                    code: 404,
                    data: [],
                    message: employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                    hasMoreData: false,
                    error: null,
                });
            }

            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [totalCount, keyStrokesData] = await Promise.all([
                EmployeeModel.getKeyStrokesCount(attendance_ids),
                EmployeeModel.getKeyStrokes(attendance_ids, skip, limit),
            ]);

            keyStrokesData = keyStrokesData.map((item) => {
                let type = 1;
                if (item.domain_name) type = 2;
                let isFilterKeyStroke = config.KEYSTROKE_FILTER_TEXT.includes(organization_id);
                return {
                    ...item,
                    keystrokes: filterKeystrokes(item.keystrokes.replace(/\u0000/g, ''), isFilterKeyStroke),
                    app_name: item.app_name.replace('.exe', ''),
                    type,
                    date: moment(item.start_time).format('YYYY-MM-DD'),
                };
            });

            return res.json({
                code: keyStrokesData.length > 0 ? 200 : 404,
                data: keyStrokesData,
                hasMoreData: totalCount > skip + limit ? true : false,
                message: keyStrokesData.length > 0 ? employeeMessages.find(x => x.id === "8")[language] || employeeMessages.find(x => x.id === "8")["en"] : employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                error: null,
            });
        } catch (err) {
            next(err);
        }
    }

    async getKeyStrokesData(req, res, next) {
        try {
            if (req.decoded.role === 'Employee') {
                req.query.employee_id = req.decoded.employee_id;
            }

            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

             const {
                department_id
             } = await EmployeeValidator.getKeyStrokesData().validateAsync(req.query);

           
            
            let activeEmployee = await EmployeeModel.getAllActiveEmployeeIds(organization_id,department_id);
            if (activeEmployee.length === 0) { 
                return res.json({
                code: 404,
                data: [],
                message: "No User Found",
                error: null,
            });
        }

            let employee_ids = activeEmployee.map((item) => (item.id));


            const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD'); 

            const endDate = moment().format('YYYY-MM-DD');

            const attendanceData = await EmployeeModel.getAttandanceIds_new({
                organization_id,
                employee_ids,
                startDate,
                endDate,
            });
          
            if (attendanceData.length === 0) {
                return res.json({
                    code: 404,
                    data: [],
                    message: employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                    error: null,
                });
            }

            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let keyStrokesData = await EmployeeModel.getKeyStrokesData(attendance_ids);
            
       
            keyStrokesData = keyStrokesData.map((item) => {
                let emp = attendanceData.filter(emp => emp.attendance_id == item.attendance_id);
                let type = 1;
                if (item.domain_name) type = 2;
                return {
                    ...item,
                    ...emp[0],
                    keystrokes: item.keystrokes.replace(/\u0000/g, ''),
                    app_name: item.app_name.replace('.exe', ''),
                    type,
                    date: moment(item.start_time).format('YYYY-MM-DD'),
                };
            });
            let result = [];
            employee_ids.map(item=>{
                let data = keyStrokesData.filter(i=> i.employee_id == item);
                let empKeystrokes = {employee_id : item, data};
                result.push(empKeystrokes);
            })

            return res.json({
                code: keyStrokesData.length > 0 ? 200 : 404,
                data: result,
                message: keyStrokesData.length > 0 ? employeeMessages.find(x => x.id === "8")[language] || employeeMessages.find(x => x.id === "8")["en"] : employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                error: null,
            });
        } catch (err) {
            next(err);
        }
    }

    async urlPrediction(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            const language = req.decoded.language;

            const { employee_id, startDate, endDate, skip, limit, category, sortBy, order, search } = await EmployeeValidator.urlPrediction().validateAsync(req.query);

            const attendanceData = await EmployeeModel.getAttandanceDetails({
                organization_id,
                employee_id,
                startDate,
                endDate,
            });
            if (attendanceData.length === 0) {
                return res.json({
                    code: 404,
                    data: [],
                    message: employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                    hasMoreData: false,
                    error: null,
                });
            }

            const attendance_ids = _.pluck(attendanceData, 'attendance_id');

            let [url_count, url_data] = await Promise.all([
                EmployeeModel.urlPredictionCount(category, attendance_ids, search),
                EmployeeModel.urlPredictionData(category, attendance_ids, skip, limit, sortBy, order, search)
            ]);

            if (url_count.length > 0 && url_data.lenght != 0) {
                return res.json({
                    code: 200,
                    data: url_data,
                    message: employeeMessages.find(x => x.id === "9")[language] || employeeMessages.find(x => x.id === "9")["en"],
                    count: url_count[0].total,
                    hasMoreData: url_count[0].total > skip + limit ? true : false,
                    error: null,
                });
            }
            return res.json({
                code: 404,
                data: [],
                message: employeeMessages.find(x => x.id === "10")[language] || employeeMessages.find(x => x.id === "10")["en"],
                hasMoreData: false,
                error: null,
            });

        } catch (err) {
            next(err)
        }
    }

    async conversationClassification(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            const language = req.decoded.language;

            const { employee_id, startDate, endDate, sortBy, order } = await EmployeeValidator.conversationClassification().validateAsync(req.query);

            let [prediction, words, setimental] = await Promise.all([
                EmployeeModel.getConversationClassification(organization_id, employee_id, startDate, endDate),
                EmployeeModel.getAppOffensiveWords(organization_id, employee_id, startDate, endDate, sortBy, order),
                EmployeeModel.getSentiData(employee_id, startDate, endDate)
            ])
            if (prediction.length == 0 && setimental.length == 0) return res.json({ code: 400, data: null, message: employeeMessages.find(x => x.id === "11")[language] || employeeMessages.find(x => x.id === "11")["en"], error: null });
            let words_lists = [];
            for (const itr of words) {
                words_lists.push({ app: itr.app, date: itr.date, offensive_words: itr.offensive_words || "", positive_sentences: itr.positive_sentences || [], negative_sentences: itr.negative_sentences || [] })
            }
            let data = {
                normal: prediction.length > 0 ? (prediction[0].normal || 100) : 100,
                offensive: prediction.length > 0 ? (prediction[0].offensive || 0.00) : 0.00,
                setimental: {
                    positive: setimental.length > 0 ? (setimental[0].positive || 0.00) : 0.00,
                    negative: setimental.length > 0 ? (setimental[0].negative || 0.00) : 0.00,
                    neutral: setimental.length > 0 ? (setimental[0].neutral || 100.00) : 100.00,
                },
                risk_score: setimental.length > 0 ? (setimental[0].risk_score || 0) : 0,
                details: words_lists,
            }
            return res.json({ code: 200, data: data, message: employeeMessages.find(x => x.id === "12")[language] || employeeMessages.find(x => x.id === "12")["en"], error: null });
        } catch (err) {
            next(err)
        }
    }

    async getSentimentalAnalysisData(req, res, next) {
        try {
            const language = req.decoded.language;
            const { employee_id, from_date, to_date } = await EmployeeValidator.sentimentalAnalysis().validateAsync(req.query);
            let sentimentalData = await EmployeeModel.getSentiData(employee_id, from_date, to_date);
            if (sentimentalData.length == 0)
                return res.json({ code: 400, data: null, message: employeeMessages.find(x => x.id === "13")[language] || employeeMessages.find(x => x.id === "13")["en"], error: null });
            return res.json({ code: 200, data: sentimentalData, message: employeeMessages.find(x => x.id === "14")[language] || employeeMessages.find(x => x.id === "14")["en"], error: null });

        }
        catch (err) {
            next(err);
        }
    }

    async getUrlCannectionCategory(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            const language = req.decoded.language;

            const { employee_id, startDate, endDate, sortBy, order } = await EmployeeValidator.conversationClassification().validateAsync(req.query);

            let attendanceData = await EmployeeModel.getAttandanceDetails({
                organization_id,
                employee_id,
                startDate,
                endDate,
            });
            if (attendanceData.length === 0) {
                return res.json({
                    code: 400,
                    data: [],
                    message: employeeMessages.find(x => x.id === "5")[language] || employeeMessages.find(x => x.id === "5")["en"],
                    error: null,
                });
            }
            attendanceData = _.pluck(attendanceData, "attendance_id")
            let categories = await EmployeeModel.getURLCategoryConeection(attendanceData, organization_id)

            if (categories.length == 0) {
                return res.json({
                    code: 400,
                    data: [],
                    message: employeeMessages.find(x => x.id === "15")[language] || employeeMessages.find(x => x.id === "15")["en"],
                    error: null,
                });
            }
            categories = categories.map(i => ({ ...i, totalConnection: i.details.map(n => n.count).reduce((a, b) => a + b, 0) }))
            let totalUrlCount = categories.map(n => n.totalConnection).reduce((a, b) => a + b, 0)
            categories = categories.map(item => ({
                category: item._id,
                category_percentage: ((item.totalConnection / totalUrlCount) * 100),
                details: item.details.map(i => ({ cannection: i.connection, percentage: ((i.count / item.totalConnection) * 100) }))
            }))


            return res.json({
                code: 200,
                data: categories,
                message: employeeMessages.find(x => x.id === "16")[language] || employeeMessages.find(x => x.id === "16")["en"],
                error: null,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get Employee Insights
     * 
     * @function getEmployeeInsights
     * @memberof  EmployeeController
     * @param {*} req 
     * @param {*} res 
     * @returns {object} productity data or error
     */
    getEmployeeInsights = async (req, res) => {
        try {
            const { organization_id, language, productive_hours } = req.decoded;
            const { employee_id, date: today } = await EmployeeValidator.employeeInsights().validateAsync(req.query);
            const yesterday = moment(today).subtract(1, "days").format('YYYY-MM-DD');
            let [todays, yesterdays, organization] = await Promise.all([
                EmployeeModel.getProductivity(employee_id, today, null),
                EmployeeModel.getProductivity(employee_id, yesterday, null),
                EmployeeModel.getProductivity(null, today, organization_id)
            ]);
            todays = await this.totalProductivity(todays, organization_id, productive_hours);
            yesterdays = await this.totalProductivity(yesterdays, organization_id, productive_hours);
            organization = await this.totalProductivity(organization, organization_id, productive_hours);
            return res.json({ code: 200, data: { todays, yesterdays, organization }, message: LangTranslate(employeeMessages, "12", language) })
        } catch (err) {
            return res.json({ code: 400, message: LangTranslate(reportMessage, "15", language), data: null })
        }
    }

    /**
     * calculating the productivity based on date
     * 
     * @function totalProductivity
     * @memberof  EmployeeController
     * @param {object} productivity 
     * @param {Number} organization_id 
     * @param {Number} productive_hours  
     * @returns {object} productivity data or error
     */
    totalProductivity = async (productivity, organization_id, productive_hours) => {
        let total_computer_activities_time = 0;
        let total_office_time = 0;
        let total_productive_duration = 0;
        let isSpecialOrg = process.env.ORGANIZATION_ID.split(',').includes(organization_id.toString())
        const respObj = productivity.map(item => {
            let computer_activities_time = item.productive_duration + item.non_productive_duration + item.neutral_duration;

            let office_time = computer_activities_time + item.idle_duration + item.break_duration;
            let productivity = 0;
            if (isSpecialOrg) {
                /**Productivity caluculation for special organization */
                productivity = isNaN(item.productive_duration / (30600 * item.count)) ? 0 : ((item.productive_duration / (30600 * item.count)) * 100);
            } else {
                productivity = item.productive_duration ? (item.productive_duration / ((productive_hours ? productive_hours * item.count : 0) || office_time) * 100) : 0;
            }
            if (config?.cappingProductivityOrgs.split(',').includes(organization_id.toString()) && +(productivity) > 100) productivity = 100;
            total_computer_activities_time += computer_activities_time;
            total_office_time += office_time;
            total_productive_duration += item.productive_duration;
            return {
                date: item.date,
                total_duration: item.productive_duration + item.non_productive_duration + item.neutral_duration,
                productive_duration: item.productive_duration,
                non_productive_duration: item.non_productive_duration,
                neutral_duration: item.neutral_duration,
                computer_activities_time: computer_activities_time,
                office_time: office_time,
                productivity: productivity
            }
        });
        return respObj;
    }


    /**
     * Get Employee room id
     * 
     * @function getEmployeeRoomId
     * @memberof  EmployeeController
     * @param {*} req 
     * @param {*} res 
     * @returns {object} productity data or error
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getEmployeeRoomId(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { employee_id } = await EmployeeValidator.employeeRoomId().validateAsync(req.query);
            const [employeeRoomId = null] = await EmployeeModel.getEmployeeRoomId(organization_id, employee_id);
            return res.json({ code: 200, data: employeeRoomId, message: LangTranslate(employeeMessages, "12", language) })
        } catch (err) {
            return res.json({ code: 400, message: LangTranslate(reportMessage, "15", language), data: null })
        }
    }

    async getEmployeeGeolocationLogs(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            let { employee_id, start_date, end_date } = await EmployeeValidator.getEmployeeGeolocationLogs().validateAsync(req.query);
            if (!start_date || !end_date || !employee_id) {
                return res.json({ code: 400, message: LangTranslate(reportMessage, '2', language), data: null });
            }
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).add(1, 'day').format('YYYY-MM-DD');
            let [data, dataCount] = await Promise.all([
                EmployeeModel.getEmployeeGeolocationLogs({ organization_id, employee_id, start_date, end_date }),
                EmployeeModel.getEmployeeGeolocationLogsCount({ organization_id, employee_id, start_date, end_date }),
            ]);

            return res.json({
                code: data.length > 0 ? 200 : 404,
                data: data,
                count: dataCount || 0,
                message: data.length > 0 ? employeeMessages.find(x => x.id === '12')[language] || employeeMessages.find(x => x.id === '12')['en'] : employeeMessages.find(x => x.id === '1')[language] || employeeMessages.find(x => x.id === '1')['en'],
                error: null,
            });
        } catch (error) {
            next(error);
        }
    }
}


const ValidateIPAddress = (ipAddress) => {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress)) {
        return (true);
    }
    return (false);
}


module.exports = new EmployeeController();