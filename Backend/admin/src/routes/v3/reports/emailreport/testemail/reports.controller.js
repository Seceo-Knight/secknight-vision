const Validation = require('./reports.validation');
const { sendResponse } = require('../../../../../utils/myService');
const { ReportBuilder } = require('./ReportBuilder');
const { logger: Logger } = require('../../../../../logger/Logger');
const { reportMessage } = require("../../../../../utils/helpers/LanguageTranslate");
const { reportsModel } = require('./reports.model');
const { UnReportBuilder } = require('./ReportBuilderUnproductive');
const { LogsReportBuilder } = require('./ReportBuilderLogs');
const _ = require("underscore");
const Config = require('../../../../../../../config/config');

const hourToSeconds = (hours) => {
    const data = hours.split(":");
    return ((+data[0] * 3600) + (+data[1] * 60));
}
class emailReportsController {
    async sendTestEmailReport(req, res) {
        try {
            const { organization_id: orgId, timezone, language, productive_hours, employee_id, is_admin } = req.decoded;

            if (req.body.frequency == 5 && (req.body.content.productivity == 1 || req.body.content.timesheet == 1 || req.body.content.apps_usage == 1 || req.body.content.websites_usage == 1)) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);
            if (JSON.stringify(req.body.report_types).match('pdf') && (req.body.content.hrms_attendance == '1' || req.body.content.attendance == '1')) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);
            if ((req.body.content.hrms_attendance == '1' || req.body.content.attendance == '1') && req.body.frequency != 5) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);
            if (!req.body?.custom?.date && req.body.frequency == 5) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);
            const validate = Validation.emailReport(req.body);
            if (validate.error) {
                return sendResponse(res, 404, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"], validate.error.details[0].message);
            }
            let {
                name, frequency, recipients, content, filter_type: filterType, user_ids: empIds, department_ids: depIds, location_ids, report_types: reportTypes, custom, shift_ids
            } = validate.value;

            if (frequency == 6) {
                res.json({ code: 200, data: null, message: reportMessage.find(x => x.id === "12")[language] || reportMessage.find(x => x.id === "12")["en"], error: null });
                await sendTestEmailReport(req, res, validate);
                return true;
            }
            if (frequency == 7) {
                res.json({ code: 200, data: null, message: reportMessage.find(x => x.id === "12")[language] || reportMessage.find(x => x.id === "12")["en"], error: null });
                await sendLogsEmailReport(req, res, validate);
                return true;
            }
            if(frequency == 9 && !custom && !custom.time) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "2")[language] || reportMessage.find(x => x.id === "2")["en"],);
            if (+filterType === 1) {
                depIds = _.pluck(await reportsModel.getAllDepartments(orgId), "id");
            }
            if (+filterType === 2) {
                if (empIds && empIds.length === 0) {
                    return sendResponse(res, 400, null, reportMessage.find(x => x.id === "3")[language] || reportMessage.find(x => x.id === "3")["en"], null);
                }
            } else if (+filterType === 3) {
                if (depIds && depIds.length === 0) {
                    return sendResponse(res, 400, null, reportMessage.find(x => x.id === "4")[language] || reportMessage.find(x => x.id === "4")["en"], null);
                }
            }
            else if (+filterType === 4 && location_ids.length) {
                // location_ids
                // find all employee ids
                empIds = _.pluck(await reportsModel.getEmployeeByLocationId(location_ids, orgId), 'id')
                filterType = 2;
            }
            else if (+filterType === 5 && shift_ids.length) {
                // shift_ids
                empIds = _.pluck(await reportsModel.getEmployeeByShift(shift_ids, orgId, is_admin ? null : employee_id), 'id');
                if(empIds.length == 0) return sendResponse(res, 400, null, reportMessage.find(x => x.id === "3")[language] || reportMessage.find(x => x.id === "3")["en"], null);
                filterType = 2;
            }
            if (employee_id && !(+filterType === 2) && depIds.length) {
                let assignedEmployees = await reportsModel.getAssignedEmployees(employee_id, orgId, depIds);
                if (assignedEmployees.length === 0) empIds = [0];
                else empIds = _.pluck(assignedEmployees, "id");
            }
            if (filterType !== 3 && !depIds.length && empIds.length) {
                depIds = _.pluck(await reportsModel.getAllAssignedDepartments(orgId, empIds), "department_id");
            }

            if (!Object.values(content).some(v => (+v === 1))) {
                return sendResponse(res, 400, null, reportMessage.find(x => x.id === "11")[language] || reportMessage.find(x => x.id === "11")["en"], null);
            }
            /** fetch reseller details */
            let [resellerData] = await reportsModel.getResellerDetails(orgId);
            let [isReseller] = await reportsModel.isReseller(orgId);
            if (!resellerData?.logo && !resellerData?.details && isReseller?.logo && isReseller.details) {
                resellerData = isReseller;
            }

            let orgProductiveHours = 0;
            let orgSettings = await reportsModel.getOrganizationSettings(orgId);
            if (orgSettings.length !== 0) {
                let setting = JSON.parse(orgSettings[0].rules);
                orgProductiveHours = setting.productiveHours ? (setting.productiveHours.mode == 'unlimited' ? 0 : hourToSeconds(setting.productiveHours.hour)) : 0;
            }
            const reportBuilder = new ReportBuilder({
                timezone, name: name.replace(/([^a-zA-Zء-ي ]+)([^0-9٠-٩]*)/g, ""), orgId, empIds, depIds: depIds, frequency, content, recipients, productiveHours: productive_hours, language, resellerData: resellerData, reportTypes, orgProductiveHours, custom, filterType,
                customMailSilah: Config.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').includes(String(resellerData?.reseller_organization_id)) || Config.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').includes(String(orgId))
            });
            try {
                res.json({ code: 200, data: null, message: reportMessage.find(x => x.id === "12")[language] || reportMessage.find(x => x.id === "12")["en"], error: null });
                await reportBuilder.sendMail(req);
                // await reportBuilder.finalize();
                // await reportBuilder.sendMailBackground();

                // return sendResponse(res, 200, null, reportMessage.find(x => x.id === "12")[language] || reportMessage.find(x => x.id === "12")["en"], null);
            } catch (err) {
                await reportBuilder.finalize();
                Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
                console.log('----error occured----', err);
                return sendResponse(res, 400, null, 'Failed to send test report', null);
            } finally {
                await reportBuilder.finalize();
            }
        } catch (err) {
            Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
            console.log('----error occured----', err);
            return sendResponse(res, 400, null, 'Failed to send test report', null);
        }
    }
}

