const Joi = require('joi');

const bool = () => Joi.boolean().required();

class PfValidator {
    /**
     * A function for validate update ESI parameters
     * @function updateEsiSettings
     * @param {*} params
     * @returns {*} Values or Error 
     */
    static updateEsiSettings(params) {
        return Joi.validate(params,
            Joi.object().keys({
                esiAllowed: bool(),
                esiIndividualOverride: bool(),
                includeEmployerEsiContributionInCtc: bool(),
                statutoryMaxMonthlyGrossForEsi: Joi.number().required(),
                esiEffectiveDate: Joi.date().required()
            }));

    }

}
module.exports = PfValidator
