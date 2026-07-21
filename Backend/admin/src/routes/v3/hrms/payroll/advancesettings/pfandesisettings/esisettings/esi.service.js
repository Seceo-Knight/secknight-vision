const { pfModel } = require('../pfsettings/pf.model');
const { PfService } = require('../pfsettings/pf.service');
const { sendResponse } = require(`${utilsFolder}/myService`);
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { commonMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`);
const EsiValidator = require('./esi.validator');
const moment = require('moment');
const { organizationPayrollSettings } = require('../../organizationpayrollsettings.default')

class EsiService {

    /**
     * A function for get organization ESI settings
     * @function getEsiSettings
     * @memberof EsiService
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns {*} Success or Error
     */
    static getEsiSettings = async (req, res, next) => {
        try {
            const { organization_id, language } = req.decoded;
            const settings = await PfService.getOrgPFSettings(organization_id);
            if (settings.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);


            let { includeEmployerEsiContributionInCtc = false,
                statutoryMaxMonthlyGrossForEsi = null,
                esiIndividualOverride = false,
                esiAllowed = false,
                esiContribution = null,
                salaryStructure = null,
                esiEffectiveDate = null } = JSON.parse(settings[0]['settings']);

            esiContribution = {
                employeeEsi: esiContribution && esiContribution.employeeEsi ? esiContribution.employeeEsi : 0.75,
                employerEsi: esiContribution && esiContribution.employerEsi ? esiContribution.employerEsi : 3.25
            }
            return sendResponse(res, 200, { id: settings[0]['id'], organization_id, includeEmployerEsiContributionInCtc, esiEffectiveDate, statutoryMaxMonthlyGrossForEsi, esiIndividualOverride, esiAllowed, esiContribution, salaryStructure }, translate(commonMessages, "1", language), null);
        } catch (err) {
            console.log(err)
            next(err.message);
        }
    }

    /**
    * A function for update organization pf settings
    * @function updatePfSettings
    * @memberof PfService
    * @param {*} req 
    * @param {*} res 
    * @param {*} next 
    * @returns {*} cSuccess or Error
    */
    static updateEsiSettings = async (req, res, next) => {
        try {
            let esiContribution = organizationPayrollSettings && organizationPayrollSettings.esiContribution ? organizationPayrollSettings.esiContribution : {};
            const { organization_id, language } = req.decoded;
            const { value, error } = EsiValidator.updateEsiSettings(req.body)
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            /**get organization ESI settings */
            const settings = await PfService.getOrgPFSettings(organization_id);

            value.esiEffectiveDate = value.esiEffectiveDate ? moment(value.esiEffectiveDate).format('YYYY-MM-DD') : value.esiEffectiveDate;

            if (value.esiAllowed)
                value.esiContribution = {
                    employeeEsi: 0.75,
                    employerEsi: 3.25
                }

            let esiSettings = settings.length && settings[0]['settings'] ? JSON.parse(settings[0]['settings']) : { esiContribution };
            esiSettings = { ...esiSettings, ...value }
            esiSettings = JSON.stringify(esiSettings);

            if (settings.length > 0 && settings[0]['settings']) {
                await pfModel.updatePfSettings(organization_id, esiSettings);
            } else {
                await pfModel.createPfSettings(organization_id, esiSettings);
            }
            return sendResponse(res, 200, { ...value }, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err);
        }
    }

}
module.exports.EsiService = EsiService;