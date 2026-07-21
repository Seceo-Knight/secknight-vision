
const _ = require('underscore');

const OrgAppWeb = require('../../../models/organization_apps_web.schema');
const OrgDeptAppWebModel = require('../../../models/organizaton_department_apps_web.schema')
const { EmployeeActivityModel: EmpActivityModel } = require('../../../models/employee_activities.schema');
const EmpProductivityReportModel = require('../../../models/employee_productivity.schema');
const MySql = require('../../../database/MySqlConnection').getInstance();
const Common = require('../../../utils/helpers/Common');
const EventEmitter = require('../../../modules/category/Category.service');
const Logger = require('../../../Logger').logger;
const { TaskSchemaModel, BackUpSchemaModel } = require('../../../models/silah_db.schema');

class ProductivityModel {
    /**
    * Get attendance to add activity.
    *
    * @function getAttendanceDate
    * @memberof ProductivityModel
    * @param {*} employee_id
    * @param {*} date
    * @returns {Array} -  Process activity.
    */
    static getAttendanceDate(employee_id, date) {

        const query = `SELECT ea.id, ea.start_time, ea.end_time,e.location_id,e.department_id
            FROM employee_attendance ea
            INNER JOIN employees e ON e.id=ea.employee_id
            WHERE employee_id = ${employee_id} AND date = '${date}'`;

        return MySql.query(query);
    }

    /**
    * Get recent activity to check contious uasage.
    *
    * @function getRecentActivity
    * @memberof ProductivityModel
    * @param {*} attendance_id
    * @returns {Array} -  data or error.
    */
    static getRecentActivity(attendance_id) {
        return EmpActivityModel.findOne({ attendance_id }).sort('-end_time');
    }

    /**
        * Insert array of Activity.
        *
        * @function inserActivity
        * @memberof ProductivityModel
        * @param {*} activityArr
        * @returns {Array} -  promise or error.
        */
    static inserActivity(activityArr) {
        return EmpActivityModel.insertMany(activityArr);
    }

    /**
    * Find or Add web apps.
    *
    * @function upsertAppWeb
    * @memberof ProductivityModel
    * @param {*} object
    * @returns {Array} -  succeess or error.
    */
    static async upsertAppWeb(appData, organization_id, productivityCategory, customizeProductivityCategory) {
        try {
            let { app, url } = appData;
            app = app ? app.toLowerCase().replace('.exe', '') : app;
            url = url ? url.toLowerCase() : url;
            const resData = { application_id: null, domain_id: null };
            resData['application_id'] = await OrgAppWeb.findOne({ name: app, type: 1, organization_id }).select('_id').lean();

            if (!resData['application_id']) {
                const doc = await new OrgAppWeb({ name: app, type: 1, organization_id: organization_id }).save();
                resData['application_id'] = doc;

                const orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id: doc._id });
                if (!orgDeptAppWeb) {
                    await new OrgDeptAppWebModel({
                        application_id: doc._id,
                        type: 1, // 1-Global, 2-Custom
                        status: productivityCategory,  // 0-Neutral, 1-productive, 2-non productive
                    }).save()
                }

            }

