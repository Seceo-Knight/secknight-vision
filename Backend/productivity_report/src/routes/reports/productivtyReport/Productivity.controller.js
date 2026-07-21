const _ = require('underscore');
const moment = require('moment');
const momentTZ = require('moment-timezone');

const { ProductivtyValidation: Validation } = require('./productivty.validation');
const { ProductivityModel: ProductivityModel } = require('./productivity.model');
const Logger = require('../../../Logger').logger;
const { getAsync, setAsync } = require('./redis.service');

const failed_activity_data = require("../../../models/failed_activity_data.schema");
const crypt = require("../../../models/crypted");

const configFile = require('../../../../../config/config');
const EventEmitter = require("../../../modules/idle_alert/index");

class ProductivtyController {
    /**
    * Check server health by cronjobs for failed activity restore operations
    *
    * @function checkServerHealth
    * @memberof ProductivtyController
    * @param {*} req
    * @param {*} res
    * @param {*} next
    * @returns {String} -  Working !
    * @author - Abhishek Tripathi <abhishektripathi@globussoft.in>
    * @author - Saurav Vishal <savravvishal@globussoft.in>
    */
    static checkServerHealth = async (req, res) => {
        return res.send("Working !")
    }

    /**
    * Insert and calculate activity productivity.
    *
    * @function insertActivity
    * @memberof ProductivtyController
    * @param {*} req
    * @param {*} res
    * @param {*} next
    * @returns {Array} -  Inserted activity .
    */
    static insertActivity = async (req, res, next) => {
        try {
            const { attendanceDate, organization_id, employee_id, email, systemTimeUtc, systemTimeUtcDayOneEnd,
                task_id, project_id, appUsage, activityPerSecond, break_duration, timezone, secondAttendanceDate,
                timesheetIdleTime, productivityCategory } = await Validation.activityDataValidator().validateAsync(req.body);
            // const date = moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');
            let result = [];
            const idlePreRequest = this.timeInSeconds({ time: timesheetIdleTime });
            /**
             * if Slot exists with two day like midnight
             * like 23:51 to 00:02
             * Otherwise normal process
             */
            const taskEndTime = momentTZ(systemTimeUtc).utc().add(activityPerSecond.buttonClicks.length > 900 ? 180 : activityPerSecond.buttonClicks.length, 'seconds');
            if (secondAttendanceDate) {
                const dayOneStart = momentTZ(systemTimeUtc).utc();
                const dayOneEnd = momentTZ(systemTimeUtcDayOneEnd).utc();
                const appDayOneEnd = dayOneEnd.diff(dayOneStart, 'seconds');
                /** task end time for the second day */
                const date = attendanceDate ? moment(attendanceDate).format('YYYY-MM-DD') : moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');
                const secondDayDate = secondAttendanceDate ? moment(secondAttendanceDate).format('YYYY-MM-DD') : moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');

                await this.processActivity({
                    date, organization_id, employee_id, email,
                    systemTimeUtc, task_id, project_id, appUsage,
                    activityPerSecond, break_duration, timezone,
                    appDayOneEnd,
                    taskStartTime: dayOneStart,
                    taskEndTime: dayOneEnd, idlePreRequest, productivityCategory
                });
                result = await this.processActivity({
                    date: secondDayDate, organization_id, employee_id,
                    email, systemTimeUtc, task_id, project_id, appUsage,
                    activityPerSecond, break_duration, timezone,
                    appDayTwoStart: appDayOneEnd,
                    taskStartTime: dayOneEnd,
                    taskEndTime, idlePreRequest, productivityCategory
                });
            } else {
                /**Single day slot */
                // const taskStartTime = moment(systemTimeUtc).format('YYYY-MM-DD HH:mm:ss');
                const date = attendanceDate ? moment(attendanceDate).format('YYYY-MM-DD') : moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');
                result = await this.processActivity({
                    date, organization_id, employee_id, email, systemTimeUtc, task_id, project_id, appUsage,
                    activityPerSecond, break_duration, timezone, taskEndTime,
                    taskStartTime: momentTZ(systemTimeUtc).utc(), idlePreRequest, productivityCategory
                });
            }
            return res.json({ code: 200, message: 'successfully inserted.', error: null, data: result });
        } catch (err) {
            console.log('-------------', err, '---');
            Logger.error(`--------productivty repoort---------- ${err.message} -------------- ${JSON.stringify(err)}`);
            next(err);
        }
    }

    /**
    * Insert multiple and calculate activity productivity for cronjobs (Failed Data Restore).
    *
    * @function insertActivity2
    * @memberof ProductivtyController
    * @param {*} req
    * @param {*} res
    * @param {*} next
    * @returns {Array} -  // Array of response from promise.allSettled
    * @author - Abhishek Tripathi <abhishektripathi@globussoft.in>
    * @author - Saurav Vishal <savravvishal@globussoft.in>
    */

