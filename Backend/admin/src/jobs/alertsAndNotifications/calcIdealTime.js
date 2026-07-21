const models = require('../../models/employee_activities.schema');
const { logger } = require('../../logger/Logger');
const jobs = require('../');
const HOUR_DURATION = 3600;
const DAY_DURATION = HOUR_DURATION * 24;
const moment = require('moment-timezone');


const calcIdealAttendance_old = async (activity, key) => {
    try {
        const { redis } = jobs;
        const { total_duration: duration, start_time: start, end_time: end, active_seconds: activeSeconds } = activity;
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
                    duration: +attendance.prevDuration + duration, end: +end / 1000,
                    activeSeconds: +attendance.baseActiveSeconds + activeSeconds, prevActiveSeconds: attendance.activeSeconds,
                    appTotalSeconds: duration,
                    appActiveSeconds: activeSeconds,
                    idleSeconds: idle,
                    last_ideal_start_from: moment(end).subtract((idle), 'seconds'),
                    last_ideal_end_to: end,
                });
            } else {
                Object.assign(attendance, {
                    duration: duration, end: +end / 1000,
                    lastId: activity._id, prevDuration: attendance.duration,
                    activeSeconds, prevActiveSeconds: attendance.activeSeconds, baseActiveSeconds: attendance.activeSeconds,
                    last_ideal_start_from: moment(end).subtract((duration - activeSeconds), 'seconds'),
                    last_ideal_end_to: end,
                    idleSeconds: duration - activeSeconds, appTotalSeconds: duration, appActiveSeconds: activeSeconds
                });
            }
            // if (attendance.lastId == activity._id) {
            //     Object.assign(attendance, {
            //         is_new: false,
            //         lastId: activity._id,
            //         duration: duration + attendance.duration,
            //         last_inserted_time: attendance.last_inserted_time,
            //         active_seconds: activesec, 
            //         last_ideal_start_from:attendance.last_ideal_start_from,
            //         last_ideal_end_to:lastInsertedTime,
            //         ideal_seconds:(duration + attendance.duration) - activesec
            //     });
            // } 
            // else if (attendance.lastId == activity._id && attendance.active_seconds != activity.active_seconds){
            //     Object.assign(attendance, {
            //         is_new: false,
            //         lastId: activity._id,
            //         duration: duration + attendance.duration,
            //         last_inserted_time: attendance.last_inserted_time,
            //         active_seconds: activesec, 
            //         last_ideal_start_from:attendance.last_ideal_start_from,
            //         last_ideal_end_to:lastInsertedTime,
            //         ideal_seconds:(duration + attendance.duration) - activesec
            //     });
            // }
            //     else {
            //     Object.assign(attendance, {
            //         is_new: false,
            //         duration: duration,
            //         active_seconds: activesec,
            //         lastId: activity._id,
            //         last_inserted_time: lastInsertedTime,
            //         last_ideal_start_from:moment(attendance.last_ideal_end_to).subtract(duration,'seconds'),
            //         last_ideal_end_to:lastInsertedTime,
            //         ideal_seconds : duration - activesec
            //     });
            // }
        }
        else {
            // Object.assign(attendance, {
            //     duration: +duration,
            //     active_seconds: activesec,
            //     lastId: activity._id,
            //     last_inserted_time: lastInsertedTime,
            //     last_ideal_start_from:moment(lastInsertedTime).subtract((duration - activesec),'seconds'),
            //     last_ideal_end_to:lastInsertedTime,
            //     // ideal_seconds : duration - activesec,
            //     idleSeconds: duration - activesec, appTotalSeconds: +duration, appActiveSeconds: activesec
            // });
            Object.assign(attendance, {
                duration: +duration, start: +start / 1000, end: +end / 1000,
                lastId: activity._id,
                last_ideal_start_from: moment(end).subtract((duration - activeSeconds), 'seconds'),
                last_ideal_end_to: end,
                idleSeconds: duration - activeSeconds, appTotalSeconds: +duration, appActiveSeconds: activeSeconds
            });
        }
        redis.set(key, JSON.stringify(attendance), 'EX', DAY_DURATION);
        return attendance;
    }
    catch (err) {
        logger.error('Error: ', err);
        return null;
    }
};
const calcIdealAttendance = async (activitys, key) => {
    try {
        const { redis } = jobs;
        let attendance = (await redis.get(key));
        attendance = !attendance ? {} : JSON.parse(attendance);
        for (const activity of activitys) {
            const { attendance_id, total_duration: duration, start_time: start, end_time: end, active_seconds: activeSeconds } = activity;
            if (attendance.duration) {
                if (attendance.lastId == activity._id) {
                    let idle = 0;
                    if ((activeSeconds - attendance.appActiveSeconds) == 0) {
                        idle = attendance.idleSeconds + ((duration - attendance.appTotalSeconds) - (activeSeconds - attendance.appActiveSeconds));
                    } else {
                        idle = (duration - attendance.appTotalSeconds) - (activeSeconds - attendance.appActiveSeconds);
                    }
                    Object.assign(attendance, {
                        duration: +attendance.prevDuration + duration, end: +end / 1000,
                        appTotalSeconds: duration,
                        appActiveSeconds: activeSeconds,
                        idleSeconds: idle,
                        last_ideal_start_from: moment(end).subtract((idle), 'seconds'),
                        last_ideal_end_to: end,
                        domainId: activity.domain_id,
                        attendance_id
                    });
                } else {
                    if (attendance.domainId == activity.domain_id && activeSeconds == 0) {
                        Object.assign(attendance, {
                            duration: +attendance.prevDuration + duration,
                            end: +end / 1000,
                            appTotalSeconds: duration,
                            appActiveSeconds: activeSeconds,
                            idleSeconds: attendance.idleSeconds + duration,
                            last_ideal_start_from: moment(attendance.last_ideal_start_from),
                            last_ideal_end_to: end,
                            domainId: activity.domain_id,
                            attendance_id
                        });
                    } else {
                        Object.assign(attendance, {
                            duration: duration,
                            end: +end / 1000,
                            lastId: activity._id,
                            prevDuration: attendance.duration,
                            last_ideal_start_from: moment(end).subtract((duration - activeSeconds), 'seconds'),
                            last_ideal_end_to: end,
                            idleSeconds: duration - activeSeconds,
                            appTotalSeconds: duration,
                            appActiveSeconds: activeSeconds,
                            domainId: activity.domain_id,
                            attendance_id
                        });
                    }
                }
            } else {
                Object.assign(attendance, {
                    duration: +duration, start: +start / 1000, end: +end / 1000,
                    lastId: activity._id,
                    last_ideal_start_from: moment(end).subtract((duration - activeSeconds), 'seconds'),
                    last_ideal_end_to: end,
                    idleSeconds: duration - activeSeconds,
                    appTotalSeconds: +duration,
                    appActiveSeconds: activeSeconds,
                    domainId: activity._id,
                    attendance_id
                });
            }
        }
        redis.set(key, JSON.stringify(attendance), 'EX', DAY_DURATION);

        return attendance;
    }
    catch (err) {
        logger.error('Error: ', err);
        return null;
    }
};
exports.idealTimeCalc = async (docs) => {
    try {
        if (docs.length == 0) return
        const idealTimeKey = `ideal.${docs[0].attendance_id}`;
        await calcIdealAttendance(docs, idealTimeKey);
        return true;
    } catch (e) {

        logger.error(e);
        return false;
    }
};