const common = require('../common');
const jobsCommon = require('../../jobsCommon');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');

// When someone starts early by specified minutes.

const processCondition = async ({ condition, attendance }) => {
    if (!attendance.shift.start) return;
    if (condition.type !== 'MNT') return;
    const { empId, attendanceId } = attendance;
    const maxDiff = jobsCommon.durationSeconds(condition);
    const diff = attendance.shift.start - attendance.start;
    if (maxDiff < diff) {
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
        const period = await this.getPeriod();
        const { language } = await this.getOrganization();
        return {
            en: alert["en"]["SSESub"].replace('cmd', period),
            ol: alert[language || "en"]["SSESub"].replace('cmd', period)
        };
        // `Employee starts early than ${period}.`;
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
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["SSEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName()),
            ol: alert[language || "en"]["SSEMsg"].replace('cmd', period).replace('empname', await this.getEmployeeName())
        }
        // `Employee ${await this.getEmployeeName()} starts early than ${period}.`;
        // return `Employee ${await this.getEmployeeName()} starts in ${this.getPeriodHumanized(diff, type)} early.`;
    }
}

module.exports.AlertHandler = AlertHandler;
