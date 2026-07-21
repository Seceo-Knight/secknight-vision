const _ = require('underscore');
const moment = require('moment-timezone');
const { emailReportsModel: reportModel } = require('./emailreports.model');
// const { ReportBuilder } = require('../../../../../admin/src/routes/v3/reports/emailreport/testemail/ReportBuilder');
const { ReportBuilder } = require('./testemail/ReportBuilder');
const { UnReportBuilder } = require("./testemail/UnReportBuilder");
const {LogsReportBuilder} = require('./testemail/activityLoginReports')
const { timezones_details: timezones } = require('../../../utils/timezones');

const { logger: Logger } = require("../../../utils/Logger");
const Config = require("../../../../../config/config");

const hourToSeconds = (hours) => {
    const data = hours.split(":");
    return ((+data[0] * 3600) + (+data[1] * 60));
}

const DAY_NAME_TO_NUMBER = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
};

class emailReportsController {
    static async sendEmailReports(cb) {
        Logger.info(`-----------Starting for Send Mail report ${new Date()}----------------`)
        console.log('--------cron called--------');
        try {
            let reports = [];
            const now = moment();
            let reportTimezone = [];
            timezones.map(timezone => {
                const nowTz = now.tz(timezone.zone);
                if (nowTz.hour() === 0 && nowTz.minutes() < 29) {
                    reportTimezone.push(timezone.zone);
                }
            });

            //1-dailly 2-week 3-month 4-custom
            let reportsData = reportTimezone.length > 0 ? await reportModel.getReports([1, 2, 3, 5], now.format("YYYY-MM-DD"), reportTimezone) : [];
            let customTimeReport = await reportModel.getReportsWithCustom(now.format("YYYY-MM-DD"), [9])
            let customReportsData = await reportModel.getReportsWithCustom(now.format("YYYY-MM-DD"), [4]);

            for (const report of customTimeReport) {
                const { timezone, name, report_types, custom } = report;
                report.report_types = report_types.split(',');
                report.custom = JSON.parse(custom);
                if (!report.custom || !report.custom.time) continue;
                let userInputTime = moment.tz(report.custom.time, "HH:mm", timezone);
                if (!userInputTime.isValid()) continue;
                const nowTz = moment().tz(timezone);
                const minuteDifference = nowTz.diff(userInputTime, 'minutes');
                console.log(`----${name}----${minuteDifference} minutes---`);
                if (minuteDifference >= 0 && minuteDifference <= 29) {
                    reports.push(report);
                }
            }


            for (const report of customReportsData) {

                const { timezone } = report;
                // split the report_types
                report.report_types = report.report_types.split(',');

                let currentDate = moment().toISOString()
                if (report.custom == null) {
                    continue
                }
                //utc conversion
                report.custom = JSON.parse(report.custom)
                let loginEndDate = getUtcTimeZone(currentDate, report.custom.end, timezone)

                let now = moment()
                const nowTz = now.tz(timezone);
                var start_date = moment(loginEndDate, 'YYYY-MM-DD HH:mm:ss');
                var end_date = moment(nowTz, 'YYYY-MM-DD HH:mm:ss');
                var duration = moment.duration(end_date.diff(start_date));

                let isReportSend = moment(nowTz.toISOString()).isAfter(moment(loginEndDate).toISOString()); //true
                if (isReportSend == true) {

                    if (duration.asDays() == 0 || duration.asHours() == 0 || duration.asMinutes() <= 30) {
                        reports.push(report)
                    }

                } else {
                    continue
                }
            }

            if (reportsData.length > 0) {

                for (const report of reportsData) {

                    const { id, timezone, name, organization_id: orgId, frequency, content, recipients, language } = report;
                    // split the report_types
                    report.report_types = report.report_types.split(',');


                    const nowTz = now.tz(timezone);
                    if (frequency == 5) {
                        let condition = report.custom ? JSON.parse(report.custom) : null;
                        condition = condition && condition?.date ? condition?.date : condition;
                        if (!condition || (nowTz.date() != condition)) continue;
                    }
                    if(Config.AUTO_EMAIL_REPORT_WEEKLY_AND_SORTING_PRODUCTIVITY_REPORTS.includes(+orgId) && frequency == 2 && nowTz.day() == 6) {
                        reports.push(report);
                        continue;
                    }
                    if (nowTz.hour() != 0 || nowTz.minutes() > 29) continue;
                    if (frequency == 2) {
                        const customDay = Config.WEEKLY_REPORTS_SCHEDULE[+orgId];
                        const expectedDay = customDay
                            ? DAY_NAME_TO_NUMBER[customDay.toLowerCase()]
                            : 1; // default: Monday
                        if (nowTz.day() != expectedDay) continue;
                    }
                    if (frequency == 3 && nowTz.date() != 1) continue;
                    reports.push(report);
                }
            }
            if (reports.length == 0) return;

            for (const report of reports) {
                const { id, timezone, name, organization_id: orgId, frequency, content, recipients, language, report_types: reportTypes, custom } = report;
                // let orgProductiveHours = await reportModel.getOrganizationSettings(orgId);
                let orgProductiveHours = 0;
                let orgSettings = await reportModel.getOrganizationSettings(orgId);
                if (orgSettings.length !== 0) {
                    let setting = JSON.parse(orgSettings[0].rules);
                    orgProductiveHours = setting.productiveHours ? (setting.productiveHours.mode == 'unlimited' ? 0 : hourToSeconds(setting.productiveHours.hour)) : 0;
                }
                // const nowTz = now.tz(timezone);
                // if (nowTz.hour() != 0 || nowTz.minutes() > 29) continue;
                // if (frequency == 2 && nowTz.day() != 1) continue;
                // if (frequency == 3 && nowTz.date() != 1) continue;

                let empIds = [];
                let depIds = [];
                if (+report.filter_type === 1) {
                    depIds = _.pluck(await reportModel.getAllDepartments(orgId), "id");
                }
                if (+report.filter_type === 2) {
                    empIds = _.pluck(await reportModel.getReportUser(id), 'employee_id');
                    if (empIds.length === 0) continue;
                } else if (+report.filter_type === 3) {
                    depIds = _.pluck(await reportModel.getReportDept(id), 'department_id');
                    if (depIds.length === 0) continue;
                } else if (+report.filter_type === 4) {
                    empIds = _.pluck(await reportModel.getReportLocation(report.location_ids, orgId), 'id');
                    if (empIds.length === 0) continue;
                    report.filter_type = 2;
                }
                else if (+report.filter_type === 5 && report.shift_ids.length) {
                    // shift_ids
                    let [checkReportCreatedBy] = await reportModel.checkReportCreatedBy(report.created_by);
                    empIds = _.pluck(await reportModel.getReportShift(report.shift_ids, orgId, checkReportCreatedBy), 'id')
                    if (empIds.length === 0) continue;
                    report.filter_type = 2;
                }
                // Check if report is created by employee
                let checkReportCreatedBy = await reportModel.checkReportCreatedBy(report.created_by);
                if (checkReportCreatedBy.length !== 0){
                    if(report && report.created_by && (+report.filter_type === 3) && depIds.length != 0){
                        let assigned_employee_id =await reportModel.getAssignedEmployees(report.created_by, depIds, orgId);
                        if (assigned_employee_id.length === 0) empIds = [0];
                        else empIds = _.pluck(assigned_employee_id, "id");
                    }
                }
                if (+report.filter_type !== 3 && !depIds.length && empIds.length) {
                    depIds = _.pluck(await reportModel.getAllAssignedDepartments(orgId, empIds), "department_id");
                }
                /** fetch reseller details */
                let [resellerData] = await reportModel.getResellerDetails(orgId);
                let [isReseller] = await reportModel.isReseller(orgId);
                if (!resellerData?.logo && !resellerData?.details && isReseller?.logo && isReseller.details) {
                    resellerData = isReseller;
                }
                
                const reportBuilder = new ReportBuilder({
                    timezone, name: name.replace(/([^a-zA-Zء-ي ]+)([^0-9٠-٩]*)/g, ""), orgId, empIds, depIds, frequency,
                    content: JSON.parse(content), recipients: recipients.split(','), orgProductiveHours, language, resellerData, reportTypes, custom, filterType: report.filter_type,
                    customMailSilah: Config.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').includes(String(resellerData?.reseller_organization_id)) || Config.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').includes(String(orgId))
                });

                try {
                    // await reportBuilder.sendMailBackground();
                    await reportBuilder.sendMail();
                } catch (err) {
                    await reportBuilder.finalize();
                } finally {
                    await reportBuilder.finalize();
                }
            }
        } catch (err) {
            console.log('----error occured----', err);
        } finally {
            Logger.info(`-----------End for Send Mail report ${new Date()}----------------`)
            cb();
        }
    }

    static async sendUnProdMailReport(cb) {
        console.log('--------cron called--------');
        Logger.info(`-----------Starting for Send unproductive Mail report ${new Date()}----------------`)
        try {
            // 6 for glb dashboard
            let reportsData = await reportModel.getUnEmpReports(6);

            for (let reports of reportsData) {
                const { timezone, name, organization_id, frequency, content, recipients, language, report_types, custom } = reports;

                let orgProductiveHours = 0;
                let orgSettings = await reportModel.getOrganizationSettings(organization_id);
                if (orgSettings.length !== 0) {
                    let setting = JSON.parse(orgSettings[0].rules);
                    orgProductiveHours = setting.productiveHours ? (setting.productiveHours.mode == 'unlimited' ? 0 : hourToSeconds(setting.productiveHours.hour)) : 0;
                }

                let empIds = [];
                let depIds = [];
                if (+reports.filter_type === 2) {
                    empIds = _.pluck(await reportModel.getReportUser(reports.id), 'employee_id');
                    if (empIds.length === 0) continue;
                } else if (+reports.filter_type === 3) {
                    depIds = _.pluck(await reportModel.getReportDept(reports.id), 'department_id');
                    if (depIds.length === 0) continue;
                }

                const reportBuilder = new UnReportBuilder({
                    timezone, name: name.replace(/([^a-zA-Zء-ي ]+)([^0-9٠-٩]*)/g, ""), organization_id, frequency,
                    content: JSON.parse(content), recipients: recipients.split(','), language, report_types, custom, orgProductiveHours, filterType: reports.filter_type, empIds, depIds
                });

                try {
                    // await reportBuilder.sendMailBackground();
                    await reportBuilder.sendMail();
                    console.log(`---------------------Unproductive Email Report Send ------- ${organization_id} --------- ${recipients}--------`);
                } catch (err) {
                    await reportBuilder.finalize();
                    console.log(`---------------------Unproductive Email Report Error ------- ${err.message} ------- ${organization_id} --------- ${recipients}--------`);
                } finally {
                    await reportBuilder.finalize();
                }

            }
        }
        catch (err) {
            console.log(err);
        }
        finally {
            Logger.info(`-----------End for Send unproductive Mail report ${new Date()}----------------`)
            cb();
        }
    }
    static async sendActivityLoginReport(cb) {
        Logger.info(`-----------Starting for Send Activity Login Mail report ${new Date()}----------------`)
        try {
           
            let reportsData = await reportModel.getLogsEmpReports(7);

            for (let reports of reportsData) {
                const { timezone, name, organization_id, frequency, recipients, language, report_types, } = reports;

                const reportBuilder = new LogsReportBuilder({
                    timezone, name: name.replace(/([^a-zA-Zء-ي ]+)([^0-9٠-٩]*)/g, ""), organization_id, frequency,
                    recipients: recipients.split(','), language, report_types, filterType: reports.filter_type,
                });

                try {
                    await reportBuilder.sendMail();
                    Logger.info(`---------------------Activity Login Email Report Send ------- ${organization_id} --------- ${recipients}--------`);
                } catch (err) {
                    await reportBuilder.finalize();
                    Logger.info(`---------------------Activity Login Email Report Error ------- ${err.message} ------- ${organization_id} --------- ${recipients}--------`);
                } finally {
                    await reportBuilder.finalize();
                }
            }
        }
        catch (err) {
            Logger.error(`-----------${err}`)
        }
        finally {
            Logger.info(`-----------End for Send Activity Login Email Report ${new Date()}----------------`)
            cb();
        }
    }

}