            if (url) {
                // if (process.env.ORGANIZATION_ID == organization_id) {
                resData['domain_id'] = null;
                // First try customized domain handling if applicable
                if (customizeProductivityCategory && customizeProductivityCategory.isCustomized) {
                    const customizedName = Common.extractHostname(url) + customizeProductivityCategory.domain;
                    const customizedFormattedName = Common.formateUrl(url) + customizeProductivityCategory.domain;
                    const domainData = await OrgAppWeb.find({ $or: [{ name: customizedName }, { name: customizedFormattedName }], type: 2, organization_id: organization_id }, { _id: 1, name: 1 }).limit(3).lean();
                    if (domainData.length === 0) {
                        const doc = await new OrgAppWeb({ name: customizedName, type: 2, organization_id: organization_id }).save();
                        resData['domain_id'] = doc;
                        const orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id: doc._id });

                        if (!orgDeptAppWeb) {
                            await new OrgDeptAppWebModel({
                                application_id: doc._id,
                                type: 1, // 1-Global, 2-Custom
                                status: productivityCategory,  // 0-Neutral, 1-productive, 2-non productive
                            }).save()
                        }

                        /** Emmitting  event to find category */
                        EventEmitter.emit('category', customizedName, resData['domain_id'], organization_id)
                    } else if (domainData.length >= 2) {
                        let obj = domainData.find(d => d.name == customizedFormattedName);
                        obj = obj ? obj : domainData.find(d => d.name == customizedName);
                        obj ? resData['domain_id'] = obj['_id'] : resData['domain_id'] = domainData[0]['_id'];
                    } else {
                        resData['domain_id'] = domainData[0]['_id'];
                    }
                }
                else if (!resData['domain_id']) {
                    const domainData = await OrgAppWeb.find({ $or: [{ name: Common.extractHostname(url) }, { name: Common.formateUrl(url) }], type: 2, organization_id: organization_id }, { _id: 1, name: 1 }).limit(3).lean();
                    if (domainData.length === 0) {
                        const doc = await new OrgAppWeb({ name: Common.extractHostname(url), type: 2, organization_id: organization_id }).save();
                        resData['domain_id'] = doc;
                        const orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id: doc._id });

                        if (!orgDeptAppWeb) {
                            await new OrgDeptAppWebModel({
                                application_id: doc._id,
                                type: 1, // 1-Global, 2-Custom
                                status: productivityCategory,  // 0-Neutral, 1-productive, 2-non productive
                            }).save()
                        }

                        /** Emmitting  event to find category */
                        EventEmitter.emit('category', Common.extractHostname(url), resData['domain_id'], organization_id)
                    } else if (domainData.length >= 2) {
                        let obj = domainData.find(d => d.name == Common.formateUrl(url));
                        obj = obj ? obj : domainData.find(d => d.name == Common.extractHostname(url));
                        obj ? resData['domain_id'] = obj['_id'] : resData['domain_id'] = domainData[0]['_id'];
                    } else {
                        resData['domain_id'] = domainData[0]['_id'];
                    }
                }
            }

            return Promise.resolve({
                application_id: resData.application_id._id,
                domain_id: resData.domain_id ? resData.domain_id._id : null
            });
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
    * Find or Add application status.
    *
    * @function findApplicationProductivityStatus
    * @memberof ProductivityModel
    * @param {*} application_id
    * @param {*} department_id
    * @returns {Array} -  status or error.
    */
    static async findApplicationProductivityStatus(application_id, department_id) {
        let orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id, department_id: null }).lean();

        if (!orgDeptAppWeb) {
            orgDeptAppWeb = await new OrgDeptAppWebModel({ application_id, type: 1, status: 0, }).save((err, data) => { });
        }
        if (orgDeptAppWeb && orgDeptAppWeb.type === 1) {
            return Promise.resolve(orgDeptAppWeb);
        } else {
            orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id, department_id });
            if (!orgDeptAppWeb) {
                return Promise.resolve({ status: 0, pre_request: 0 });
            }
            return Promise.resolve(orgDeptAppWeb);
        }
    }

    /**
    * Upsert productivity report.
    *
    * @function upsertProductivityReport
    * @memberof ProductivityModel
    * @param {*} prReport
    * @returns {Array} -  promise or error.
    */
    static async upsertProductivityReport(prReport) {
        try {
            const oldReport = await EmpProductivityReportModel.findOne({ employee_id: prReport.employee_id, yyyymmdd: prReport.yyyymmdd });

            if (!oldReport) {
                await new EmpProductivityReportModel(prReport).save();
            } else {
                oldReport.logged_duration = prReport.logged_duration;
                oldReport.productive_duration += prReport.productive_duration;
                oldReport.non_productive_duration += prReport.non_productive_duration;
                oldReport.neutral_duration += prReport.neutral_duration;

                oldReport.idle_duration += prReport.idle_duration;
                oldReport.break_duration += prReport.break_duration;

                // Tasks
                const oldtaskIndex = oldReport.tasks.findIndex(task => prReport.tasks[0].task_id === task.task_id);
                if (oldtaskIndex < 0) {
                    oldReport.tasks = [...oldReport.tasks, prReport.tasks[0]]
                } else {
                    oldReport.tasks[oldtaskIndex].pro += prReport.tasks[0].pro;
                    oldReport.tasks[oldtaskIndex].non += prReport.tasks[0].non;
                    oldReport.tasks[oldtaskIndex].neu += prReport.tasks[0].neu;
                    oldReport.tasks[oldtaskIndex].idle += prReport.tasks[0].idle;
                    oldReport.tasks[oldtaskIndex].total += prReport.tasks[0].total;

                    // Tasks
                    prReport.tasks[0].applications.forEach((app, i) => {
                        const appIndex = oldReport.tasks[oldtaskIndex].applications.findIndex(x => x.application_id.toString() === app.application_id.toString())

                        if (appIndex < 0) {
                            oldReport.tasks[oldtaskIndex].applications = [...oldReport.tasks[oldtaskIndex].applications, prReport.tasks[0].applications[i]]
                        } else {
                            oldReport.tasks[oldtaskIndex].applications[appIndex].pro += prReport.tasks[0].applications[i].pro;
                            oldReport.tasks[oldtaskIndex].applications[appIndex].non += prReport.tasks[0].applications[i].non;
                            oldReport.tasks[oldtaskIndex].applications[appIndex].neu += prReport.tasks[0].applications[i].neu;
                            oldReport.tasks[oldtaskIndex].applications[appIndex].idle += prReport.tasks[0].applications[i].idle;
                            oldReport.tasks[oldtaskIndex].applications[appIndex].total += prReport.tasks[0].applications[i].total;
                        }
                    });
                }

                // Apps
                prReport.applications.forEach((app, i) => {
                    const oldAppIndex = oldReport.applications.findIndex(app => prReport.applications[i].application_id.toString() === app.application_id.toString());
                    if (oldAppIndex < 0) {
                        oldReport.applications = [...oldReport.applications, prReport.applications[i]];
                    } else {
                        oldReport.applications[oldAppIndex].pro += prReport.applications[i].pro;
                        oldReport.applications[oldAppIndex].non += prReport.applications[i].non;
                        oldReport.applications[oldAppIndex].neu += prReport.applications[i].neu;
                        oldReport.applications[oldAppIndex].idle += prReport.applications[i].idle;
                        oldReport.applications[oldAppIndex].total += prReport.applications[i].total;

                        const oldTaskIndex = oldReport.applications[oldAppIndex].tasks.findIndex(x => x.task_id.toString() === prReport.applications[i].tasks.task_id.toString());
                        if (oldTaskIndex < 0) {
                            oldReport.applications[oldAppIndex].tasks = [...oldReport.applications[oldAppIndex].tasks, prReport.applications[i].tasks];
                        } else {
                            oldReport.applications[oldAppIndex].tasks[oldTaskIndex].pro += prReport.applications[i].tasks.pro;
                            oldReport.applications[oldAppIndex].tasks[oldTaskIndex].non += prReport.applications[i].tasks.non;
                            oldReport.applications[oldAppIndex].tasks[oldTaskIndex].neu += prReport.applications[i].tasks.neu;
                            oldReport.applications[oldAppIndex].tasks[oldTaskIndex].idle += prReport.applications[i].tasks.idle;
                            oldReport.applications[oldAppIndex].tasks[oldTaskIndex].total += prReport.applications[i].tasks.total;
                        }
                    }
                })
                await oldReport.save();
            }
            return Promise.resolve();
        } catch (err) {
            Logger.error('--------productivty repoort----------', err.message, '--------------', err);
            return Promise.reject(err);
        }
    }

    /**
    * Get task stat.
    *
    * @function getTaskStat
    * @memberof ProductivityModel
    * @param {number} attendanceId
    * @param {number} taskId
    * @param {string} startTime
    * @returns {Array} -  return promise.
    */
    static getTaskStat(attendanceId, taskId, endTime) {
        const query = `SELECT id, start_time, end_time, duration, reason 
                    FROM employee_tasks_timesheet
                    WHERE attendance_id = ? AND end_time = ? AND task_id = ?`;
        const paramsArray = [attendanceId, endTime, taskId];

        return MySql.query(query, paramsArray);
    }

    /**
    * Update task stat
    *
    * @function updateTaskStat
    * @memberof ProductivityModel
    * @param {number} attendanceId
    * @param {number} taskId
    * @param {string} endTime
    * @returns {Array} -  return promise.
    */
    static updateTaskStat(timesheetId, reason, endTime, duration, type) {
        endTime = endTime ? endTime : null;
        reason = reason ? reason : null;

        const query = `UPDATE employee_tasks_timesheet 
        SET reason = ?, end_time = ?, duration = ?, type = ? WHERE id = ?`;
        const paramsArray = [reason, endTime, duration, type, timesheetId];

        return MySql.query(query, paramsArray);
    }

    /**
    * Insert task stat
    *
    * @function insertTaskStat
    * @memberof ProductivityModel
    * @param {number} attendanceId
    * @param {string} startTime
    * @param {string} endTime
    * @param {number} duration
    * @param {number} taskId
    * @param {string} reason
    * @param {string} type
    * @returns {Array} -  return promise.
    */
    static insertTaskStat(attendanceId, startTime, endTime, duration, taskId, reason, type) {
        endTime = endTime ? endTime : null;
        reason = reason ? reason : null;

        const query = ` INSERT INTO employee_tasks_timesheet (attendance_id, start_time, end_time, duration, task_id, reason,type)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const paramsArray = [attendanceId, startTime, endTime, duration, taskId, reason, type];

        return MySql.query(query, paramsArray);
    }

    static getTaskDetails(start_time, end_time, employee_id) {
        return TaskSchemaModel.aggregate([
            {
                $match: {
                    "$or": [
                        {
                            "task_working_status.start_time": { $gte: new Date(start_time), $lte: new Date(end_time) }
                        },
                        {
                            "task_working_status.end_time": { $gte: new Date(start_time), $lte: new Date(end_time) }
                        }
                    ],
                    assigned_user: employee_id,
                    status: { $ne: 0}
                }
            }
        ])
    }

    static addDataBackupCollection (params) {
        return new BackUpSchemaModel(params).save();
    }

    static getResellerOrganizationId (organization_id) {
        let query = `
            SELECT o.id as organization_id
            FROM reseller r
            JOIN users u ON u.id = r.user_id
            JOIN organizations o ON o.user_id = u.id
            WHERE r.user_id = ${organization_id}
        `;
        return MySql.query(query);
    }
}

module.exports.ProductivityModel = ProductivityModel;