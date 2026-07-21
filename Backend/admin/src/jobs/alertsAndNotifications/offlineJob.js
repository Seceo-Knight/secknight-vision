const moment = require('moment');
const jobsCommon = require('./jobsCommon');
const Mysql = require('../../database/MySqlConnection').getInstance();

module.exports.offlineJob = {
    perform: async (ruleId, conditionId, empId, attendanceId) => {
        try {
            const condition = await jobsCommon.conditionById(conditionId);
            const [recentAtt] = await Mysql.query(`SELECT * FROM employee_attendance WHERE employee_id=${empId} ORDER BY date DESC LIMIT 1`)
            if (!recentAtt) return;

            const from_date = moment().subtract(condition.cmp_argument, 'minutes');
            const to_date = moment();
            if (moment(recentAtt.end_time).isBetween(from_date, to_date) || moment(recentAtt.end_time).isAfter(to_date)) return;

            await jobsCommon.enqueue('sendAlertJob', [ruleId, conditionId, empId, attendanceId],);
        } catch (err) {
            console.log('------------', err);
            return false;
        }
    }
};