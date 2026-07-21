const jobsCommon = require('./jobsCommon');

module.exports.DWTLessJob = {
    perform: async (ruleId, conditionId, empId, attendanceId) => {
        const condition = await jobsCommon.conditionById(conditionId);
        const { shift, duration: attendanceDuration } = await jobsCommon.attendanceById(attendanceId);
        const shiftDuration = shift.end - shift.start;
        const duration = jobsCommon.durationSeconds(condition);
        const diff = shiftDuration - attendanceDuration;

        if (diff > duration) {
            await jobsCommon.enqueue(
                'sendAlertJob',
                [ruleId, conditionId, empId, attendanceId, { type: condition.type, duration: attendanceDuration },],
            );
        }
    },
};