    static insertActivity2 = async (req, res, next) => {
        try {
            const { data } = req.body;
            let response = await Promise.allSettled(data.map(async (x) => {
                let temp = {
                    organization_id: x.organization_id,
                    task_id: x.task_id,
                    project_id: x.project_id,
                    employee_id: x.employee_id,
                    break_duration: x.break_duration,
                    appUsage: x.appUsage,
                    activityPerSecond: {
                        fakeActivities: x.activityPerSecond.fakeActivities,
                        _id: x.activityPerSecond._id,
                        buttonClicks: typeof (x.activityPerSecond.buttonClicks) === "string" ? crypt.get(x.activityPerSecond.buttonClicks) : x.activityPerSecond.buttonClicks,
                        keystrokes: typeof (x.activityPerSecond.keystrokes) === "string" ? crypt.get(x.activityPerSecond.keystrokes) : x.activityPerSecond.keystrokes,
                        mouseMovements: typeof (x.activityPerSecond.mouseMovements) === "string" ? crypt.get(x.activityPerSecond.mouseMovements) : x.activityPerSecond.mouseMovements,
                    },
                    systemTimeUtc: x.systemTimeUtc,
                    email: x.email,
                    timezone: x.timezone,
                    productivityCategory: x.productivityCategory
                }
                if (x.secondAttendanceDate) temp.secondAttendanceDate = x.secondAttendanceDate;
                if (x.systemTimeUtcDayOneEnd) temp.systemTimeUtcDayOneEnd = x.systemTimeUtcDayOneEnd;
                let dataId = x?._id
                delete x?._id;
                const { attendanceDate, organization_id, employee_id, email, systemTimeUtc, systemTimeUtcDayOneEnd,
                    task_id, project_id, appUsage, activityPerSecond, break_duration, timezone, secondAttendanceDate,
                    timesheetIdleTime, productivityCategory } = await Validation.activityDataValidator().validateAsync(temp);
                // const date = moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');
                let result = [];
                const idlePreRequest = this.timeInSeconds({ time: timesheetIdleTime });
                /**
                 * if Slot exists with two day like midnight
                 * like 23:51 to 00:02
                 * Otherwise normal process
                 */
                const taskEndTime = momentTZ(systemTimeUtc).utc().add(activityPerSecond.buttonClicks.length > 900 ? 180 : activityPerSecond.buttonClicks.length, 'seconds');
                if (secondAttendanceDate) {
                    const dayOneStart = momentTZ(systemTimeUtc).utc();
                    const dayOneEnd = momentTZ(systemTimeUtcDayOneEnd).utc();
                    const appDayOneEnd = dayOneEnd.diff(dayOneStart, 'seconds');
                    /** task end time for the second day */
                    const date = attendanceDate ? moment(attendanceDate).format('YYYY-MM-DD') : moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');
                    const secondDayDate = secondAttendanceDate ? moment(secondAttendanceDate).format('YYYY-MM-DD') : moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');

                    await this.processActivity({
                        date, organization_id, employee_id, email,
                        systemTimeUtc, task_id, project_id, appUsage,
                        activityPerSecond, break_duration, timezone,
                        appDayOneEnd,
                        taskStartTime: dayOneStart,
                        taskEndTime: dayOneEnd, idlePreRequest, productivityCategory
                    });
                    result = await this.processActivity({
                        date: secondDayDate, organization_id, employee_id,
                        email, systemTimeUtc, task_id, project_id, appUsage,
                        activityPerSecond, break_duration, timezone,
                        appDayTwoStart: appDayOneEnd,
                        taskStartTime: dayOneEnd,
                        taskEndTime, idlePreRequest, productivityCategory
                    });
                } else {
                    /**Single day slot */
                    // const taskStartTime = moment(systemTimeUtc).format('YYYY-MM-DD HH:mm:ss');
                    const date = attendanceDate ? moment(attendanceDate).format('YYYY-MM-DD') : moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');
                    result = await this.processActivity({
                        date, organization_id, employee_id, email, systemTimeUtc, task_id, project_id, appUsage,
                        activityPerSecond, break_duration, timezone, taskEndTime,
                        taskStartTime: momentTZ(systemTimeUtc).utc(), idlePreRequest, productivityCategory
                    });
                }
                // delete data that are inserted 
                await failed_activity_data.find({ _id: dataId }).deleteOne();
                return true;
            }));
            return res.json({ code: 200, message: 'successfully inserted.', error: null, data: response });
        } catch (err) {
            Logger.error(`--------productivity rep2oort---------- ${err.message} -------------- ${JSON.stringify(err)}`);
            next(err);
        }
    }

