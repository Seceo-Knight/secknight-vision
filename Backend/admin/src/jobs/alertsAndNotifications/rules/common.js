const jobs = require('../../');
const Organization = require('../../../routes/v3/organization');
const { EmployeeAttendanceModel } = require('../../../routes/v3/employee/EmployeeAttendanceModel');
const EmployeeModel = require('../../../routes/v3/employee/Employee.model');
const { EmployeeUserModel } = require('../../../routes/v3/employee/EmployeeUserModel');
const NotificationRuleConditions = require('../../../routes/v3/alertsAndNotifications/Models/NotificationRuleConditionsModel');
const OrgAppWebModel = require('../../../models/organization_apps_web.schema');
const UserProperties = require('../../../routes/v3/userProperties/UserPropertiesModel');
const { Mailer } = require('../../../messages/Mailer');
const Firebase = require('../../../messages/Firebase');
const WebSocketNotification = require('../../../messages/WebSocketNotification');
const { logger } = require('../../../logger/Logger');
const { ResellerModel } = require('../../../routes/v3/settings/reseller/Reseller.Model');

const touchRuleEmployees = (rule) => {
    return (async (callback) => {
        const { organization_id: orgId, conditions } = rule;
        const organisation = await Organization.OrganizationModel.get(orgId);
        const employeesIds = rule.include_employees.ids;
        // const employeesIds = await organisation.employeesIds;
        const lastVisitByEmployee = {};
        const attendances = await EmployeeAttendanceModel.query(
            `SELECT id, employee_id, date FROM ?? WHERE id IN(
                        SELECT MAX(id) FROM ?? WHERE organization_id IN(?) AND employee_id IN(?) GROUP BY employee_id
            )`,
            [EmployeeAttendanceModel.TABLE_NAME, EmployeeAttendanceModel.TABLE_NAME, orgId, employeesIds]
        );
        attendances.forEach((record) => {
            lastVisitByEmployee[record.employee_id] = record;
        });
        for (const condition of conditions) {
            for (const empId of employeesIds) {
                const { id: attendanceId, date: latestVisit } = lastVisitByEmployee[empId] || {};
                await callback({ condition, empId, attendanceId, latestVisit, organisation, orgId });
            }
        }
    });
};

const touchRuleEmployee = (rule, employee_id) => {
    return (async (callback) => {
        const { organization_id: orgId, conditions } = rule;
        const organisation = await Organization.OrganizationModel.get(orgId);
        const employeesIds = [employee_id];
        // const employeesIds = await organisation.employeesIds;
        const lastVisitByEmployee = {};
        const attendances = await EmployeeAttendanceModel.query(
            `SELECT id, employee_id, date FROM ?? WHERE id IN(
                        SELECT MAX(id) FROM ?? WHERE organization_id IN(?) AND employee_id IN(?) GROUP BY employee_id
            )`,
            [EmployeeAttendanceModel.TABLE_NAME, EmployeeAttendanceModel.TABLE_NAME, orgId, employeesIds]
        );
        attendances.forEach((record) => {
            lastVisitByEmployee[record.employee_id] = record;
        });
        for (const condition of conditions) {
            for (const empId of employeesIds) {
                const { id: attendanceId, date: latestVisit } = lastVisitByEmployee[empId] || {};
                await callback({ condition, empId, attendanceId, latestVisit, organisation, orgId });
            }
        }
    });
};
const delayedJobs = (type, jobClass) => {
    return {
        add: async (timestamp, ruleId, conditionId, empId, attendanceId) => {
            const key = `${type}.${ruleId}.${conditionId}.${empId}.${jobClass}`;
            const nowTimestamp = +(new Date());
            const prevJob = await jobs.redis.get(key);
            if (prevJob) {
                await jobs.queue.delDelayed(...JSON.parse(prevJob));
            }
            const jobArgs = [jobClass, [ruleId, conditionId, empId, attendanceId]];
            // await jobs.queue.delDelayed(...jobArgs);
            await jobs.queue.enqueueAt(timestamp, ...jobArgs);
            await jobs.redis.set(key, JSON.stringify(jobArgs), 'EX', ~~((timestamp - nowTimestamp) / 1000) + 60);
        },
        deleteAll: async (ruleId) => {
            const keys = await jobs.redis.keys(`${type}.${ruleId}.*.*.${jobClass}`);
            for (const key of keys) {
                const prevJob = await jobs.redis.get(key);
                await jobs.queue.delDelayed(...JSON.parse(prevJob));
            }
        }
    };
};

