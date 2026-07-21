const Joi = require('joi');

const Common = require('../../../../utils/helpers/Common');

class ResellerValidation {
    static validateClientRegister(params) {
        const schema = Joi.object().keys({
            first_name: Joi.string().max(64).required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            last_name: Joi.string().max(64).required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            email: Joi.string().required().max(128).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            username: Joi.string().trim().max(50).regex(/[$\(\)<>]/, { invert: true }).error((err) => { 
                return Common.joiErrorMessage(err) 
            }),
            password: Joi.string().max(512).required().regex(/^(?=.*\d)(?=.*[!-\/:-@\[-`{-~]).{8,}$/).error(() => 'The password must contain at least one special character and at least one number and a minimum of 8 characters.'),
            address: Joi.string().allow(null).allow("").max(512).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            contact_number: Joi.string().max(15).allow(null).allow("").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            date_join: Joi.date().allow(null),
            timezone: Joi.string().required().max(40).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            expiry_date: Joi.date().required(),
            total_allowed_user_count: Joi.number().positive().required(),
            notes: Joi.string().max(255).optional().default(''),
            reseller_id_client: Joi.string().max(100).optional().default(''),
            reseller_number_client: Joi.string().max(100).optional().default(''),
        });
        return Joi.validate(params, schema);
    }

    /**
     * validateClientAuthParams - function to validate the client auth
     * @param {*} params 
     * @returns 
     */
    static validateClientAuthParams(params) {
        const schema = Joi.object().keys({
            username: Joi.string().trim().max(50).regex(/[$\(\)<>]/, { invert: true }).error((err) => { 
                return Common.joiErrorMessage(err) 
            }),
            password: Joi.string().max(512).required().regex(/^(?=.*\d)(?=.*[!-\/:-@\[-`{-~]).{8,}$/).error(() => 'The password must contain at least one special character and at least one number and a minimum of 8 characters.'),
            expiryDays: Joi.string().default(null).optional()
        });
        return Joi.validate(params, schema);
    }

    static clientAuthReseller(params) {
        const schema = Joi.object().keys({
            organization_id: Joi.number().positive().required(),
        });
        return Joi.validate(params, schema);
    }
}

module.exports.ResellerValidation = ResellerValidation;