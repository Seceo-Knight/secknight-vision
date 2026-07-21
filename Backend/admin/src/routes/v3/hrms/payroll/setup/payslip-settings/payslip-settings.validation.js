/** Payslip Settings Validation */


/** Imports */
const Joi = require("joi");


/**
 * @class PayslipSettingsValidation
 * Contains Methods for Validation
 */
class PayslipSettingsValidation {


    /**
     * update Payslip Settings Validation 
     * @param {*} params 
     * @author Akshay Dhood 
     */
    updatePayslipSettings(params) {
        const schema = Joi.object().keys({
            status: Joi.number().valid(0, 1).required(),
            day: Joi.when('status', {
                is: Joi.number().valid(1),
                then: Joi.number().integer().min(1).max(28).required(),
                otherwise: Joi.number().default(null)
            }),
            template_id: Joi.number().default(1)
        });

        return Joi.validate(params, schema);
    }
}


/** exports */
module.exports = new PayslipSettingsValidation;