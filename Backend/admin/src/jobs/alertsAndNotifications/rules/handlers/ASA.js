const common = require('../common');
const jobsCommon = require('../../jobsCommon');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');
// When someone accesses a specified web page or applications.

const processCondition = async (condition, attendance, attendanceByActivity) => {
    const { empId, attendanceId } = attendance;
    const { appId, domainId } = attendanceByActivity;
    switch (condition.type) {
        case 'APP':
            if (condition.cmp_argument != appId) break;
            await jobsCommon.enqueue(
                'sendAlertJob',
                [condition.notification_rule_id, condition.id, empId, attendanceId],
            );
            break;
        case 'DMN':
            if (condition.cmp_argument != domainId) break;
            await jobsCommon.enqueue(
                'sendAlertJob',
                [condition.notification_rule_id, condition.id, empId, attendanceId],
            );
            break;
    }
};

module.exports.ruleCreated = async (rule) => {
};
module.exports.ruleUpdated = async (rule) => {
};
module.exports.ruleDeleted = async (rule) => {
};

module.exports.activityCreated = async (rule, attendance, attendanceByActivity) => {
    for (const condition of rule.conditions) {
        await processCondition(condition, attendance, attendanceByActivity);
    }
    return true;
};

class AlertHandler extends common.AlertHandlerBase {
    async getSubject() {
        const condition = await this.getCondition();
        const { language } = await this.getOrganization();
        return condition.type === 'APP' ? {
            en: alert["en"]["ASASubApp"],
            ol: alert[language || "en"]["ASASubApp"]
        } : {
                en: alert["en"]["ASASubWeb"],
                ol: alert[language || "en"]["ASASubWeb"]
            }
    }

    async getMessage() {
        const condition = await this.getCondition();
        const app = await this.getApp();
        const { language, reseller_id } = await this.getOrganization();
        let resellerEmail = null;
        if (reseller_id) {
            const { details } = await this.getReseller(reseller_id);
            resellerEmail = JSON.parse(details);
            resellerEmail = resellerEmail.admin_email;
        }
        return condition.type === 'APP' ? {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["ASAMsgApp"].replace('empname', await this.getEmployeeName()).replace('app', app.name),
            ol: alert[language || "en"]["ASAMsgApp"].replace('empname', await this.getEmployeeName()).replace('app', app.name)
        } : {
                from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
                en: alert["en"]["ASAMsgWeb"].replace('empname', await this.getEmployeeName()).replace('www', app.name),
                ol: alert[language || "en"]["ASAMsgWeb"].replace('empname', await this.getEmployeeName()).replace('www', app.name)
            }
    }
}
module.exports.AlertHandler = AlertHandler;