class AlertHandlerBase {
    constructor({ rule, conditionId, empId, attendanceId, messageParams }) {
        Object.assign(this, { rule, conditionId, empId, attendanceId, messageParams });
    }

    async getEmployee() {
        if (this._employee) return this._employee;
        this._employee = await EmployeeModel.get(this.empId);
        return this._employee;
    }

    async getEmployeeUser() {
        if (this._employeeUser) return this._employeeUser;
        const employee = await this.getEmployee();
        this._employeeUser = await EmployeeUserModel.get(employee.user_id);
        return this._employeeUser;
    }

    async getCondition() {
        if (this._condition) return this._condition;
        this._condition = await NotificationRuleConditions.NotificationRuleConditionsModel.get(this.conditionId);
        return this._condition;
    }
    async geABT() {
        if (this._abt) return false;
        this._abt = 'data';
        return true;
    }

    async getRecipientUsers() {
        return this.rule.recipientUsers;
    }

    async getApp(_condition) {
        if (this._app) return this._app;
        const condition = _condition || await this.getCondition();
        this._app = await OrgAppWebModel.findOne({ _id: condition.cmp_argument });
        return this._app;
    }

    async getEmployeeName() {
        const user = await this.getEmployeeUser();
        const email = user.a_email == null ? '' : `(${user.a_email})`
        return `${user.first_name} ${user.last_name}`;
    }

    async getOrganization() {
        if (this._organization) return this._organization;
        this._organization = await Organization.OrganizationModel.get(this.rule.organization_id);
        return this._organization;
    }

    async getReseller(reseller_id) {
        if (this._reseller) return this._reseller;
        this._reseller = await ResellerModel.get(reseller_id);
        return this._reseller;
    }

    getPeriodHumanized(seconds, type = 'MNT') {
        const minutes = ~~(seconds / 60) % 60;
        const hours = ~~(seconds / 3600);
        const hoursStr = `${hours} hour${hours > 1 ? 's' : ''}`;
        // if (type === 'HUR') return hoursStr;
        return `${hours > 0 ? `${hoursStr} ` : ''}${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    async getPeriod(condition) {
        if (this._period) return this._period;
        const { periodInSeconds, periodOutputFormat } = condition || await this.getCondition();
        this._period = this.getPeriodHumanized(periodInSeconds, periodOutputFormat);
        return this._period;
    }

    async getSubject() {
        return 'Alert subject';
    }

    async getMessage() {
        return 'Alert message';
    }

    async send({ alertId }) {
        const params = `rule: ${this.rule.id}, conditionId: ${this.conditionId}, empId: ${this.empId}, attendanceId: ${this.attendanceId}`;
        try {
            const { ol: subject } = await this.getSubject();
            const { ol: message, from_email } = await this.getMessage();
            const tokens = [];
            for (const recipient of await this.getRecipientUsers()) {
                try {
                    await Mailer.sendMail({
                        from: from_email,
                        to: `${recipient.first_name} ${recipient.last_name} <${recipient.email}>`,
                        subject: subject,
                        text: message,
                    });
                    if (this.rule.is_action_notify && process.env.PUSH_NOTIFICATION_TRANSPORT === 'firebase') {
                        const { firebaseToken } = await UserProperties.UserPropertiesModel
                            .get(recipient.id, ['firebaseToken']);
                        tokens.push(firebaseToken);
                    }
                } catch (err) {
                    logger.info('-----error while sending email-------', JSON.stringify(err))
                }
            }
            if (this.rule.is_action_notify) {
                if (tokens.length > 0) {
                    const firebaseResult = await Firebase.Firebase.sendMessage(tokens, message);
                }
                if (process.env.PUSH_NOTIFICATION_TRANSPORT === 'websocket') {
                    await WebSocketNotification.WebSocketNotification.sendMessage({ alertId });
                }
            }
        } catch (e) {
            logger.error('Error: ', e);
            throw e;
        }
    }
}

module.exports.touchRuleEmployees = touchRuleEmployees;
module.exports.touchRuleEmployee = touchRuleEmployee;
module.exports.delayedJobs = delayedJobs;
module.exports.AlertHandlerBase = AlertHandlerBase;