    /**
    * Add activity to employee activity and productivity report.
    *
    * @function processActivity
    * @memberof ProductivtyController
    * @param {*} object
    * @returns {Array} -  Process activity.
    */
    static async processActivity({
        date, organization_id, employee_id, email, systemTimeUtc, task_id,
        project_id, appUsage, activityPerSecond, break_duration, timezone,
        appDayOneEnd, appDayTwoStart, taskEndTime, taskStartTime, idlePreRequest, productivityCategory
    }) {
        try {
            
            let attendanceData;
            let attendanceDataCache = await getAsync(`${employee_id}_${date}_attendance`);
            if (attendanceDataCache) attendanceData = JSON.parse(attendanceDataCache);
            else {
                const [attendanceDatas] = await ProductivityModel.getAttendanceDate(employee_id, date);
                if (!attendanceDatas) throw new Error(`Attendance data not available with logsheetId - ${email}${moment(systemTimeUtc).format('YYYY-MM-DD')}`);
                await setAsync(`${employee_id}_${date}_attendance`, JSON.stringify(attendanceDatas), 'EX', 10 * 60 * 60); // 10 hours
                attendanceData = attendanceDatas;
            }

            const { location_id, department_id, id: attendance_id, start_time, end_time } = attendanceData;
            // logged_duration calculation
            const login = moment(start_time);
            const logout = moment(end_time);
            const logged_duration = logout.diff(login, 'seconds');

            const prReport = {
                employee_id, department_id, location_id, organization_id,
                logged_duration,
                productive_duration: 0,
                non_productive_duration: 0,
                neutral_duration: 0,
                idle_duration: 0,
                break_duration,
                applications: [],
                tasks: [{ task_id, project_id, applications: [], pro: 0, non: 0, neu: 0, idle: 0, total: 0 }],
                year: moment(date).format('YYYY'),
                month: moment(date).format('MM'),
                day: moment(date).format('DD'),
                yyyymmdd: parseInt(moment(date).format('YYYYMMDD')),
                date,
            }

            const lastUpdatedActivity = await ProductivityModel.getRecentActivity(attendance_id);

            const activityArr = [];
            let ifKeyStrokeCondition = appUsage.length === 1 && appUsage[0].start == 0 && appUsage[0].end == 179 && Array.from(new Set(appUsage[0].keystrokes.split(""))).length == 1;

            const systemInfoKey = `${employee_id}_system_info`;
            let [cachedSystemInfo, checkSilahKeyExist] = await Promise.all([
                getAsync(systemInfoKey),
                getAsync(`${organization_id}_silah_client`)
            ]);

            let isSilahClient;

            if (checkSilahKeyExist !== null) {
                isSilahClient = checkSilahKeyExist === "1";
            } else {
                let [checkSilahClient] = await ProductivityModel.getResellerOrganizationId(organization_id);
                isSilahClient = '7129,'.split(',').includes(
                    `${checkSilahClient?.organization_id || organization_id}`
                );
                await setAsync(`${organization_id}_silah_client`, isSilahClient ? "1" : "0");
            }

            if (isSilahClient) {
                let totalMobileUsageDuration = 0;
                let startTime = moment(systemTimeUtc).add(0, 'seconds').add(-1, "day").utc().toISOString();
                let endTime = moment(systemTimeUtc).add(logged_duration, 'seconds').add(2, "day").utc().toISOString();

                let beforeAppUsage = appUsage;
                let taskResponse = await ProductivityModel.getTaskDetails(startTime, endTime, employee_id);
                let mobile_task_usage = [];
                taskResponse.map(i => {
                    let task_working_status = i.task_working_status;
                    mobile_task_usage = [...mobile_task_usage, ...task_working_status]
                });

                let updatedAgentData = [];
                let modifiedAgentData = false;
                let stillMobileTracking = false;

                for (const agentData of appUsage) {
                    let startTime = moment(systemTimeUtc).add(agentData.start, 'seconds').utc().toISOString();
                    let endTime = moment(systemTimeUtc).add(agentData.end, 'seconds').utc().toISOString();
                    if (Array.isArray(mobile_task_usage)) {
                        for (const mobileUsage of mobile_task_usage) {
                            if (mobileUsage.is_desktop_task) continue;
                            if ((!mobileUsage.start_time) || (!mobileUsage.end_time)) stillMobileTracking = true;
                            let mobileStartTime = moment(mobileUsage.start_time).utc().toISOString();
                            let mobileEndTime = moment(mobileUsage.end_time).utc().toISOString();
                            if (moment(mobileStartTime).isBetween(startTime, endTime) && moment(mobileEndTime).isBetween(startTime, endTime)) {
                                updatedAgentData.push({
                                    ...agentData,
                                    start: moment(startTime).diff(moment(systemTimeUtc), 'second'),
                                    end: moment(mobileStartTime).diff(moment(startTime), 'second')
                                })
                                updatedAgentData.push({
                                    ...agentData,
                                    start: moment(mobileEndTime).diff(moment(startTime), 'second'),
                                    end: moment(endTime).diff(moment(systemTimeUtc), 'second')
                                })
                                totalMobileUsageDuration = moment(mobileEndTime).diff(mobileStartTime, 'second');
                            } else if (moment(mobileStartTime).isBetween(startTime, endTime) && mobileUsage.end_time == null) {
                                updatedAgentData.push({
                                    ...agentData,
                                    start: moment(startTime).diff(moment(systemTimeUtc), 'second'),
                                    end: moment(mobileStartTime).diff(moment(startTime), 'second')
                                })
                            }
                            else if (moment(mobileStartTime).isBetween(startTime, endTime) && moment(mobileUsage.end_time).isSameOrAfter(endTime)) {
                                updatedAgentData.push({
                                    ...agentData,
                                    start: moment(startTime).diff(moment(systemTimeUtc), 'second'),
                                    end: moment(mobileStartTime).diff(moment(startTime), 'second')
                                })
                            }
                            else if (moment(mobileEndTime).isBetween(startTime, endTime) && moment(mobileUsage.start_time).isSameOrBefore(startTime)) {
                                updatedAgentData.push({
                                    ...agentData,
                                    start: moment(mobileEndTime).diff(moment(startTime), 'second'),
                                    end: moment(endTime).diff(moment(systemTimeUtc), 'second')
                                })
                                totalMobileUsageDuration = moment(mobileEndTime).diff(mobileStartTime, 'second');
                            }
                            else if (!mobileUsage?.end_time) {
                                updatedAgentData = [];
                            }
                            else {
                                // console.log("--------------NULL CASE CHECK----------------------", systemTimeUtc, JSON.stringify(mobile_task_usage), JSON.stringify(appUsage));
                            }
                        }
                    }
                    if (mobile_task_usage == null || mobile_task_usage?.length == 0) updatedAgentData = appUsage;
                }
                if (updatedAgentData.length !== 0 || stillMobileTracking) {
                    modifiedAgentData = true;
                    appUsage = updatedAgentData;
                }

                // Adding data to backup collection for system usage during mobile usage for 15 days
                if (taskResponse.length && modifiedAgentData) {
                    try {
                        let backupdate = {
                            employee_id, date, app_usage: beforeAppUsage, organization_id,
                            systemTimeUtc: moment(systemTimeUtc).toISOString(),
                            yyyymmdd: +date.split('-').join(''),
                            organization_id
                        }
                        await ProductivityModel.addDataBackupCollection(backupdate);
                    } catch (error) {
                        console.log("Error for Silah in data backup");
                    }
                }
            }

            for (let appData of appUsage) {
                let { app, url, start, end, keystrokes, title } = appData;

                const shouldChangeAppName =
                    configFile.CHANGING_APP_NAME_IN_PRODUCTIVITY_REPORT_MODULE.includes(organization_id) &&
                    app &&
                    app.toLowerCase() === 'oracle developer';

                if (shouldChangeAppName) {
                    app = 'ERP';
                    appData.app = 'ERP';
                }

                /**two day slot check start and end*/
                if (appDayOneEnd && (start <= appDayOneEnd && end >= appDayOneEnd)) {
                    end = appDayOneEnd;
                } else if (appDayTwoStart && (start <= appDayTwoStart && end >= appDayTwoStart)) {
                    start = appDayTwoStart;
                }
                if (appDayOneEnd && (appDayOneEnd < start)) continue;
                if (appDayTwoStart && (appDayTwoStart > start)) continue;
                let { buttonClicks, fakeActivities, mouseMovements } = activityPerSecond;
                /**Single second slot check */
                let singleSec = false;
                if (start == 0 && end == 0 && buttonClicks.length === 1) {
                    singleSec = true;
                    end = 1;
                }

                let  customizeProductivityCategory = {
                    type: 0,
                    isCustomized: false,
                    domain: ""
                };
                if (
                    Array.isArray(configFile.PRODUCTIVITY_RULE_CUSTOMIZATION_FOR_MAIL_GOOGLE_COM) &&
                    configFile.PRODUCTIVITY_RULE_CUSTOMIZATION_FOR_MAIL_GOOGLE_COM.includes(organization_id) &&
                    typeof url === 'string' && url.toLowerCase().includes('mail.google.com') &&
                    typeof title === 'string' && title.length > 0
                ) {
                    const { email, domain } = extractEmailAndDomain(title);
                    if (domain) {
                        const normalizedDomain = domain.startsWith('.') ? domain : `.${domain}`;
                        if (domain.toLowerCase() === 'gmail.com') {
                            customizeProductivityCategory.type = 1;
                            customizeProductivityCategory.isCustomized = true;
                            customizeProductivityCategory.domain = normalizedDomain;
                        } else {
                            customizeProductivityCategory.type = 2;
                            customizeProductivityCategory.isCustomized = true;
                            customizeProductivityCategory.domain = normalizedDomain;
                        }
                    }
                }

                const { application_id, domain_id } = await ProductivityModel.upsertAppWeb(appData, organization_id, productivityCategory, customizeProductivityCategory);

                // remove useless data 
                if (appData.end - appData.start > 900) continue;

                /**Checking application productivity ranking status and application's pre-request status
                 * appProductivityStatus => 0-Neutral, 1-productive, 2-non productive
                 * pre_request => 0- Application has no idle to active time pre-request, 1-Application has idle to active time pre-request
                 */
                const appId = domain_id || application_id;
                let { status: appProductivityStatus = 0, pre_request = 0 } = await ProductivityModel.findApplicationProductivityStatus(appId, department_id);
                pre_request = +pre_request;
                const start_time = moment(systemTimeUtc).add(start, 'seconds').toISOString();
                const end_time = moment(systemTimeUtc).add(end, 'seconds').toISOString();
                let {
                    active_seconds, keystrokes_count, mouseclicks_count, mousemovement_count, condition, chunkData, idleData, activeData
                } = this.calculateActivity(start, end, activityPerSecond, appUsage, start_time, end_time, ifKeyStrokeCondition);

                app = app ? app.toLowerCase().replace('.exe', '') : app;
                url = url ? url.toLowerCase() : url;
                /**
                 * if app is end of slot than adding one extra second to manage 180 seconds
                 * if single second slot than don't add extra once second
                */
                condition = singleSec ? false : condition;
                const total_duration = condition ? ((appUsage[appUsage.length - 1].end + 1) - start) : (end - start);
                let idle = condition ? (((appUsage[appUsage.length - 1].end + 1) - start) - active_seconds) : ((end - start) - active_seconds);
                const duplicate_app_index = activityArr.findIndex(x => {
                    return (x.application_id.toString() === application_id.toString()) && (x.url == url) && (x.end_time === start_time)
                });

                /** If pre_request is equal to 1 for the particular domain,total idle time is adding in the active seconds and making idle time zero*/
                // active_seconds = pre_request !== 0 ? active_seconds + idle : active_seconds;
                // idle = pre_request == 1 ? 0 : idle;
                let tempActiveSecond, tempIdleSecond;
                tempActiveSecond = active_seconds;
                tempIdleSecond = idle;
                if (idle > 0 && Number.isInteger(pre_request) && pre_request != 0) {
                    const preRequestData = await this.preRequestTimeCalculation({ active_seconds, attendance_id, appId, pre_request, idle })
                    if (preRequestData.active_seconds) {
                        active_seconds = preRequestData.active_seconds
                        idle = preRequestData.idle
                    }
                } else if (idlePreRequest > 0) {
                    const preRequestData = await this.preRequestIdleTimeCalculation({ active_seconds, attendanceId: attendance_id, time: idlePreRequest, idle, chunkData });
                    if (preRequestData.active_seconds) {
                        active_seconds = preRequestData.active_seconds
                        idle = preRequestData.idle
                    }
                }

                if (tempActiveSecond !== active_seconds) {
                    if( active_seconds == tempActiveSecond) {
                        activeData = [...activeData, ...tempActiveSecond];
                        idleData = [];
                    }
                    else {
                        // Custom Code to Update and to removed specific idle time frame data from active data
                        let { OActiveArr, OIdleArr } = await updateActiveToIdle(activeData, idleData, active_seconds - tempActiveSecond);

                        idleData = OIdleArr;
                        activeData = OActiveArr;
                    }
                }

                if (
                    lastUpdatedActivity &&
                    moment(start_time).isBetween(
                        moment(lastUpdatedActivity.end_time).subtract(5, 'seconds'),
                        moment(lastUpdatedActivity.end_time).add(5, 'seconds'),
                        null,
                        []
                    ) &&
                    // moment(lastUpdatedActivity.end_time).add(1, 'seconds').format('x') == moment(start_time).format('x') &&
                    lastUpdatedActivity.application_id.toString() === application_id.toString() &&
                    lastUpdatedActivity.url === url
                ) {
                    lastUpdatedActivity['organization_id'] = organization_id;
                    lastUpdatedActivity['end_time'] = end_time;
                    lastUpdatedActivity['total_duration'] += total_duration;
                    lastUpdatedActivity['active_seconds'] += active_seconds;
                    lastUpdatedActivity['keystrokes_count'] += keystrokes_count;
                    lastUpdatedActivity['mouseclicks_count'] += mouseclicks_count;
                    lastUpdatedActivity['mousemovement_count'] += mousemovement_count;
                    lastUpdatedActivity['keystrokes'] += keystrokes.replace(/\u0000/g, '');
                    lastUpdatedActivity['idleData'] = [...idleData, ...lastUpdatedActivity['idleData']]
                    lastUpdatedActivity['activeData'] = [...activeData, ...lastUpdatedActivity['activeData']]

                    await lastUpdatedActivity.save();
                    if (configFile.IDLE_POPUP_AGENT.includes(organization_id) && (lastUpdatedActivity['total_duration'] - lastUpdatedActivity['active_seconds']) > 15 * 60) {
                        EventEmitter.emit('idle-alert-agent', { data: lastUpdatedActivity, date, start_time: login, end_time: logout });
                    }
                    if(configFile.PROJECT_TASK_AUTO_STOP_IDLE_TIME.includes(organization_id) && (lastUpdatedActivity['total_duration'] - lastUpdatedActivity['active_seconds']) > configFile.PROJECT_TASK_AUTO_STOP_IDLE_TIME_MINUTES * 60) {
                        EventEmitter.emit('project-task-auto-stop-idle-time', { organization_id, employee_id, start_time });
                    }
                } else if (duplicate_app_index >= 0) {
                    activityArr[duplicate_app_index]['end_time'] = end_time;
                    activityArr[duplicate_app_index]['total_duration'] += total_duration;
                    activityArr[duplicate_app_index]['active_seconds'] += active_seconds;
                    activityArr[duplicate_app_index]['keystrokes_count'] += keystrokes_count;
                    activityArr[duplicate_app_index]['mouseclicks_count'] += mouseclicks_count;
                    activityArr[duplicate_app_index]['mousemovement_count'] += mousemovement_count;
                    activityArr[duplicate_app_index]['keystrokes'] += keystrokes.replace(/\u0000/g, '');
                    activityArr[duplicate_app_index]['idleData'] = [...idleData, ...activityArr[duplicate_app_index]['idleData']]
                    activityArr[duplicate_app_index]['activeData'] = [...activeData, ...activityArr[duplicate_app_index]['activeData']]
                    if (configFile.IDLE_POPUP_AGENT.includes(organization_id) && (activityArr[duplicate_app_index]['total_duration'] - activityArr[duplicate_app_index]['active_seconds']) > 15 * 60) {
                        EventEmitter.emit('idle-alert-agent', { data: { _doc : activityArr[duplicate_app_index] }, date, start_time: login, end_time: logout });
                    }
                    if(configFile.PROJECT_TASK_AUTO_STOP_IDLE_TIME.includes(organization_id) && (activityArr[duplicate_app_index]['total_duration'] - activityArr[duplicate_app_index]['active_seconds']) > configFile.PROJECT_TASK_AUTO_STOP_IDLE_TIME_MINUTES * 60) {
                        EventEmitter.emit('project-task-auto-stop-idle-time', { organization_id, employee_id, start_time });
                    }
                } else {
                    activityArr.push({
                        attendance_id: attendance_id,
                        organization_id, employee_id,
                        application_id,
                        domain_id,
                        url,
                        title,
                        task_id,
                        project_id,
                        start_time,
                        end_time,
                        total_duration,
                        active_seconds,
                        keystrokes_count,
                        keystrokes: keystrokes.replace(/\u0000/g, ''),
                        mouseclicks_count,
                        mousemovement_count,
                        idleData,
                        activeData,
                        computer_details: cachedSystemInfo
                    });
                }

                let application_type = 1;
                const productivityDomainObj = { pro: 0, non: 0, neu: 0, idle: 0, total: 0 };
                const productivityAppObj = { pro: 0, non: 0, neu: 0, idle: 0, total: 0 };

                if (domain_id) {
                    /**for web */
                    application_type = 2;
                    // const appProductivityStatus = await ProductivityModel.findApplicationProductivityStatus(domain_id, department_id);

                    productivityDomainObj['pro'] = appProductivityStatus == 1 ? active_seconds : 0;
                    productivityDomainObj['non'] = appProductivityStatus == 2 ? active_seconds : 0;
                    productivityDomainObj['neu'] = appProductivityStatus == 0 ? active_seconds : 0;
                    productivityDomainObj['idle'] = idle;
                    productivityDomainObj['total'] = productivityDomainObj['pro'] + productivityDomainObj['non'] + productivityDomainObj['neu'] + productivityDomainObj['idle'];

                    const oldAppIndex = prReport.applications.findIndex(item => item.application_id.toString() === domain_id.toString());
                    if (oldAppIndex < 0) {
                        prReport.applications.push({
                            application_id: domain_id,
                            tasks: {
                                task_id,
                                ...productivityDomainObj
                            },
                            ...productivityDomainObj,
                            application_type
                        });
                    } else {
                        prReport.applications[oldAppIndex].pro += productivityDomainObj.pro;
                        prReport.applications[oldAppIndex].non += productivityDomainObj.non;
                        prReport.applications[oldAppIndex].neu += productivityDomainObj.neu;
                        prReport.applications[oldAppIndex].idle += productivityDomainObj.idle;
                        prReport.applications[oldAppIndex].total += productivityDomainObj.total;
                        prReport.applications[oldAppIndex].application_type = application_type;

                        prReport.applications[oldAppIndex].tasks.pro += productivityDomainObj.pro;
                        prReport.applications[oldAppIndex].tasks.non += productivityDomainObj.non;
                        prReport.applications[oldAppIndex].tasks.neu += productivityDomainObj.neu;
                        prReport.applications[oldAppIndex].tasks.idle += productivityDomainObj.idle;
                        prReport.applications[oldAppIndex].tasks.total += productivityDomainObj.total;
                    }

                    const oldTaskIndex = prReport.tasks[0].applications.findIndex(item => item.application_id.toString() === domain_id.toString());
                    if (oldTaskIndex < 0) {
                        prReport.tasks[0].applications = [
                            ...prReport.tasks[0].applications,
                            {
                                application_id: domain_id,
                                ...productivityDomainObj,
                                application_type
                            }
                        ];
                    } else {
                        prReport.tasks[0].applications[oldTaskIndex].pro += productivityDomainObj.pro;
                        prReport.tasks[0].applications[oldTaskIndex].non += productivityDomainObj.non;
                        prReport.tasks[0].applications[oldTaskIndex].neu += productivityDomainObj.neu;
                        prReport.tasks[0].applications[oldTaskIndex].idle += productivityDomainObj.idle;
                        prReport.tasks[0].applications[oldTaskIndex].total += productivityDomainObj.total;
                    }
                } else {
                    /**for apps */
                    application_type = 1;
                    // const { status: appProductivityStatus = 0, pre_request = 0 } = await ProductivityModel.findApplicationProductivityStatus(application_id, department_id);

                    productivityAppObj['pro'] = appProductivityStatus == 1 ? active_seconds : 0;
                    productivityAppObj['non'] = appProductivityStatus == 2 ? active_seconds : 0;
                    productivityAppObj['neu'] = appProductivityStatus == 0 ? active_seconds : 0;
                    productivityAppObj['idle'] = idle;
                    productivityAppObj['total'] = productivityAppObj['pro'] + productivityAppObj['non'] + productivityAppObj['neu'] + productivityAppObj['idle'];

                    const oldAppIndex = prReport.applications.findIndex(item => item.application_id.toString() === application_id.toString());
                    if (oldAppIndex < 0) {
                        prReport.applications.push({
                            application_id,
                            tasks: {
                                task_id,
                                ...productivityAppObj
                            },
                            ...productivityAppObj,
                            application_type
                        });
                    } else {
                        prReport.applications[oldAppIndex].pro += productivityAppObj.pro;
                        prReport.applications[oldAppIndex].non += productivityAppObj.non;
                        prReport.applications[oldAppIndex].neu += productivityAppObj.neu;
                        prReport.applications[oldAppIndex].idle += productivityAppObj.idle;
                        prReport.applications[oldAppIndex].total += productivityAppObj.total;
                        prReport.applications[oldAppIndex].application_type = application_type;

                        prReport.applications[oldAppIndex].tasks.pro += productivityAppObj.pro;
                        prReport.applications[oldAppIndex].tasks.non += productivityAppObj.non;
                        prReport.applications[oldAppIndex].tasks.neu += productivityAppObj.neu;
                        prReport.applications[oldAppIndex].tasks.idle += productivityAppObj.idle;
                        prReport.applications[oldAppIndex].tasks.total += productivityAppObj.total;
                    }

                    const oldTaskIndex = prReport.tasks[0].applications.findIndex(item => item.application_id.toString() === application_id.toString());
                    if (oldTaskIndex < 0) {
                        prReport.tasks[0].applications = [
                            ...prReport.tasks[0].applications,
                            {
                                application_id,
                                ...productivityAppObj,
                                application_type
                            }
                        ];
                    } else {
                        prReport.tasks[0].applications[oldTaskIndex].pro += productivityAppObj.pro;
                        prReport.tasks[0].applications[oldTaskIndex].non += productivityAppObj.non;
                        prReport.tasks[0].applications[oldTaskIndex].neu += productivityAppObj.neu;
                        prReport.tasks[0].applications[oldTaskIndex].idle += productivityAppObj.idle;
                        prReport.tasks[0].applications[oldTaskIndex].total += productivityAppObj.total;
                    }
                }

                prReport.tasks[0].pro += domain_id ? productivityDomainObj.pro : productivityAppObj.pro;
                prReport.tasks[0].non += domain_id ? productivityDomainObj.non : productivityAppObj.non;
                prReport.tasks[0].neu += domain_id ? productivityDomainObj.neu : productivityAppObj.neu;
                prReport.tasks[0].idle += domain_id ? productivityDomainObj.idle : productivityAppObj.idle;
                prReport.tasks[0].total += domain_id ? productivityDomainObj.total : productivityAppObj.total;

                prReport['productive_duration'] += domain_id ? productivityDomainObj.pro : productivityAppObj.pro;
                prReport['non_productive_duration'] += domain_id ? productivityDomainObj.non : productivityAppObj.non;
                prReport['neutral_duration'] += domain_id ? productivityDomainObj.neu : productivityAppObj.neu;
                prReport['idle_duration'] += idle;
                // (end - start) - active_seconds;
            }
            let results = [];
            if (activityArr.length > 0) {
                results = await ProductivityModel.inserActivity(activityArr);
            }
            await ProductivityModel.upsertProductivityReport(prReport);
            // await this.taskTimeSheet({ systemTimeUtc, taskId: task_id, projectId: project_id, activityPerSecond, attendanceId: attendance_id, taskEndTime, taskStartTime });
            return results;
            // res.json({ code: 200, message: 'successfully inserted.', error: null, data: results });
        } catch (err) {
            throw err;
        }
    }

