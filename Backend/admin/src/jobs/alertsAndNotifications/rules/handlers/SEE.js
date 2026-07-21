const moment = require('moment-timezone');
const common = require('../common');
const jobsCommon = require('../../jobsCommon');
const delayedJob = common.delayedJobs('SEE', 'SEEJob');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');
const configFile = require("../../../../../../config/config");

// When someone ends early by specified minutes.

const processCondition = async (condition, attendance) => {
    if (!attendance.shift.start) return;
    const { empId, attendanceId } = attendance;
    if (condition.type !== 'MNT') return;
    if (attendance.isNew) {
        const timestamp = attendance.shift.end * 1000;
        await delayedJob.add(timestamp, condition.notification_rule_id, condition.id, empId, attendanceId);
    }
};

module.exports.ruleCreated = async (rule) => {
    await common.touchRuleEmployees(rule)(async ({ condition, attendanceId }) => {
        const attendance = await jobsCommon.attendanceById(attendanceId);
        if (!attendance || attendance.date !== moment().format('YYYY-MM-DD')) return;
        await processCondition(condition, { ...attendance, isNew: true });
    });
};
module.exports.ruleUpdated = async (rule) => {
    delayedJob.deleteAll(rule.id);
};
module.exports.ruleDeleted = async (rule) => {
    delayedJob.deleteAll(rule.id);
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
                en: alert["en"]["SEEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
                ol: alert[language || "en"]["SEEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
            };
        }
        return {
            en: alert["en"]["SEEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()),
            ol: alert[language || "en"]["SEEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName())
        };
        // `Employee ends early than ${period}.`;
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
                en: alert["en"]["SEEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
                ol: alert[language || "en"]["SEEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
            };
        }
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["SEEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()),
            ol: alert[language || "en"]["SEEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName())
        };
        // `Employee ${await this.getEmployeeName()} ends early than ${period}.`;
    }
}
module.exports.AlertHandler = AlertHandler;
