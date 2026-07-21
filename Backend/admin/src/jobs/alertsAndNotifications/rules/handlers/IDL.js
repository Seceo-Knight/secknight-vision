const common = require('../common');
const delayedAlertJob = common.delayedJobs('IDL', 'sendAlertJob');
const jobsCommon = require('../../jobsCommon');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');
const configFile = require("../../../../../../config/config");

// When someone is idle for more than specified minutes.

const processCondition = async (condition, attendance) => {
    try {
        if (condition.type !== 'MNT') return;
        const { empId, attendanceId, idleSeconds, trackingMode } = attendance;

        if (attendance.shift.start && idleSeconds >= condition.cmp_argument * 60) {
            await jobsCommon.enqueue('sendAlertJob', [condition.notification_rule_id, condition.id, empId, attendanceId]);
        } else if ((trackingMode == 'unlimited' || trackingMode == 'manual' || trackingMode == 'networkBased' || trackingMode == 'projectBased' || trackingMode == 'geoLocation') && idleSeconds >= condition.cmp_argument * 60) {
            await jobsCommon.enqueue('sendAlertJob', [condition.notification_rule_id, condition.id, empId, attendanceId]);
        }
    } catch (err) {
        console.log('--------', err);
        return false;
    }

    // if (!attendance.shift.start) return;
    // const { empId, attendanceId, activeSeconds, prevActiveSeconds } = attendance;
    // if (activeSeconds - prevActiveSeconds == 0) return;
    // if (condition.type !== 'MNT') return;

    // const timestamp = (attendance.end + 1) * 1000 + condition.cmp_argument * 60000;
    // if (timestamp > attendance.shift.start * 1000 && timestamp < attendance.shift.end * 1000) {
    //     await delayedAlertJob.add(timestamp, condition.notification_rule_id, condition.id, empId, attendanceId);
    // }
};

module.exports.ruleCreated = async (rule) => {
};
module.exports.ruleUpdated = async (rule) => {
    await delayedAlertJob.deleteAll(rule.id);
};
module.exports.ruleDeleted = async (rule) => {
    await delayedAlertJob.deleteAll(rule.id);
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
                en: alert["en"]["IDLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
                ol: alert[language || "en"]["IDLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', '')
            };
        }
        return {
            en: alert["en"]["IDLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
            ol: alert[language || "en"]["IDLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', '')
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
                en: alert["en"]["IDLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
                ol: alert[language || "en"]["IDLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', '')
            };
        }
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["IDLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', ''),
            ol: alert[language || "en"]["IDLMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()).replace('Employee', '')
        };
        // `Employee ${await this.getEmployeeName()} is idle for more than ${period}.`;
    }
}
module.exports.AlertHandler = AlertHandler;