const sendTestEmailReport = async (req, res, validate) => {
    const { organization_id, timezone, language, productive_hours } = req.decoded;
    const {
        name, frequency, recipients, content, filter_type: filterType, user_ids: empIds, department_ids: depIds, report_types, custom
    } = validate.value;

    const reportBuilder = new UnReportBuilder({
        timezone, name: name.replace(/([^a-zA-Zء-ي ]+)([^0-9٠-٩]*)/g, ""), organization_id, frequency,
        content: content, recipients: recipients, language, report_types, custom, orgProductiveHours: productive_hours, filterType, empIds, depIds
    });

    try {
        // await reportBuilder.sendMailBackground();
        await reportBuilder.sendMail();
    } catch (err) {
        await reportBuilder.finalize();
        Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
        console.log('----error occured----', err);
    } finally {
        await reportBuilder.finalize();
    }

    return true;
}
const sendLogsEmailReport = async (req, res, validate) => {
    const { organization_id, timezone, language } = req.decoded;
    const {
        name, frequency, recipients, filter_type: filterType, user_ids: empIds, department_ids: depIds, report_types
    } = validate.value;

    const reportBuilder = new LogsReportBuilder({
        timezone, name: name.replace(/[^a-zA-Z0-9 ]/g, ""), organization_id, frequency,
         recipients: recipients, language, report_types,  filterType, empIds, depIds
    });

    try {
        await reportBuilder.sendMail();
    } catch (err) {
        await reportBuilder.finalize();
        Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
    } finally {
        await reportBuilder.finalize();
    }

    return true;
}

module.exports = new emailReportsController;
