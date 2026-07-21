const { pfModel } = require('./pf.model');
const { sendResponse } = require(`${utilsFolder}/myService`);
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { commonMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`);
const PfValidator = require('./pf.validator');
const moment = require('moment');
const { organizationPayrollSettings } = require('../../organizationpayrollsettings.default')
// console.log(JSON.stringify(organizationPayrollSettings))

class PfService {
    /**
     * @function getOrgPFSettings
     * @param {*} organization_id 
     * @returns {*} Success or Error
     */
    static getOrgPFSettings = async (organization_id) => {
        return await pfModel.getPfSettings(organization_id)
    }
    /**
     * A function for get organization pf settings
     * @function getPfSettings
     * @memberof PfService
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns {*} Success or Error
     */
    static getPfSettings = async (req, res, next) => {
        try {
            const { organization_id, language } = req.decoded;
            const PFSettings = await this.getOrgPFSettings(organization_id);
            if (PFSettings.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);
            let { pfAllowed = false,
                pfContribution = null,
                pfCeiling = null,
                pfIndividualOverride = false,
                lopDependent = false,
                includeEdliPfAdminChargesInCtc = false,
                enableStatutoryMinimumCeiling = false,
                employerPfContributionIncludedInCtc = false,
                pfEffectiveDate = null } = JSON.parse(PFSettings[0]['settings']);

            pfContribution = {
                employee: {
                    is_fixed: pfContribution && pfContribution.employee && pfContribution.employee.is_fixed ? pfContribution.employee.is_fixed : false,
                    fixed_amount: pfContribution && pfContribution.employee && pfContribution.employee.fixed_amount ? pfContribution.employee.fixed_amount : 0,
                    basic: pfContribution && pfContribution.employee && pfContribution.employee.basic ? pfContribution.employee.basic : false,
                    percentage: pfContribution && pfContribution.employee && pfContribution.employee.percentage ? pfContribution.employee.percentage : 0,
                    ceilingAmount: {
                        is_fixed: pfContribution && pfContribution.employee && pfContribution.employee.ceilingAmount && pfContribution.employee.ceilingAmount.is_fixed ? pfContribution.employee.ceilingAmount.is_fixed : false,
                        fixed_amount: pfContribution && pfContribution.employee && pfContribution.employee.ceilingAmount && pfContribution.employee.ceilingAmount.fixed_amount ? pfContribution.employee.ceilingAmount.fixed_amount : 0,
                        basic: pfContribution && pfContribution.employee && pfContribution.employee.ceilingAmount && pfContribution.employee.ceilingAmount.basic ? pfContribution.employee.ceilingAmount.basic : false,
                        percentage: pfContribution && pfContribution.employee && pfContribution.employee.ceilingAmount && pfContribution.employee.ceilingAmount.percentage ? pfContribution.employee.ceilingAmount.percentage : 0,
                    }
                },
                employer: {
                    is_fixed: pfContribution && pfContribution.employer && pfContribution.employer.is_fixed ? pfContribution.employer.is_fixed : false,
                    fixed_amount: pfContribution && pfContribution.employer && pfContribution.employer.fixed_amount ? pfContribution.employer.fixed_amount : 0,
                    basic: pfContribution && pfContribution.employer && pfContribution.employer.basic ? pfContribution.employer.basic : false,
                    percentage: pfContribution && pfContribution.employer && pfContribution.employer.percentage ? pfContribution.employer.percentage : 0,
                    ceilingAmount: {
                        is_fixed: pfContribution && pfContribution.employer && pfContribution.employer.ceilingAmount && pfContribution.employer.ceilingAmount.is_fixed ? pfContribution.employer.ceilingAmount.is_fixed : false,
                        fixed_amount: pfContribution && pfContribution.employer && pfContribution.employer.ceilingAmount && pfContribution.employer.ceilingAmount.fixed_amount ? pfContribution.employer.ceilingAmount.fixed_amount : 0,
                        basic: pfContribution && pfContribution.employer && pfContribution.employer.ceilingAmount && pfContribution.employer.ceilingAmount.basic ? pfContribution.employer.ceilingAmount.basic : false,
                        percentage: pfContribution && pfContribution.employer && pfContribution.employer.ceilingAmount && pfContribution.employer.ceilingAmount.percentage ? pfContribution.employer.ceilingAmount.percentage : 0,
                    }
                }
            }

            return sendResponse(res, 200, {
                pfAllowed, includeEdliPfAdminChargesInCtc,
                enableStatutoryMinimumCeiling,
                employerPfContributionIncludedInCtc,
                pfEffectiveDate,
                ...pfContribution,
                pfCeiling,
                pfIndividualOverride,
                lopDependent
            }, translate(commonMessages, "1", language), null);

        } catch (err) {
            console.log(err)
            next(err.message);
        }
    }

    /**
    * A function for upsert organization pf settings
    * @function updatePfSettings
    * @memberof PfService
    * @param {*} req 
    * @param {*} res 
    * @param {*} next 
    * @returns {*} Success or Error
    */

    static updatePfSettings = async (req, res, next) => {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = PfValidator.updatePfSettings(req.body)
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            /**get organization PF settings */
            let PFSettings = await this.getOrgPFSettings(organization_id);
            // if (PFSettings.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);
            value.pfEffectiveDate = value.pfEffectiveDate ? moment(value.pfEffectiveDate).format('YYYY-MM-DD') : value.pfEffectiveDate;

            let settings = PFSettings.length > 0 && PFSettings[0]['settings'] ? JSON.parse(PFSettings[0]['settings']) : {};
            settings = {
                ...settings,
                ...value,
                pfContribution: {
                    employee: value['employeeContribution'],
                    employer: value['employerContribution'],
                    // pfEmployerContribution: value['pfEmployerContribution']
                },
            }
            /**Remove unwanted values in setting object ,this data is added in pfContribution */
            delete settings['employeeContribution'];
            delete settings['employerContribution'];
            delete settings['pfEmployerContribution'];

            let newSettings = JSON.stringify(settings);
            if (PFSettings.length > 0 && PFSettings[0]['settings']) {
                await pfModel.updatePfSettings(organization_id, newSettings);
            } else {
                await pfModel.createPfSettings(organization_id, newSettings);
            }
            return sendResponse(res, 200, { value, settings }, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err);
        }
    }

}
module.exports.PfService = PfService;


// old settings
// { "payrollAllowed": true, "pfAllowed": true, 
// "pfContribution": { "employee": { "is_fixed": false, "fixed_amount": 1000, "basic": true, "percentage": 12 },
//  "employer": { "is_fixed": false, "fixed_amount": 1000, "basic": true, "percentage": 12 }, "pfEmployerContribution": true },
//   "includeEdliPfAdminChargesInCtc": true, "enableStatutoryMinimumCeiling": true, "employerPfContributionIncludedInCtc": true, "lopDependent": true, "pfIndividualOverride": true, "esiIndividualOverride": true, "pfCeiling": 15000, "esiAllowed": true, "esiContribution": { "employeeEsi": 0.75, "employerEsi": 3.25 }, "statutoryMaxMonthlyGrossForEsi": 20000, "includeEmployerEsiContributionInCtc": true, "payFrequency": "Monthly", "paycycle": { "from": 1, "to": 31 }, "payrollLeaveAttendanceCycle": { "from": 1, "to": 31 }, "payoutDate": 31, "cutOffDateNewJoinees": 31, "salaryStructure": "CTC", "effectiveDate": "2021-06-02", "includeWeeklyOffs": true, "includeHolidays": true, "taxProjectionToEmp": true, "taxcomputationToEmp": true, "ptSettings": { "ptAllowed": true, "ptStateOverride": true, "ptEffectiveDate": "2021-06-02", "allStates": true }, "pfEffectiveDat": "2021-06-30T00:00:00.000Z", "pfEffectiveDate": "2021-06-30" }


// {
//     "payrollAllowed": true, "pfAllowed": true,
//         "pfContribution": {
//             "employee": { "is_fixed": false, "fixed_amount": 1500, "basic": true, "percentage": 12 },
//         "employer": { "is_fixed": false, "fixed_amount": 1500, "basic": true, "percentage": 12 }
//     },
//     "includeEdliPfAdminChargesInCtc": true, "enableStatutoryMinimumCeiling": true, "employerPfContributionIncludedInCtc": true, "pfEffectiveDate": "2021-06-02", "lopDependent": true, "pfIndividualOverride": true, "esiIndividualOverride": true, "pfCeiling": 15000, "esiAllowed": true, "esiContribution": { "employeeEsi": 0.75, "employerEsi": 3.25 }, "esiEffectiveDate": "2021-06-02", "statutoryMaxMonthlyGrossForEsi": 20000, "includeEmployerEsiContributionInCtc": true, "payFrequency": "Monthly", "paycycle": { "from": 1, "to": 31 }, "payrollLeaveAttendanceCycle": { "from": 1, "to": 31 }, "payoutDate": 31, "cutOffDateNewJoinees": 31, "salaryStructure": "CTC", "effectiveDate": "2021-06-02", "includeWeeklyOffs": true, "includeHolidays": true, "taxProjectionToEmp": true, "taxcomputationToEmp": true, "ptSettings": { "ptAllowed": true, "ptStateOverride": true, "ptEffectiveDate": "2021-06-02", "allStates": true }
// }