    /**
    * Calculate activity based on buttonClicks,fakeActivities,keystrokes,mouseMovements.
    *
    * @function processActivity
    * @memberof ProductivtyController
    * @returns {Array} -  Process activity.
    */
    static calculateActivity(start, end, activityPerSecond, appUsage, start_time, end_time, ifKeyStrokeCondition) {
        const chunk_size = 60;
        // const { start, end } = appData;
        let { buttonClicks, fakeActivities, keystrokes, mouseMovements } = activityPerSecond;
        const condition = buttonClicks.length !== appUsage[appUsage.length - 1].end && buttonClicks.length == (appUsage[appUsage.length - 1].end + 1) && appUsage[appUsage.length - 1].end == end && !(buttonClicks.length - 1 == start);
        if (condition) {
            buttonClicks = buttonClicks.slice(start, (appUsage[appUsage.length - 1].end + 1));
            fakeActivities = fakeActivities.slice(start, (appUsage[appUsage.length - 1].end + 1));
            keystrokes = keystrokes.slice(start, (appUsage[appUsage.length - 1].end + 1));
            mouseMovements = mouseMovements.slice(start, (appUsage[appUsage.length - 1].end + 1));
        } else {
            buttonClicks = buttonClicks.slice(start, end);
            fakeActivities = fakeActivities.slice(start, end);
            keystrokes = keystrokes.slice(start, end);
            mouseMovements = mouseMovements.slice(start, end);
        }
        const buttonClickChunks = _.chunk(buttonClicks, chunk_size);
        const fakeActivityChunks = _.chunk(fakeActivities, chunk_size);
        const keystrokeChunks = _.chunk(keystrokes, chunk_size);
        const mouseMovementChunks = _.chunk(mouseMovements, chunk_size);

        let idleData = [];
        let activeData = []
        let chunkStartTime = null, chunkEndTime = null;
        const activeSeconds = buttonClickChunks.reduce((activeSeconds, chunk, currentIndex, array) => {
            if (
                buttonClickChunks[currentIndex].some(x => x > 0) ||
                fakeActivityChunks[currentIndex].some(x => x > 0) ||
                keystrokeChunks[currentIndex].some(x => x > 0) ||
                mouseMovementChunks[currentIndex].some(x => x > 0)
            ) {
                chunkStartTime = moment(start_time).add(chunk_size * currentIndex, 'seconds').toISOString();
                chunkEndTime = moment(chunkStartTime).add(buttonClickChunks[currentIndex].length, 'seconds').toISOString();
                if (ifKeyStrokeCondition) {
                    idleData.push({ start_time: chunkStartTime, end_time: chunkEndTime });
                }
                else {
                    activeData.push({ start_time: chunkStartTime, end_time: chunkEndTime });
                }
                return ifKeyStrokeCondition ? activeSeconds + 0 : activeSeconds + chunk.length;
            } else {
                // When your application is ideal
                chunkStartTime = moment(start_time).add(chunk_size * currentIndex, 'seconds').toISOString();
                chunkEndTime = moment(chunkStartTime).add(buttonClickChunks[currentIndex].length, 'seconds').toISOString();
                idleData.push({ start_time: chunkStartTime, end_time: chunkEndTime });
                return activeSeconds + 0;
            }
        }, 0);

        return {
            active_seconds: activeSeconds,
            mouseclicks_count: buttonClicks.filter(x => x !== 0).length,
            keystrokes_count: keystrokes.filter(x => x !== 0).length,
            mousemovement_count: mouseMovements.filter(x => x !== 0).length,
            condition: condition,
            chunkData: {
                buttonClickChunks,
                fakeActivityChunks,
                keystrokeChunks,
                mouseMovementChunks
            },
            idleData,
            activeData
        }
    }

