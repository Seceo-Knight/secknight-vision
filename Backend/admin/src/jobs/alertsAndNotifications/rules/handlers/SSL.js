const common = require('../common');
const jobsCommon = require('../../jobsCommon');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');

const moment = require("moment");
const configFile = require("../../../../../../config/config");

// When someone starts late by specified minutes.

const processCondition = async ({ condition, attendance }) => {
    if (!attendance.shift.start) return;
    if (condition.type !== 'MNT') return;
    const { empId, attendanceId } = attendance;
    const maxDiff = jobsCommon.durationSeconds(condition);
    const diff = attendance.start - attendance.shift.start;
    if (diff > maxDiff) {
        await jobsCommon.enqueue(
            'sendAlertJob',
            [
                condition.notification_rule_id, condition.id, empId, attendanceId,
                { type: condition.type, diff: diff },
            ],
        );
    }
};

module.exports.ruleCreated = async (rule) => {
};
module.exports.ruleUpdated = async (rule) => {
};
module.exports.ruleDeleted = async (rule) => {
};

module.exports.activityCreated = async (rule, attendance) => {
    if (!attendance.isNew) return;
    for (const condition of rule.conditions) {
        await processCondition({ condition, attendance });
    }
};

class AlertHandler extends common.AlertHandlerBase {
    async getSubject() {
        const { diff, type } = this.messageParams;
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
                en: alert["en"]["SSLMsg"].replace('cmd', formatSeconds(diff)).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
                ol: alert[language || "en"]["SSLMsg"].replace('cmd', formatSeconds(diff)).replace('empname', await this.getEmployeeName()).replace('Employee', '')
            };
        }
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["SSLMsg"].replace('cmd', formatSeconds(diff)).replace('empname', await this.getEmployeeName()),
            ol: alert[language || "en"]["SSLMsg"].replace('cmd', formatSeconds(diff)).replace('empname', await this.getEmployeeName())
        };
        // `Employee starts late by ${period}.`;
    }

    async getMessage() {
        const { diff, type } = this.messageParams;
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
                en: alert["en"]["SSLMsg"].replace('cmd', formatSeconds(diff)).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
                ol: alert[language || "en"]["SSLMsg"].replace('cmd', formatSeconds(diff)).replace('empname', await this.getEmployeeName()).replace('Employee', '')
            };
        }
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["SSLMsg"].replace('cmd', formatSeconds(diff)).replace('empname', await this.getEmployeeName()),
            ol: alert[language || "en"]["SSLMsg"].replace('cmd', formatSeconds(diff)).replace('empname', await this.getEmployeeName())
        };
        // `Employee ${await this.getEmployeeName()} starts late by ${period}.`;
        // return `Employee ${await this.getEmployeeName()} starts in ${this.getPeriodHumanized(diff, type)} late.`;

    }
}
module.exports.AlertHandler = AlertHandler;


function formatSeconds(seconds) {
  const duration = moment.duration(seconds, 'seconds');
  const hours = Math.floor(duration.asHours());
  const mins = duration.minutes();
  const secs = duration.seconds();
  return `${hours}h ${mins}m ${secs}s`;
}