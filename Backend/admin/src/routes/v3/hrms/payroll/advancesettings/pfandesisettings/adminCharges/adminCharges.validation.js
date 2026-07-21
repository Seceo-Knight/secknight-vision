// Admin Charges Validator

const Joi = require('joi');


// class
class AdminChargesValidation {

    /**
     * Validate update Admin Charges
     * @param {*} params 
     * @returns 
     */
    updateValidation(params) {
        const schema = Joi.object().keys({
            adminChargesAllowed: Joi.boolean().required(),
            adminChargesCeiling: Joi.number().required(),
            adminChargesIndividualOverride: Joi.boolean().required(),
            lopDependent: Joi.boolean().required(),
            enableStatutoryCeiling: Joi.boolean().required(),
            adminChargesEffectiveDate: Joi.date().required(),
            contribution: Joi.object().keys({
                is_fixed: Joi.boolean().default(false),
                fixed_amount: Joi.number().default(0),
                basic: Joi.boolean().default(false),
                percentage: Joi.number().default(0),
                belowCeilingAmount: Joi.object().keys({
                    is_fixed: Joi.boolean().default(false),
                    fixed_amount: Joi.number().default(0),
                    basic: Joi.boolean().default(false),
                    percentage: Joi.number().default(0)
                }),
            }).required(),
        });

        return Joi.validate(params, schema);
    }
}

// exports
module.exports = new AdminChargesValidation();