    /**
    * Create task timesheet.
    *
    * @function taskTimeSheet
    * @memberof ProductivtyController
    * @param {string} systemTimeUtc
    * @param {number} taskId
    * @param {number} projectId
    * @param {object} activityPerSecond
    * @param {number} attendanceId
    * @returns {Array} - return true or false.
    */
    static async taskTimeSheet({ systemTimeUtc, taskId, projectId, activityPerSecond, attendanceId, taskEndTime, taskStartTime }) {
        try {
            if (taskId == 0 && projectId == 0) return;

            let duration = 0;
            // taskEndTime = moment(systemTimeUtc).add(activityPerSecond.buttonClicks.length > 900 ? 180 : activityPerSecond.buttonClicks.length, 'seconds');
            // taskStartTime = moment(systemTimeUtc).utc().format('YYYY-MM-DD HH:mm:ss');
            const type = 'manual';
            const reason = 'Working on other task';

            const [lastTaskTimesheet] = await ProductivityModel.getTaskStat(attendanceId, taskId, taskStartTime.format('YYYY-MM-DD HH:mm:ss'));
            if (lastTaskTimesheet) {
                duration = moment.duration(taskEndTime.diff(lastTaskTimesheet.start_time)).asSeconds();
                await ProductivityModel.updateTaskStat(lastTaskTimesheet.id, reason, taskEndTime.format('YYYY-MM-DD HH:mm:ss'), duration, type);
            } else {
                duration = moment.duration(taskEndTime.diff(taskStartTime)).asSeconds();
                await ProductivityModel.insertTaskStat(attendanceId, taskStartTime.format('YYYY-MM-DD HH:mm:ss'), taskEndTime.format('YYYY-MM-DD HH:mm:ss'), duration, taskId, reason, type);
            }
            return true;
        } catch (err) {
            console.log('---------', err);
            Logger.error(`--------productivty repoort task---------- ${err.message}-------------- ${JSON.stringify(err)}`);
            return false;
        }
    }

