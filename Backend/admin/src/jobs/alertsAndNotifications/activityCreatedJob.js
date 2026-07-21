const moment = require('moment-timezone');
const jobs = require('../');
const _ = require('underscore');
const models = require('../../models/employee_activities.schema');
const { EmployeeAttendanceModel } = require('../../routes/v3/employee/EmployeeAttendanceModel');
const Notification = require('../../routes/v3/alertsAndNotifications/Models/NotificationRulesModel');
const handlers = require('./rules/handlers');
const { logger } = require('../../logger/Logger');

const HOUR_DURATION = 3600;
const DAY_DURATION = HOUR_DURATION * 24;

const ON_EVERY_ACTIVITY_RULES = ['DWT'];
const ON_SHIFT_ONLY_ACTIVITY_RULES = ['IDL', 'ASA', 'STA'];
const ON_UNLIMITED_ACTIVITY_RULES = ['IDL', 'ASA', 'STA', 'OFFL'];
const ON_ATTENDANCE_INIT_RULES = ['ABT', 'SEE', 'SSE', 'SSL', 'WDO'];


const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const setDateTime = (date, time, timezone) => {
    const [hours, minutes] = time.split(':');
    return moment.tz(date.toISOString().substr(0, 10), timezone).set({ hours, minutes, seconds: 0, milliseconds: 0 }).utc();
};

const isEndInNextDay = (start, end) => {
    const [startHours, startMinutes] = start.split(':');
    const [endHours, endMinutes] = end.split(':');
    const startInMin = +startHours * 60 + +startMinutes;
    const endInMin = +endHours * 60 + +endMinutes;
    return startInMin > endInMin;
}

const timesByDate = async (data, date, timezone) => {
    const day = DAYS[date.getDay()];
    const shift = data[day];

    if (!shift || !shift.status) {
        return Promise.resolve({});
    }
    let endDate = date;
    if (isEndInNextDay(shift.time.start, shift.time.end)) {
        endDate = moment(date, "YYYY-MM-DD").add(1, 'day');
    }

    return Promise.resolve({
        start: setDateTime(date, shift.time.start, timezone),
        end: setDateTime(endDate, shift.time.end, timezone),
    });
}

const calcAttendance = async (activity, key, compact = false) => {
    try {
        const { redis } = jobs;
        let { total_duration: duration, start_time: start, end_time: end, active_seconds: activeSeconds } = activity;
        start = moment(start);
        end = moment(end);
        let attendance = (await redis.get(key));
        attendance = !attendance ? {} : JSON.parse(attendance);
        if (attendance.duration) {
            if (attendance.lastId == activity._id) {
                let idle = 0;
                if ((activeSeconds - attendance.appActiveSeconds) == 0) {
                    idle = attendance.idleSeconds + ((duration - attendance.appTotalSeconds) - (activeSeconds - attendance.appActiveSeconds));
                } else {
                    idle = (duration - attendance.appTotalSeconds) - (activeSeconds - attendance.appActiveSeconds);
                }
                Object.assign(attendance, {
                    isNew: false, duration: +attendance.prevDuration + duration, end: +end / 1000,
                    activeSeconds: +attendance.baseActiveSeconds + activeSeconds, prevActiveSeconds: attendance.activeSeconds,
                    appTotalSeconds: duration,
                    appActiveSeconds: activeSeconds,
                    idleSeconds: idle
                });
            } else {
                Object.assign(attendance, {
                    isNew: false, duration: +attendance.duration + duration, end: +end / 1000,
                    lastId: activity._id, prevDuration: attendance.duration,
                    activeSeconds, prevActiveSeconds: attendance.activeSeconds, baseActiveSeconds: attendance.activeSeconds,
                    idleSeconds: duration - activeSeconds, appTotalSeconds: duration, appActiveSeconds: activeSeconds
                });
            }
        } else {
            Object.assign(attendance, {
                duration: +duration, start: +start / 1000, end: +end / 1000,
                lastId: activity._id, prevDuration: 0, activeSeconds, prevActiveSeconds: 0, baseActiveSeconds: 0,
                idleSeconds: 0, appTotalSeconds: 0, appActiveSeconds: 0
            });
            if (!compact) {
                const attendanceModel = await EmployeeAttendanceModel.get(activity.attendance_id);
                const { employee_id: empId, organization_id: orgId, date } = attendanceModel;
                const employee = await attendanceModel.employee;
                const { department_id: depId, location_id: locId } = employee;
                const shiftModel = await employee.shift;
                const trackingData = JSON.parse(employee.custom_tracking_rule);
                let preparedShift = {};
                if (shiftModel) {
                    const shift = await shiftModel.timesByDate(new Date(attendanceModel.date), employee.timezone);
                    preparedShift = shift.start ? { start: +shift.start / 1000, end: +shift.end / 1000 } : {};
                } else if (trackingData.trackingMode == 'fixed') {
                    const shift = await timesByDate(trackingData.tracking.fixed, new Date(attendanceModel.date), employee.timezone)
                    preparedShift = shift.start ? { start: +shift.start / 1000, end: +shift.end / 1000 } : {};
                }
                Object.assign(attendance, {
                    isNew: true,
                    date: moment(date).format('YYYY-MM-DD'),
                    empId, orgId, depId, locId,
                    shift: preparedShift,
                    trackingMode: trackingData.trackingMode
                });
            }
        }
        redis.set(key, JSON.stringify(attendance), 'EX', DAY_DURATION);
        return attendance;
    } catch (err) {
        console.log('--------', err);
        Promise.reject(err);
    }
};

