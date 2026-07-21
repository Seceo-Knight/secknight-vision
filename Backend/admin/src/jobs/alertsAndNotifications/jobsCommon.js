const jobs = require('../');
const models = require('../../routes/v3/alertsAndNotifications/Models');

const attendanceById = async (attendanceId) => {
    const key = `attendance.${attendanceId}`;
    const attendance = await jobs.redis.get(key);
    if (!attendance) return;
    return JSON.parse(attendance);
};

const durationSeconds = (condition) => {
    switch (condition.type) {
        case 'MNT': return condition.cmp_argument * 60;
        case 'HUR': return condition.cmp_argument * 3600;
    }
};

const enqueue = async (...args) => {
    await jobs.queue.enqueue(...args);
};

const conditionById = async (conditionId) => {
    return await models.NotificationRuleConditionsModel.get(conditionId);
};

module.exports.attendanceById = attendanceById;
module.exports.durationSeconds = durationSeconds;
module.exports.enqueue = enqueue;
module.exports.conditionById = conditionById;