    /**
    * Pre-request time calculation for idle time 
    *
    * @function preRequestTimeCalculation
    * @memberof ProductivtyController
    * @param {string} appId
    * @param {number} idle
    * @param {number} pre_request
    * @param {number} attendance_id
    * @param {number} active_seconds
    * @returns {Object} - return  { idle, active_seconds }.
    */
    static async preRequestTimeCalculation({ active_seconds, attendance_id, appId, pre_request, idle }) {
        try {
            let totalIdleTime;
            const key = attendance_id + "_" + appId;
            let idleTimeData = await getAsync(key);
            if (idleTimeData) {
                idleTimeData = +JSON.parse(idleTimeData);
                if (!Number.isInteger(idleTimeData)) return { idle, active_seconds };
                if (idleTimeData >= pre_request) return { idle, active_seconds };
                totalIdleTime = idleTimeData + idle;
                if (pre_request >= totalIdleTime) {
                    active_seconds += idle;
                    idle = 0;
                } else {
                    active_seconds += (idle - (totalIdleTime - pre_request));
                    idle = (idle - (idle - (totalIdleTime - pre_request)));
                    totalIdleTime = pre_request;
                }
                await setAsync(key, JSON.stringify(totalIdleTime), 'EX', 60 * 60 * 24);
                return { idle, active_seconds };
            } else {
                totalIdleTime = idle;
                if (pre_request >= idle) {
                    active_seconds += idle;
                    idle = 0;
                } else {
                    totalIdleTime = pre_request;
                    active_seconds += pre_request;
                    idle -= pre_request;
                }
                await setAsync(key, JSON.stringify(totalIdleTime), 'EX', 60 * 60 * 24);
                return { idle, active_seconds };
            }

        } catch (err) {
            console.log('------redis error-------');
            return { idle, active_seconds };
        }
    }
    /**
  * Pre-request time calculation for idle time 
  *
  * @function preRequestIdleTimeCalculation
  * @memberof ProductivtyController
  * @param {number} idle
  * @param {number} time
  * @param {number} attendanceId
  * @param {number} active_seconds
  * @returns {Object} - return  { idle, active_seconds }.
  */
    static async preRequestIdleTimeCalculation({ active_seconds, attendanceId, time, idle, chunkData }) {
        try {
            let totalIdleTime = 0;
            let active = false;
            const key = attendanceId + "_" + 'idleToActive';

            //Return no request time
            if (time === 0) return { idle, active_seconds };
            if (active_seconds > 0) active = true;

            //Get data from redis
            let idleTimeData = await getAsync(key);
            //Return normal if idle and previous redis is zero
            if (idle === 0 && idleTimeData && ~~JSON.parse(idleTimeData) === 0) {
                return { idle, active_seconds };
                //if idle present and previous idle morethan zero
            } else if (idle > 0 && idleTimeData && ~~JSON.parse(idleTimeData) > 0) {
                idleTimeData = ~~JSON.parse(idleTimeData);
                totalIdleTime = idleTimeData;
                chunkData.buttonClickChunks.filter((chunk, currentIndex) => {
                    if (
                        chunkData.buttonClickChunks[currentIndex].some(x => x > 0) ||
                        chunkData.fakeActivityChunks[currentIndex].some(x => x > 0) ||
                        chunkData.keystrokeChunks[currentIndex].some(x => x > 0) ||
                        chunkData.mouseMovementChunks[currentIndex].some(x => x > 0)
                    ) {
                        totalIdleTime = 0;
                    } else {
                        if (totalIdleTime >= time) {
                        } else if (time >= (totalIdleTime + chunk.length)) {
                            active_seconds += chunk.length;
                            idle -= chunk.length;
                            totalIdleTime += chunk.length;
                        } else {
                            active_seconds += time - totalIdleTime;
                            idle -= time - totalIdleTime;
                            totalIdleTime += time - totalIdleTime;
                        }
                    }
                });
                await setAsync(key, JSON.stringify(totalIdleTime), 'EX', 60 * 60 * 24);
                return { idle, active_seconds };
                //On first time if idle is more
            } else if (idle > 0) {
                chunkData.buttonClickChunks.filter((chunk, currentIndex) => {
                    if (
                        chunkData.buttonClickChunks[currentIndex].some(x => x > 0) ||
                        chunkData.fakeActivityChunks[currentIndex].some(x => x > 0) ||
                        chunkData.keystrokeChunks[currentIndex].some(x => x > 0) ||
                        chunkData.mouseMovementChunks[currentIndex].some(x => x > 0)
                    ) {
                        totalIdleTime = 0;
                    } else {
                        if (idleTimeData >= time) {
                        } else if (time >= chunk.length) {
                            active_seconds += chunk.length;
                            idle -= chunk.length;
                            totalIdleTime += chunk.length;
                        } else {
                            totalIdleTime += time;
                            active_seconds += time;
                            idle -= time;
                        }
                    }
                });
                await setAsync(key, JSON.stringify(totalIdleTime), 'EX', 60 * 60 * 24);
                return { idle, active_seconds };
            } else if (idle === 0 && active_seconds > 0 && idleTimeData) {
                if (active) totalIdleTime = 0;
                await setAsync(key, JSON.stringify(totalIdleTime), 'EX', 60 * 60 * 24);
                return { idle, active_seconds };
            } else {
                return { idle, active_seconds };
            }
        } catch (err) {
            console.log('------redis error-------', err);
            return { idle, active_seconds };
        }
    }