const rulesByAttendance = async (attendance, rulesEntities) => {
    try {
        const key = `rules.${attendance.orgId}`;
        const { redis } = jobs;
        let rules;
        rules = {};

        // rules = await redis.get(key);
        // if (rules) return JSON.parse(rules);
        // const rulesEntities = await Notification.NotificationRulesModel.findAllBy({
        //     organization_id: attendance.orgId,
        // });
        const start = attendance.shift.start * 1000;
        const end = attendance.shift.end * 1000;
        for (const rule of rulesEntities) {
            if (attendance.shift.start) {
                if (+rule.updated_at > start && +rule.updated_at < end) continue;
            }
            rules[rule.type] = rules[rule.type] || [];
            rules[rule.type].push(await Notification.NotificationRulesModel.get(rule.id));
        }
        redis.set(key, JSON.stringify(rules), 'EX', 1800);
        return rules;
    } catch (err) {
        console.log('-------', err);
        Promise.reject(err);
    }
};

const handleRules = async (ruleType, rules, handler) => {
    if (!(ruleType in rules)) return Promise.resolve(true);
    return Promise.all(rules[ruleType].map(rule => handler(ruleType)(rule)));
};

const handleActivityCreated = async (attendance, attendanceByActivity, activity, isRule, tempRules, rulesEntities) => {
    try {
        let involveHandlers = [].concat(ON_EVERY_ACTIVITY_RULES);

        let { start_time: start, end_time: end } = activity;
        start = moment(start);
        end = moment(end);
        if (
            attendance.shift && attendance.shift.start &&
            start < attendance.shift.end * 1000 && end > attendance.shift.start * 1000
        ) {
            involveHandlers.push(...ON_SHIFT_ONLY_ACTIVITY_RULES);
        }
        if (attendance.isNew) {
            involveHandlers.push(...ON_ATTENDANCE_INIT_RULES);
        }
        if ((attendance.trackingMode == 'unlimited' || attendance.trackingMode == 'manual' || attendance.trackingMode == 'networkBased' || attendance.trackingMode == 'projectBased' || attendance.trackingMode == 'geoLocation') && !attendance.shift.start) {
            involveHandlers.push(...ON_UNLIMITED_ACTIVITY_RULES);
        }
        involveHandlers = _.unique(involveHandlers);

        const rules = isRule == true ? tempRules : await rulesByAttendance(attendance, rulesEntities);
        const handler = (type) => {
            return (rule) => {
                if (
                    rule.include_employees.ids &&
                    rule.include_employees.ids.length > 0 &&
                    !rule.include_employees.ids.includes(attendance.empId)
                ) {
                    return false;
                }
                if (
                    rule.include_employees.departments &&
                    rule.include_employees.departments.length > 0 &&
                    !rule.include_employees.departments.includes(attendance.depId)
                ) {
                    return false;
                }
                if (
                    rule.include_employees.locations &&
                    rule.include_employees.locations.length > 0 &&
                    !rule.include_employees.locations.includes(attendance.locId)) {
                    return false;
                }
                if (rule.exclude_employees.ids && rule.exclude_employees.ids.includes(attendance.empId)) {
                    return false;
                }
                if (rule.exclude_employees.departments && rule.exclude_employees.departments.includes(attendance.depId)) {
                    return false;
                }
                if (rule.exclude_employees.locations && rule.exclude_employees.locations.includes(attendance.locId)) {
                    return false;
                }
                return handlers[type].activityCreated(rule, attendance, attendanceByActivity).catch((err) => {
                    logger.error(err);
                });
            };
        };
        return Promise.all(involveHandlers.map(type => handleRules(type, rules, handler)));
    } catch (err) {
        console.log('-------', err);
        Promise.reject(err);
    }
};
module.exports.activityCreatedJob = {
    perform: async (attendanceId, activityId) => {
        try {
            const activity = await models.EmployeeActivityModel.findOne({ _id: activityId });
            const { application_id: appId, domain_id: domainId } = activity;
            const attendanceKey = `attendance.${attendanceId}`;
            const attendance = { attendanceId, ...await calcAttendance(activity, attendanceKey) };
            const attendanceByActivityKey = `${attendanceKey}.${appId}.${domainId}`;
            const attendanceByActivity = {
                appId,
                domainId, ...await calcAttendance(activity, attendanceByActivityKey, true)
            };
            return await handleActivityCreated(attendance, attendanceByActivity, activity);
        } catch (e) {
            logger.error(e);
            return false;
        }
    },
};

module.exports.activityCreatedJobs = async (attendanceId, activitys) => {
    try {
        const key = `rules.${activitys[0].organization_id}`;
        const { redis } = jobs;
        let rules, rulesEntities, isRule = false;

        rules = await redis.get(key);
        if (rules) {
            rules = JSON.parse(rules);
            if (Object.keys(rules).length === 0) return;
            isRule = true;
        } else {
            rulesEntities = await Notification.NotificationRulesModel.findAllBy({
                organization_id: activitys[0].organization_id,
            });
        }
        for (const activity of activitys) {
            try {
                const { application_id: appId, domain_id: domainId } = activity;
                const attendanceKey = `attendance.${attendanceId}`;
                const attendance = { attendanceId, ...await calcAttendance(activity, attendanceKey) };
                const attendanceByActivityKey = `${attendanceKey}.${appId}.${domainId}`;
                const attendanceByActivity = {
                    appId,
                    domainId, ...await calcAttendance(activity, attendanceByActivityKey, true)
                };
                await handleActivityCreated(attendance, attendanceByActivity, activity, isRule, rules, rulesEntities);
            } catch (err) {
                logger.error(err);
            }
        }
    } catch (e) {
        logger.error(e);
        return false;
    }
    // },
};
