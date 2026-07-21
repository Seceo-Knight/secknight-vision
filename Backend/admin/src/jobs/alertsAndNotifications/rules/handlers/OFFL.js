const moment = require('moment-timezone');
const common = require('../common');
const jobsCommon = require('../../jobsCommon');
const delayedJob = common.delayedJobs('OFFL', 'offlineJob');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');
const configFile = require("../../../../../../config/config");

// When someone is offline for more than specified minutes.

const processCondition = async (condition, attendance) => {
    const { empId, attendanceId } = attendance;
    if (condition.type !== 'MNT') return;
    const timestamp = (attendance.end + 1) * 1000 + condition.cmp_argument * 60000;
    // const timestamp = + moment(attendance.end).add(condition.cmp_argument, 'minutes');

    await delayedJob.add(timestamp, condition.notification_rule_id, condition.id, empId, attendanceId);

};

module.exports.ruleCreated = async (rule) => {
};
module.exports.ruleUpdated = async (rule) => {
    await delayedJob.deleteAll(rule.id);
};
module.exports.ruleDeleted = async (rule) => {
    await delayedJob.deleteAll(rule.id);
};


module.exports.activityCreated = async (rule, attendance) => {
    for (const condition of rule.conditions) {
        await processCondition(condition, attendance);
    }
    return true;
};

class AlertHandler extends common.AlertHandlerBase {
    async getSubject() {
        const period = await this.getPeriod();
        const { language, reseller_id, id } = await this.getOrganization();
        let resellerEmail = null;
        if (reseller_id) {
            const { details } = await this.getReseller(reseller_id);
            resellerEmail = JSON.parse(details);
            resellerEmail = resellerEmail.admin_email;
        }
        if(configFile.CUSTOM_LATE_LOGIN_ALERT.includes(id)){
            return {
                from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
                en: alert["en"]["OFFLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
                ol: alert[language || "en"]["OFFLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', '')
            };
        }
        return {
            en: alert["en"]["OFFLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()),
            ol: alert[language || "en"]["OFFLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName())
        };
        // `Employee idle for more than ${period}.`;
    }

    async getMessage() {
        const period = await this.getPeriod();
        const { language, reseller_id, id } = await this.getOrganization();
        let resellerEmail = null;
        if (reseller_id) {
            const { details } = await this.getReseller(reseller_id);
            resellerEmail = JSON.parse(details);
            resellerEmail = resellerEmail.admin_email;
        }
        if(configFile.CUSTOM_LATE_LOGIN_ALERT.includes(id)){
            return {
                from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
                en: alert["en"]["OFFLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
                ol: alert[language || "en"]["OFFLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', '')
            };
        }
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["OFFLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()),
            ol: alert[language || "en"]["OFFLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName())
        };
        // `Employee ${await this.getEmployeeName()} is idle for more than ${period}.`;
    }
}
module.exports.AlertHandler = AlertHandler;
