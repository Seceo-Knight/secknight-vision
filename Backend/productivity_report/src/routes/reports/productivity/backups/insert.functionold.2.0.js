const _ = require('underscore');
const Joi = require('@hapi/joi');
const moment = require('moment');

const OrgAppWeb = require('../../../../models/organization_apps_web.schema');
// const OrgAppWebTempModel = require('../../../models/organization_apps_web_temp.schema');
const OrgDeptAppWebModel = require('../../../../models/organizaton_department_apps_web.schema')
const {EmployeeActivityModel: EmpActivityModel} = require('../../../../models/employee_activities.schema');
const EmpProductivityReportModel = require('../../../../models/employee_productivity.schema');
const MySql = require('../../../../database/MySqlConnection').getInstance();

const Common = require('../../../../utils/helpers/Common');

function activityDataValidator(activityData) {
    const activityPerSecond = Joi.object().keys({
        buttonClicks: Joi.array().items(Joi.number().positive().allow(0)).required(),
        fakeActivities: Joi.array().items(Joi.number().positive().allow(0)).required(),
        keystrokes: Joi.array().items(Joi.number().positive().allow(0)).required(),
        mouseMovements: Joi.array().items(Joi.number().positive().allow(0)).required()
    }).required();

    const appUsage = Joi.array().items(
        Joi.object().keys({
            app: Joi.string().required(),
            start: Joi.number().positive().allow(0).default(0),
            end: Joi.number().positive().allow(0).default(0),
            url: Joi.string().allow('', null).default(null),
            keystrokes: Joi.string().allow('', null),
            title: Joi.string().allow('', null),
        }).required()
    ).required();

    return Joi.object().keys({
        organization_id: Joi.number().positive().required(),
        employee_id: Joi.number().positive().required(),
        email: Joi.string().required(),
        systemTimeUtc: Joi.string().required(),
        task_id: Joi.number().integer().positive().allow(null, 0).default(null),
        project_id: Joi.number().integer().positive().allow(null, 0).default(null),
        appUsage,
        activityPerSecond,
        break_duration: Joi.number().positive().allow(0)
    });
}
async function upsertAppWeb(appData, organization_id) {
    try {
        const { app, url } = appData;
        const resData = { application_id: null, domain_id: null };
        resData['application_id'] = await OrgAppWeb.findOne({ name: app, type: 1, organization_id }).select('_id').lean();

        if (!resData['application_id']) {
            resData['application_id'] = await new OrgAppWeb({ name: app, type: 1, organization_id: organization_id }).save();
        }

        if (url) {
            resData['domain_id'] = await OrgAppWeb.findOne({ name: Common.extractHostname(url), type: 2, organization_id }).select('_id').lean();

            if (!resData['domain_id']) {
                resData['domain_id'] = await new OrgAppWeb({ name: Common.extractHostname(url), type: 2, organization_id: organization_id }).save();
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
function calculateActivityOld(appData, activityPerSecond) {
    const { start, end } = appData;
    const { buttonClicks, fakeActivities, keystrokes, mouseMovements } = activityPerSecond;

    const buttonClicksActiveSeconds = buttonClicks.slice(start, end).filter(x => x !== 0)
    const fakeActivitiesActiveSeconds = fakeActivities.slice(start, end).filter(x => x !== 0)
    const keystrokesActiveSeconds = keystrokes.slice(start, end).filter(x => x !== 0)
    const mouseMovementsActiveSeconds = mouseMovements.slice(start, end).filter(x => x !== 0)

    const activeSeconds = [... new Set([
        ...buttonClicksActiveSeconds,
        ...fakeActivitiesActiveSeconds,
        ...keystrokesActiveSeconds,
        ...mouseMovementsActiveSeconds
    ])];

    return {
        active_seconds: activeSeconds.length,
        mouseclicks_count: buttonClicksActiveSeconds.length,
        keystrokes_count: keystrokesActiveSeconds.length,
        mousemovement_count: mouseMovementsActiveSeconds.length
        // fakeActivitiesActiveSeconds: fakeActivitiesActiveSeconds.length,
    }
}
function calculateActivity(appData, activityPerSecond) {
    const chunk_size = 60;
    const { start, end } = appData;
    let { buttonClicks, fakeActivities, keystrokes, mouseMovements } = activityPerSecond;

    buttonClicks = buttonClicks.slice(start, end);
    fakeActivities = fakeActivities.slice(start, end);
    keystrokes = keystrokes.slice(start, end);
    mouseMovements = mouseMovements.slice(start, end);

    const buttonClickChunks = _.chunk(buttonClicks, chunk_size);
    const fakeActivityChunks = _.chunk(fakeActivities, chunk_size);
    const keystrokeChunks = _.chunk(keystrokes, chunk_size);
    const mouseMovementChunks = _.chunk(mouseMovements, chunk_size);

    const activeSeconds = buttonClickChunks.reduce((activeSeconds, chunk, currentIndex, array) => {
        if (
            buttonClickChunks[currentIndex].some(x => x > 0) ||
            fakeActivityChunks[currentIndex].some(x => x > 0) ||
            keystrokeChunks[currentIndex].some(x => x > 0) ||
            mouseMovementChunks[currentIndex].some(x => x > 0)
        ) {
            return activeSeconds + chunk.length
        } else {
            return activeSeconds + 0
        }
    }, 0);

    return {
        active_seconds: activeSeconds,
        mouseclicks_count: buttonClicks.filter(x => x !== 0).length,
        keystrokes_count: keystrokes.filter(x => x !== 0).length,
        mousemovement_count: mouseMovements.filter(x => x !== 0).length
    }
}

function getAttendanceId(employee_id, date) {
    return MySql.query(
        `SELECT id FROM employee_attendance WHERE employee_id = ${employee_id} AND date = '${date}'`
    );
}
function getEmployee(employee_id) {
    return MySql.query(
        `SELECT location_id, department_id FROM employees WHERE id = ${employee_id}`
    );
}
async function findApplicationProductivityStatus(application_id, department_id) {
    let orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id, department_id: null }).lean();

    if (!orgDeptAppWeb) {
        orgDeptAppWeb = await new OrgDeptAppWebModel({ application_id, type: 1, status: 0, }).save((err, data) => { });
    }

    if (orgDeptAppWeb.type === 1) {
        return Promise.resolve(orgDeptAppWeb.status);
    } else {
        orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id, department_id });

        return Promise.resolve(orgDeptAppWeb.status);
    }
}
async function upsertProductivityReport(prReport) {
    const oldReport = await EmpProductivityReportModel.findOne({ employee_id: prReport.employee_id, yyyymmdd: prReport.yyyymmdd });

    if (!oldReport) {
        new EmpProductivityReportModel(prReport).save();
    } else {
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

            // Tasks
            prReport.tasks[0].applications.forEach((app, i) => {
                const appIndex = oldReport.tasks[oldtaskIndex].applications.findIndex(x => x.application_id.toString() === app.application_id.toString())

                if (appIndex < 0) {
                    oldReport.tasks[oldtaskIndex].applications = [...oldReport.tasks[oldtaskIndex].applications, prReport.tasks[0].applications[i]]
                } else {
                    oldReport.tasks[oldtaskIndex].applications[appIndex].pro += prReport.tasks[0].applications[i].pro;
                    oldReport.tasks[oldtaskIndex].applications[appIndex].non += prReport.tasks[0].applications[i].non;
                    oldReport.tasks[oldtaskIndex].applications[appIndex].neu += prReport.tasks[0].applications[i].neu;
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

                const oldTaskIndex = oldReport.applications[oldAppIndex].tasks.findIndex(x => x.task_id.toString() === prReport.applications[i].tasks.task_id.toString());
                if (oldTaskIndex < 0) {
                    oldReport.applications[oldAppIndex].tasks = [...oldReport.applications[oldAppIndex].tasks, prReport.applications[i].tasks];
                } else {
                    oldReport.applications[oldAppIndex].tasks[oldTaskIndex].pro += prReport.applications[i].tasks.pro;
                    oldReport.applications[oldAppIndex].tasks[oldTaskIndex].non += prReport.applications[i].tasks.non;
                    oldReport.applications[oldAppIndex].tasks[oldTaskIndex].neu += prReport.applications[i].tasks.neu;
                }
            }
        })
        oldReport.save();
    }
}

