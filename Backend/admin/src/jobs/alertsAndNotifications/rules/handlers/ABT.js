const common = require('../common');
const moment = require('moment-timezone');
const EmployeeModel = require('../../../../routes/v3/employee/Employee.model');
const ShiftModel = require('../../../../routes/v3/shifts/OrganizationShiftsModel');
const delayedAlertJob = common.delayedJobs('ABT', 'sendAlertJob');
const { logger: Logger } = require('../../../../logger/Logger');
const { alert } = require('../../../../utils/helpers/LanguageTranslate');
const { repeat } = require('lodash');


// When someone is absent.

const daysFromDateTimestamp = (shift, date, daysFromDate, timezone) => {
    let dateObj = moment(date).tz(timezone);
    let day = dateObj.day();
    const shiftData = JSON.parse(shift.data);
    const shifts = {};
    let dayPerWeek = 0;
    ShiftModel.DAYS.forEach((day, i) => {
        const shift = shiftData[day];
        shifts[i] = shift;
        if (shift.status) dayPerWeek++;
    });
    let daysDiff = 0;
    const weeksTotal = ~~(daysFromDate / dayPerWeek);
    daysDiff += weeksTotal * 7;
    daysFromDate -= dayPerWeek * weeksTotal;

    let i = 0;
    while (daysFromDate > 0) {
        if (shifts[day].status) daysFromDate--;
        daysDiff++;
        day = (day + 1) % 7;
        if (i === 365) break;
        i++;
    }
    const [hours, minutes] = shifts[day].time.end.split(':');
    return +dateObj.add(daysDiff, 'days').set({ hours, minutes, seconds: 0, milliseconds: 0 });
};

const processCondition = async (condition, attendance) => {
    if (!attendance.shift.start) return;
    const { empId, attendanceId, start, isNew } = attendance;
    if (condition.type !== 'ABT') return;

    if (isNew) {
        const employee = await EmployeeModel.get(empId);
        const trackingData = JSON.parse(employee.custom_tracking_rule);

        let shift = await employee.shift;
        if (!shift && trackingData.trackingMode == 'fixed') {
            shift = { data: JSON.stringify(trackingData.tracking.fixed) };
        }
        if (!shift) return;
        const timestamp = daysFromDateTimestamp(shift, +start * 1000, +condition.cmp_argument, employee.timezone);
        await delayedAlertJob.add(timestamp, condition.notification_rule_id, condition.id, empId, attendanceId);
    }
};

const activityCreated = async (rule, attendance) => {
    for (const condition of rule.conditions) {
        await processCondition(condition, attendance);
    }
    return true;
};

const ruleCreated = async (rule) => {
    await common.touchRuleEmployees(rule)(async ({ condition, empId, attendanceId, latestVisit }) => {
        let { cmp_argument: days, cmp_operator } = condition;
        if (cmp_operator == '>') {
            days = +days + 1;
        }
        let timestamp = latestVisit ? +latestVisit : moment().subtract(15, "days").valueOf();
        const employee = await EmployeeModel.get(empId);
        let shift = await employee.shift;
        const trackingData = JSON.parse(employee.custom_tracking_rule);
        if (!shift && trackingData.trackingMode == 'fixed') {
            shift = { data: JSON.stringify(trackingData.tracking.fixed) };
        }
        if (!shift) return;
        timestamp = daysFromDateTimestamp(shift, timestamp, days, employee.timezone);
        await delayedAlertJob.add(timestamp, condition.notification_rule_id, condition.id, empId, attendanceId);
    });
};

const repeatRule = async (rule, employee_id) => {
    await common.touchRuleEmployee(rule, employee_id)(async ({ condition, empId, attendanceId, latestVisit }) => {
        let { cmp_argument: days, cmp_operator } = condition;
        if (cmp_operator == '>') {
            days += 1;
        }
        let timestamp = latestVisit ? +latestVisit : moment().subtract(15, "days").valueOf();
        const employee = await EmployeeModel.get(empId);
        let shift = await employee.shift;
        const trackingData = JSON.parse(employee.custom_tracking_rule);
        if (!shift && trackingData.trackingMode == 'fixed') {
            shift = { data: JSON.stringify(trackingData.tracking.fixed) };
        }
        if (!shift) return;
        while (true) {
            let now = +(new Date());
            timestamp = daysFromDateTimestamp(shift, timestamp, days, employee.timezone);
            if (timestamp > now) {
                break;
            }

        }
        await delayedAlertJob.add(timestamp, condition.notification_rule_id, condition.id, empId, attendanceId);
    });
};

module.exports.ruleCreated = ruleCreated;

module.exports.ruleUpdated = async (rule) => {
    await delayedAlertJob.deleteAll(rule.id);
    await ruleCreated(rule);
};

module.exports.ruleDeleted = async (rule) => {
    await delayedAlertJob.deleteAll(rule.id);
};

module.exports.activityCreated = activityCreated;

class AlertHandler extends common.AlertHandlerBase {
    async getSubject() {
        const condition = await this.getCondition();
        const { language } = await this.getOrganization();
        const oneTime = await this.geABT();
        if (oneTime) {
            await repeatRule(this.rule, this.empId);
        }
        return {
            en: alert["en"]["ABTSub"].replace('cmd', condition.cmp_argument),
            ol: alert[language || "en"]["ABTSub"].replace('cmd', condition.cmp_argument)
        };
    }

    async getMessage() {
        const condition = await this.getCondition();
        const { language, reseller_id } = await this.getOrganization();
        let resellerEmail = null;
        if (reseller_id) {
            const { details } = await this.getReseller(reseller_id);
            resellerEmail = JSON.parse(details);
            resellerEmail = resellerEmail.admin_email;
        }
        return {
            from_email: resellerEmail ? resellerEmail : process.env.EMP_ALERT_ADMIN_EMAIL,
            en: alert["en"]["ABTMsg"].replace('empname', await this.getEmployeeName()).replace('cmd', condition.cmp_argument),
            ol: alert[language || "en"]["ABTMsg"].replace('empname', await this.getEmployeeName()).replace('cmd', condition.cmp_argument),
        };
    }
}

module.exports.AlertHandler = AlertHandler;
// let timestamp;
// const shift = { data: JSON.stringify({ "mon": { "status": true, "time": { "start": "09:00", "end": "18:00" } }, "tue": { "status": true, "time": { "start": "09:00", "end": "18:00" } }, "wed": { "status": true, "time": { "start": "09:00", "end": "18:00" } }, "thu": { "status": false, "time": { "start": "09:00", "end": "18:00" } }, "fri": { "status": false, "time": { "start": "09:00", "end": "18:00" } }, "sat": { "status": false, "time": { "start": "09:00", "end": "15:00" } }, "sun": { "status": false, "time": { "start": "09:00", "end": "18:00" } } }) }
// timestamp = moment().subtract(11, "days").valueOf();
// while (true) {
//     let now = +(new Date());
//     timestamp = daysFromDateTimestamp(shift, timestamp, 1, 'Asia/Kolkata');
//     if (timestamp > now) {
//         break;
//     }
//     timestamp = moment(timestamp).add(1, "days").valueOf();

// }
