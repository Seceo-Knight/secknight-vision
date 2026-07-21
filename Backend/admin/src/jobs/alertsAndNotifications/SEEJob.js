const jobsCommon = require('./jobsCommon');

module.exports.SEEJob = {
    perform: async (ruleId, conditionId, empId, attendanceId) => {
        const condition = await jobsCommon.conditionById(conditionId);
        const maxDiff = jobsCommon.durationSeconds(condition);
        const {end, shift} = await jobsCommon.attendanceById(attendanceId);
        if (maxDiff < (shift.end - end)) {
            await jobsCommon.enqueue(
                'sendAlertJob',
                [ruleId, conditionId, empId, attendanceId],
            );
        }
    },
};