    static timeInSeconds({ time }) {
        const data = time.split(":");
        return ~~((+data[0] * 60) + +data[1]);
    }

}

module.exports.ProductivtyController = ProductivtyController;



const updateActiveToIdle = async (activeArr, idleArr, totalMovingTime) => {

    function getTime(date) {
        return date.getTime() / 1000;
    }
    
    let length = 0;
    let newArr = [];
    let newArr1 = [];
    idleArr.forEach((i) => {
        const start = new Date(i.start_time)
        const end = new Date(i.end_time)
        const seconds = getTime(end) - getTime(start);
        if (length < totalMovingTime) {
            length += seconds;
            if (length <= totalMovingTime) {
                newArr.push({
                    "start_time": start.toISOString(),
                    "end_time": end.toISOString()
                });
            } else {
                const secondsToChange = length - totalMovingTime;
                const endTime = end.toISOString();
                end.setSeconds(end.getSeconds() - secondsToChange)
                newArr.push({
                    "start_time": start.toISOString(),
                    "end_time": end.toISOString()
                });
                newArr1.push({
                    "start_time": end.toISOString(),
                    "end_time": endTime
                });
            }
        } else {
            newArr1.push({
                "start_time": start.toISOString(),
                "end_time": end.toISOString()
            });
        }
    });

    activeArr.push(...newArr);
    idleArr = newArr1;

    return {
        OActiveArr: activeArr,
        OIdleArr: idleArr
    }

}

function extractEmailAndDomain(inputString) {
    // Regular expression to match the email format
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

    // Apply the regex to the input string
    const match = inputString.match(emailRegex);

    // If a match is found, return the first match, else return null
    return {
        email: match ? match[0] : null,
        domain: match ? match[0].split('@')[1] : null
    };
}