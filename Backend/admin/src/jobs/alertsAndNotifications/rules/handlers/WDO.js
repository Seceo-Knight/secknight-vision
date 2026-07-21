const common = require('../common');
const jobsCommon = require('../../jobsCommon');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');


// When someone works on day offs.

module.exports.ruleCreated = async (rule) => {
};
module.exports.ruleUpdated = async (rule) => {
};
module.exports.ruleDeleted = async (rule) => {
};

module.exports.activityCreated = async (rule, attendance) => {
    if (!attendance.isNew) return;
    if (attendance.shift.start) return;
    const { empId, attendanceId } = attendance;
    await jobsCommon.enqueue('sendAlertJob', [rule.id, null, empId, attendanceId]);
};

class AlertHandler extends common.AlertHandlerBase {
    async getSubject() {
        const { language } = await this.getOrganization();
        return {
            en: alert["en"]["WDOSub"],
            ol: alert[language || "en"]["WDOSub"]
        };
        // 'Employee works on day off.';
    }

    async getMessage() {
        const { language, reseller_id } = await this.getOrganization();
        let resellerEmail = null;
        if (reseller_id) {
            const { details } = await this.getReseller(reseller_id);
            resellerEmail = JSON.parse(details);
            resellerEmail = resellerEmail.admin_email;
        }
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["WDOMsg"].replace('empname', await this.getEmployeeName()),
            ol: alert[language || "en"]["WDOMsg"].replace('empname', await this.getEmployeeName())
        };
        // `Employee ${await this.getEmployeeName()} works on day off.`;
    }
}
module.exports.AlertHandler = AlertHandler;
