const Joi = require('joi');

const Common = require('../../../../utils/helpers/Common');

class ResellerValidation {
    static update(params) {
        return Joi.validate(params, Joi.object().keys({
            facebook: Joi.string().max(255).default(null).regex(/[<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            instagram: Joi.string().max(255).default(null).regex(/[<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            twitter: Joi.string().max(255).default(null).regex(/[<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            brand_name: Joi.string().required().max(255).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            domain: Joi.string().required().max(255).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            logo: Joi.string().max(255).optional().regex(/[<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            help_link: Joi.string().default(null).max(255).regex(/[<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            copyright_name: Joi.string().default(null).max(255).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            copyright_year: Joi.string().default(null).max(255).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            support_text: Joi.string().default(null).max(255).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            support_mail: Joi.string().max(255).default(null).optional().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            skype_email: Joi.string().max(255).default(null).optional().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            admin_email: Joi.string().max(255).default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            })
        }), { abortEarly: false });
    }

    static amember(params) {
        return Joi.validate(params, Joi.object().keys({
            amember_id: Joi.number().required()
        }), { abortEarly: false });
    }

    static clientRemoveValidation(params) {
        return Joi.validate(params, Joi.object().keys({
            email: Joi.string().max(255).required().regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            })
        }), { abortEarly: false });
    }

    static validateClientEdit(params) {
        return Joi.validate(params, Joi.object().keys({
            client_id: Joi.number().required().error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            expiry_date: Joi.date().optional(),
            total_allowed_user_count: Joi.number().positive().optional(),
            notes: Joi.string().allow([null, '']).default(null),
            reseller_id_client:  Joi.string().default(''),
            reseller_number_client: Joi.string().default(''),
        }));
    }
}

module.exports.ResellerValidation = ResellerValidation;