module.exports = {
    insertActivity: async (req, res, next) => {
        try {
            const { organization_id, employee_id, email, systemTimeUtc, task_id, project_id, appUsage, activityPerSecond, break_duration } = await activityDataValidator().validateAsync(req.body);
            let attendance_id = null;
            const date = moment(systemTimeUtc).format('YYYY-MM-DD');
            const attendanceData = await getAttendanceId(employee_id, date);

            if (attendanceData && attendanceData.length > 0) {
                attendance_id = attendanceData[0].id
            }
            if (!attendance_id) return res.json({ code: 404, error: `Attendance data not available with logsheetId - ${email}${moment(systemTimeUtc).format('YYYY-MM-DD')}` });

            const [employeeData] = await getEmployee(employee_id);
            if (!employeeData) return res.json({ code: 404, error: `Employee Does Not Exist` });

            const { location_id, department_id } = employeeData;

            const prReport = {
                employee_id, department_id, location_id, organization_id,
                productive_duration: 0,
                non_productive_duration: 0,
                neutral_duration: 0,
                idle_duration: 0,
                break_duration,
                applications: [],
                tasks: [{ task_id, applications: [], pro: 0, non: 0, neu: 0 }],
                year: moment(date).format('YYYY'),
                month: moment(date).format('MM'),
                day: moment(date).format('DD'),
                yyyymmdd: parseInt(moment(date).format('YYYYMMDD')),
                date,
            }

            const activityArr = [];
            for (const appData of appUsage) {
                const { app, url, start, end, keystrokes } = appData;
                const { application_id, domain_id } = await upsertAppWeb(appData, organization_id);
                const { active_seconds, keystrokes_count, mouseclicks_count, mousemovement_count } = calculateActivity(appData, activityPerSecond);

                activityArr.push({
                    attendance_id: attendance_id,
                    application_id,
                    domain_id,
                    url,
                    task_id,
                    project_id,
                    start_time: moment(systemTimeUtc).add(start, 'seconds').toISOString(),
                    end_time: moment(systemTimeUtc).add(end, 'seconds').toISOString(),
                    total_duration: (end - start),
                    active_seconds,
                    keystrokes_count,
                    keystrokes,
                    mouseclicks_count,
                    mousemovement_count
                });

                const productivityDomainObj = { pro: null, non: null, neu: null }
                if (domain_id) {
                    const appProductivityStatus = await findApplicationProductivityStatus(domain_id, department_id);
                    productivityDomainObj['pro'] = appProductivityStatus === 1 ? active_seconds : 0;
                    productivityDomainObj['non'] = appProductivityStatus === 2 ? active_seconds : 0;
                    productivityDomainObj['neu'] = appProductivityStatus === 0 ? active_seconds : 0;

                    const oldAppIndex = prReport.applications.findIndex(item => item.application_id.toString() === domain_id.toString());
                    if (oldAppIndex < 0) {
                        prReport.applications.push({ application_id: domain_id, tasks: { task_id, ...productivityDomainObj }, ...productivityDomainObj });
                    } else {
                        prReport.applications[oldAppIndex].pro += productivityDomainObj.pro;
                        prReport.applications[oldAppIndex].non += productivityDomainObj.non;
                        prReport.applications[oldAppIndex].neu += productivityDomainObj.neu;

                        prReport.applications[oldAppIndex].tasks.pro += productivityDomainObj.pro;
                        prReport.applications[oldAppIndex].tasks.non += productivityDomainObj.non;
                        prReport.applications[oldAppIndex].tasks.neu += productivityDomainObj.neu;
                    }

                    const oldTaskIndex = prReport.tasks[0].applications.findIndex(item => item.application_id.toString() === domain_id.toString());
                    if (oldTaskIndex < 0) {
                        prReport.tasks[0].applications = [...prReport.tasks[0].applications, { application_id: domain_id, ...productivityDomainObj }];
                    } else {
                        prReport.tasks[0].applications[oldTaskIndex].pro += productivityDomainObj.pro;
                        prReport.tasks[0].applications[oldTaskIndex].non += productivityDomainObj.non;
                        prReport.tasks[0].applications[oldTaskIndex].neu += productivityDomainObj.neu;
                    }
                }

                const appProductivityStatus = await findApplicationProductivityStatus(application_id, department_id);
                const productivityAppObj = {
                    pro: appProductivityStatus === 1 ? active_seconds : 0,
                    non: appProductivityStatus === 2 ? active_seconds : 0,
                    neu: appProductivityStatus === 0 ? active_seconds : 0
                }

                const oldAppIndex = prReport.applications.findIndex(item => item.application_id.toString() === application_id.toString());
                if (oldAppIndex < 0) {
                    prReport.applications.push({ application_id, tasks: { task_id, ...productivityAppObj }, ...productivityAppObj });
                } else {
                    prReport.applications[oldAppIndex].pro += productivityAppObj.pro;
                    prReport.applications[oldAppIndex].non += productivityAppObj.non;
                    prReport.applications[oldAppIndex].neu += productivityAppObj.neu;

                    prReport.applications[oldAppIndex].tasks.pro += productivityAppObj.pro;
                    prReport.applications[oldAppIndex].tasks.non += productivityAppObj.non;
                    prReport.applications[oldAppIndex].tasks.neu += productivityAppObj.neu;
                }

                const oldTaskIndex = prReport.tasks[0].applications.findIndex(item => item.application_id.toString() === application_id.toString());
                if (oldTaskIndex < 0) {
                    prReport.tasks[0].applications = [...prReport.tasks[0].applications, { application_id, ...productivityAppObj }];
                } else {
                    prReport.tasks[0].applications[oldTaskIndex].pro += productivityAppObj.pro;
                    prReport.tasks[0].applications[oldTaskIndex].non += productivityAppObj.non;
                    prReport.tasks[0].applications[oldTaskIndex].neu += productivityAppObj.neu;
                }
                prReport.tasks[0].pro += domain_id ? productivityDomainObj.pro : productivityAppObj.pro;
                prReport.tasks[0].non += domain_id ? productivityDomainObj.non : productivityAppObj.non;
                prReport.tasks[0].neu += domain_id ? productivityDomainObj.neu : productivityAppObj.neu;

                prReport['productive_duration'] += domain_id ? productivityDomainObj.pro : productivityAppObj.pro;
                prReport['non_productive_duration'] += domain_id ? productivityDomainObj.non : productivityAppObj.non;
                prReport['neutral_duration'] += domain_id ? productivityDomainObj.neu : productivityAppObj.neu;
                prReport['idle_duration'] += (end - start) - active_seconds;
            }

            const results = await EmpActivityModel.insertMany(activityArr);
            res.json({ code: 200, message: 'successfully inserted.', error: null, data: results });
            upsertProductivityReport(prReport);
        } catch (err) {
            next(err);
        }
    },
    insertActivityOld: async (req, res, next) => {
        try {
            const { organization_id, employee_id, email, systemTimeUtc, task_id, project_id, appUsage, activityPerSecond, break_duration } = await activityDataValidator().validateAsync(req.body);
            let attendance_id = null;
            const date = moment(systemTimeUtc).format('YYYY-MM-DD');
            const attendanceData = await getAttendanceId(employee_id, date);

            if (attendanceData && attendanceData.length > 0) {
                attendance_id = attendanceData[0].id
            }
            if (!attendance_id) return res.json({ code: 404, error: `Attendance data not available with logsheetId - ${email}${moment(systemTimeUtc).format('YYYY-MM-DD')}` });

            const [employeeData] = await getEmployee(employee_id);
            if (!employeeData) return res.json({ code: 404, error: `Employee Does Not Exist` });

            const { location_id, department_id } = employeeData;

            const prReport = {
                employee_id, department_id, location_id, organization_id,
                productive_duration: 0,
                non_productive_duration: 0,
                neutral_duration: 0,
                idle_duration: 0,
                break_duration,
                applications: [],
                tasks: [{ task_id, applications: [], pro: 0, non: 0, neu: 0 }],
                year: moment(date).format('YYYY'),
                month: moment(date).format('MM'),
                day: moment(date).format('DD'),
                yyyymmdd: parseInt(moment(date).format('YYYYMMDD')),
                date,
            }

            const activityArr = [];
            for (const appData of appUsage) {
                const { app, url, start, end, keystrokes } = appData;
                const { application_id, domain_id } = await upsertAppWeb(appData, organization_id);
                const { active_seconds, keystrokes_count, mouseclicks_count, mousemovement_count } = calculateActivity(appData, activityPerSecond);

                activityArr.push({
                    attendance_id: attendance_id,
                    application_id,
                    domain_id,
                    url,
                    task_id,
                    project_id,
                    start_time: moment(systemTimeUtc).add(start, 'seconds').toISOString(),
                    end_time: moment(systemTimeUtc).add(end, 'seconds').toISOString(),
                    total_duration: (end - start),
                    active_seconds,
                    keystrokes_count,
                    keystrokes,
                    mouseclicks_count,
                    mousemovement_count
                });

                const appProductivityStatus = await findApplicationProductivityStatus(application_id, department_id);
                const productivityObj = {
                    pro: appProductivityStatus === 1 ? active_seconds : 0,
                    non: appProductivityStatus === 2 ? active_seconds : 0,
                    neu: appProductivityStatus === 0 ? active_seconds : 0
                }
                prReport.idle_duration += (end - start) - active_seconds;

                const oldAppIndex = prReport.applications.findIndex(item => item.application_id.toString() === application_id.toString());
                if (oldAppIndex < 0) {
                    prReport.applications.push({ application_id, tasks: { task_id, ...productivityObj }, ...productivityObj });
                } else {
                    prReport.applications[oldAppIndex].pro += productivityObj.pro;
                    prReport.applications[oldAppIndex].non += productivityObj.non;
                    prReport.applications[oldAppIndex].neu += productivityObj.neu;

                    prReport.applications[oldAppIndex].tasks.pro += productivityObj.pro;
                    prReport.applications[oldAppIndex].tasks.non += productivityObj.non;
                    prReport.applications[oldAppIndex].tasks.neu += productivityObj.neu;
                }

                const oldTaskIndex = prReport.tasks[0].applications.findIndex(item => item.application_id.toString() === application_id.toString());
                if (oldTaskIndex < 0) {
                    prReport.tasks[0].applications = [...prReport.tasks[0].applications, { application_id, ...productivityObj }];
                } else {
                    prReport.tasks[0].applications[oldTaskIndex].pro += productivityObj.pro;
                    prReport.tasks[0].applications[oldTaskIndex].non += productivityObj.non;
                    prReport.tasks[0].applications[oldTaskIndex].neu += productivityObj.neu;
                }
                prReport.tasks[0].pro += productivityObj.pro;
                prReport.tasks[0].non += productivityObj.non;
                prReport.tasks[0].neu += productivityObj.neu;

                prReport['productive_duration'] += productivityObj.pro;
                prReport['non_productive_duration'] += productivityObj.non;
                prReport['neutral_duration'] += productivityObj.neu;
            }

            const results = await EmpActivityModel.insertMany(activityArr);
            res.json({ code: 200, message: 'successfully inserted.', error: null, data: results });
            upsertProductivityReport(prReport);
        } catch (err) {
            next(err);
        }
    }
}

