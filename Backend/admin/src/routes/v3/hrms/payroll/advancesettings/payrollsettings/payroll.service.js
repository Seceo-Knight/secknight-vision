const { pfModel } = require('../pfandesisettings/pfsettings/pf.model');
const { PfService } = require('../pfandesisettings/pfsettings/pf.service');
const { sendResponse } = require(`${utilsFolder}/myService`);
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { commonMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`);
const PayrollValidator = require('./payroll.validator');
const { organizationPayrollSettings } = require('../organizationpayrollsettings.default')

const moment = require('moment');

class PayrollService {

    /**
     * A function for get Payroll settings
     * @function getSettings
     * @memberof PayrollService
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns {*} Success or Error
     */
    static getSettings = async (req, res, next) => {
        try {
            const { organization_id, language } = req.decoded;
            const settings = await PfService.getOrgPFSettings(organization_id);
            if (settings.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);

            let { includeWeeklyOffs = false, includeHolidays = false,
                payrollLeaveAttendanceCycle = null, paycycle = null,
                payFrequency = null, payrollAllowed = false, salaryStructure = null,
                effectiveDate = null, payoutDate = null, cutOffDateNewJoinees = null } = JSON.parse(settings[0]['settings']);

            let date = new Date();
            let lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

            if (paycycle == null)
                paycycle = {
                    from: 1,
                    to: lastDate
                }

            if (payrollLeaveAttendanceCycle == null)
                payrollLeaveAttendanceCycle = {
                    from: 1,
                    to: lastDate
                }

            return sendResponse(res, 200, {
                id: settings[0]['id'],
                includeWeeklyOffs,
                includeHolidays,
                payrollLeaveAttendanceCycle,
                paycycle,
                payFrequency,
                payrollAllowed,
                salaryStructure,
                effectiveDate,
                payoutDate,
                cutOffDateNewJoinees
            }, translate(commonMessages, "1", language), null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to get', null);
        }
    }

    /**
    * A function for update organization pf settings
    * @function updatePayrollSettings
    * @memberof PayrollService
    * @param {*} req 
    * @param {*} res 
    * @param {*} next 
    * @returns {*} Success or Error
    */
    static updatePayrollSettings = async (req, res, next) => {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = PayrollValidator.updatePayrollSettings(req.body);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            /**get organization ESI settings */
            let settings = await PfService.getOrgPFSettings(organization_id);

            value.effectiveDate = value.effectiveDate ? moment(value.effectiveDate).format('YYYY-MM-DD') : value.effectiveDate;

            let newSettings = settings.length > 0 && settings[0]['settings'] ? JSON.parse(settings[0]['settings']) : {};
            newSettings = { ...newSettings, ...value }
            newSettings = JSON.stringify(newSettings);

            if (settings.length > 0 && settings[0]['settings']) {
                await pfModel.updatePfSettings(organization_id, newSettings);
            } else {
                await pfModel.createPfSettings(organization_id, newSettings);
            }
            return sendResponse(res, 200, { ...value }, translate(commonMessages, "1", language), null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to update', null);
        }
    }
}
module.exports.PayrollService = PayrollService;
