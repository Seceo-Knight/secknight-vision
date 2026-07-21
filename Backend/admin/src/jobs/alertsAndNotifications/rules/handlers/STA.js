const common = require('../common');
const jobsCommon = require('../../jobsCommon');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');

// When someone spends time more than specified on specified web page or applications.

module.exports.ruleCreated = async (rule) => {
};
module.exports.ruleUpdated = async (rule) => {
};
module.exports.ruleDeleted = async (rule) => {
};

module.exports.activityCreated = async (rule, attendance, attendanceByActivity) => {
    if (rule.conditions.length !== 2) return;
    const appOrDomainCondition = rule.conditions.find(condition => ['APP', 'DMN'].includes(condition.type));
    const timeCondition = rule.conditions.find(condition => ['MNT', 'HUR'].includes(condition.type));
    if (!appOrDomainCondition || !timeCondition) return;

    switch (appOrDomainCondition.type) {
        case 'APP':
            if (appOrDomainCondition.cmp_argument != attendanceByActivity.appId) return;
            break;
        case 'DMN':
            if (appOrDomainCondition.cmp_argument != attendanceByActivity.domainId) return;
            break;
    }

    const { empId, attendanceId } = attendance;

    const maxDuration = jobsCommon.durationSeconds(timeCondition);
    if (maxDuration < attendanceByActivity.duration) {
        await jobsCommon.enqueue(
            'sendAlertJob',
            [
                appOrDomainCondition.notification_rule_id, appOrDomainCondition.id, empId, attendanceId,
                { type: timeCondition.type, duration: attendanceByActivity.duration },
            ],
        );
    }
};

class AlertHandler extends common.AlertHandlerBase {
    conditions() {
        return {
            appOrDomainCondition: this.rule.conditions.find(condition => ['APP', 'DMN'].includes(condition.type)),
            timeCondition: this.rule.conditions.find(condition => ['MNT', 'HUR'].includes(condition.type)),
        };
    }
    async getSubject() {
        const { appOrDomainCondition, timeCondition } = this.conditions();
        const { language } = this.getOrganization();
        const cmp = (timeCondition.cmp_operator === '>' || timeCondition.cmp_operator === '>=') ? 'more' : 'less';
        const type = appOrDomainCondition.type === 'APP' ? 'application' : 'web page';
        const period = await this.getPeriod(timeCondition);
        return {
            en: alert["en"]["STASub"].replace('cmd', `${cmp}`).replace('period', period).replace('type', type),
            ol: alert[language || "en"]["STASub"].replace('cmd', `${cmp}`).replace('period', period).replace('type', type)
        };
        // `Employee spends ${cmp} than ${period} on ${type}.`;
    }

    async getMessage() {
        const name = await this.getEmployeeName();
        const { appOrDomainCondition } = this.conditions();
        const { language, reseller_id } = await this.getOrganization();
        const app = await this.getApp(appOrDomainCondition);
        const type = appOrDomainCondition.type === 'APP' ? 'application' : 'web page';
        const { duration, type: durationType } = this.messageParams;
        let resellerEmail = null;
        if (reseller_id) {
            const { details } = await this.getReseller(reseller_id);
            resellerEmail = JSON.parse(details);
            resellerEmail = resellerEmail.admin_email;
        }
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["STAMsg"].replace('empname', name).replace('type', type).replace('appname', app.name).replace('duration', this.getPeriodHumanized(duration, durationType)),
            ol: alert[language || "en"]["STAMsg"].replace('empname', name).replace('type', type).replace('appname', app.name).replace('duration', this.getPeriodHumanized(duration, durationType))
        };
        // `Employee ${name} spends ${this.getPeriodHumanized(duration, durationType)} on "${app.name}" ${type}.`;
    }
}
module.exports.AlertHandler = AlertHandler;