const buttonClicks = [
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0,
    0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0,
    0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1,
    0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0,
    0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1,
    0, 1, 0, 1, 0
];
const fakeActivities = [
    1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1,
    0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1,
    1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1,
    0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0,
    0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0,
    1, 1, 1, 0, 0
];
const mouseMovements = [
    0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1,
    0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1,
    1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1,
    0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0,
    0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0,
    0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0,
    0, 0, 1, 0, 1
];
const keystrokes = [
    0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0,
    0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1,
    1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0,
    1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1,
    1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1,
    1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0,
    0, 1, 0, 1, 0
];

// const appData = { start: 10, end: 20 };
// const activityPerSecond = { buttonClicks, fakeActivities, keystrokes, mouseMovements };
// console.log(calculateActivity(appData, activityPerSecond));
// const asd = []
// for (let i = 0; i < 89; i++) {
//     asd.push(Math.round(Math.random()))
// }
// console.log(asd);
// console.log(calculateActivity2({start: 0, end: 70}, {buttonClicks, fakeActivities, keystrokes, mouseMovements}))
// function calculateActivity2(appData, activityPerSecond) {
//     const chunk_size = 60;
//     const { start, end } = appData;
//     let { buttonClicks, fakeActivities, keystrokes, mouseMovements } = activityPerSecond;

