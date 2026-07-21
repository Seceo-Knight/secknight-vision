const Joi = require('joi');
const { pfContribution: pfContributionSchema } = require('../overview/overview.validator')

const bool = () => Joi.boolean().required();
const obj = () => Joi.object().unknown(true);
const num = () => Joi.number();
const pfContribution = () => obj().required().keys({
    basic: bool(),
    percentage: num().required(),
})

class PfValidator {
    /**
     * A function for validate update pf parameters
     * @function updatePfSettings
     * @param {*} params
     * @returns {*} Values or Error 
     */
    static updatePfSettings(params) {
        return Joi.validate(params,
            Joi.object().keys({
                pfAllowed: bool(),
                employeeContribution: pfContributionSchema(),
                // pfEmployerContribution: bool(),
                employerContribution: pfContributionSchema(),
                pfCeiling: num().positive(0).required(),
                pfIndividualOverride: bool(),
                lopDependent: bool(),
                includeEdliPfAdminChargesInCtc: bool(),
                enableStatutoryMinimumCeiling: bool(),
                employerPfContributionIncludedInCtc: bool(),
                pfEffectiveDate: Joi.date().required(),
            }));

    }

}
module.exports = PfValidator