module.exports = emailReportsController;

/**
 * set UTC time
 * @description function to get the Reseller data
 * @param {*} date,time,timezone 
 */
function getUtcTimeZone(date, time, timezone) {

    const [hours, minutes, seconds] = time.split(':');
    let isoDate = moment.tz(date.substr(0, 10), timezone).set({ hours, minutes: minutes, seconds, milliseconds: 0 }).utc();

    let fullDate = new Date(isoDate.toISOString());
    let year = fullDate.getFullYear();
    let month = fullDate.getMonth() + 1;
    let dt = fullDate.getDate();
    let second = fullDate.getSeconds()
    let minute = fullDate.getMinutes()
    let hour = fullDate.getHours()

    if (dt < 10) { dt = '0' + dt; }
    if (month < 10) { month = '0' + month; }
    if (second < 10) { second = '0' + second; }
    if (minute < 10) { minute = '0' + minute; }
    if (hour < 10) { hour = '0' + hour; }
    let finalDate = year + '-' + month + '-' + dt + ' ' + hour + ':' + minute + ':' + second;
    return finalDate;
}

// (async () => {
//     let orgProductiveHours = await reportModel.getOrganizationSettings(1);
//     let setting = JSON.parse(orgProductiveHours[0].rules);
//     const productive_hours = setting.productiveHours ? (setting.productiveHours.mode == 'unlimited' ? 0 : hourToSeconds(setting.productiveHours.hour)) : 0;

//     console.log(productive_hours, '-----------------')
// })
//     // ()