//     buttonClicks = buttonClicks.slice(start, end);
//     fakeActivities = fakeActivities.slice(start, end);
//     keystrokes = keystrokes.slice(start, end);
//     mouseMovements = mouseMovements.slice(start, end);

//     const buttonClickChunks = _.chunk(buttonClicks, chunk_size);
//     const fakeActivityChunks = _.chunk(fakeActivities, chunk_size);
//     const keystrokeChunks = _.chunk(keystrokes, chunk_size);
//     const mouseMovementChunks = _.chunk(mouseMovements, chunk_size);

//     const activeSeconds = buttonClickChunks.reduce((activeSeconds, chunk, currentIndex, array) => {
//         if(
//             buttonClickChunks[currentIndex].some(x => x > 0) ||
//             fakeActivityChunks[currentIndex].some(x => x > 0) ||
//             keystrokeChunks[currentIndex].some(x => x > 0) ||
//             mouseMovementChunks[currentIndex].some(x => x > 0)
//         ) {
//             return activeSeconds + chunk.length
//         } else {
//             return activeSeconds + 0
//         }
//     }, 0);

//     return {
//         active_seconds: activeSeconds,
//         mouseclicks_count: buttonClicks.filter(x => x !== 0).length,
//         keystrokes_count: keystrokes.filter(x => x !== 0).length,
//         mousemovement_count: mouseMovements.filter(x => x !== 0).length
//     }
// }