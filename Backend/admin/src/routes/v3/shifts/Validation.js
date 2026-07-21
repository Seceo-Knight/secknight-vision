const Joi = require('./Validator');
const Common = require('../../../utils/helpers/Common');

class Validation {
    static create(params) {
        const schema = Joi.object().keys({
            name: Joi.string().required().max(250).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            data: Joi.JSON().shiftData().required(),
            location_id: Joi.number().integer(),
            notes: Joi.string().max(2000).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }).default(""),
            late_period: Joi.number().positive().allow(0).default(0),
            early_login_logout_time: Joi.number().positive().allow(0).default(0),
            half_day_hours: Joi.string().default('00:00'),
            overtime_period: Joi.string().default('00:00'),
            productivity_halfday: Joi.string().default('00:00'),
            productivity_present: Joi.string().default('00:00'),
            color_code: Joi.number().integer().valid([1, 2, 3, 4, 5, 6]).required(),
        });
        return Joi.validate(params, schema);
    }

    static update(params) {
        const schema = Joi.object().keys({
            id: Joi.required().default(0),
            name: Joi.string().default(undefined).max(250).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            data: Joi.JSON().shiftData().default(undefined),
            location_id: Joi.number().integer(),
            notes: Joi.string().max(2000).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            late_period: Joi.number().positive().allow(0),
            early_login_logout_time: Joi.number().positive().allow(0),
            half_day_hours: Joi.string(),
            overtime_period: Joi.string(),
            productivity_halfday: Joi.string(),
            productivity_present: Joi.string(),
            color_code: Joi.number().integer().valid([1, 2, 3, 4, 5, 6]).allow("", null),
        });
        return Joi.validate(params, schema);
    }

    static get(params) {
        const schema = Joi.object().keys({
            id: Joi.required().default(0),
        });
        return Joi.validate(params, schema);
    }

    static delete(params) {
        const schema = Joi.object().keys({
            id: Joi.required().default(0),
        });
        return Joi.validate(params, schema);
    }

    static findBy(params) {
        const schema = Joi.object().keys({
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(100),
            name: Joi.string().default(undefined),
            created_by: Joi.number().integer().default(undefined),
            updated_by: Joi.number().integer().default(undefined),
            location_id: Joi.number().integer(),
        });
        return Joi.validate(params, schema);
    }
}

module.exports.Validation = Validation;
