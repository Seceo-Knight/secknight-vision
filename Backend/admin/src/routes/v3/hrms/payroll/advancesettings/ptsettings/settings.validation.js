const Joi = require('joi');

class SettingsValidation {
    static create(params) {
        const schema = Joi.object().keys({
            effective_date: Joi.string(),
            locations: Joi.array().items(Joi.object().keys({
                location_id: Joi.number().positive().required(),
                details: Joi.array().items(Joi.object().keys({
                    start: Joi.number().required(),
                    end: Joi.number().required(),
                    amount: Joi.number().required()
                }))
            })).default([]),
        });
        return Joi.validate(params, schema);
    }
    static update(params) {
        return Joi.validate(params, Joi.object().keys({
            ptAllowed: Joi.boolean().required(),
            ptStateOverride: Joi.boolean().required(),
            ptEffectiveDate: Joi.date().required(),
            allStates: Joi.boolean().required(),
        }))
    }

    static deletePTLocation(params) {
        return Joi.validate(params, Joi.object().keys({
            locations: Joi.array().items(Joi.number().positive()).min(1)
        }))
    }

    static getOverview(params) {
        return Joi.validate(params, Joi.object().keys({
            skip: Joi.number().integer().default(0),
            limit: Joi.number().integer().default(20),
            employee_id: Joi.number().integer().optional(),
            search: Joi.string().default(null),
            sort: Joi.string().valid("employee", "location").default("employee"),
            order: Joi.string().valid("A", "D").default("D"),
        }))
    }

    static updateOverview(params) {
        return Joi.validate(params, Joi.object().keys({
            ptEffectiveDate: Joi.date().required(),
            location_id: Joi.number().integer().allow(null).required(),
            employee_id: Joi.number().integer().required(),
            ptAllowed: Joi.boolean().required(),
        }))
    }

    static getPT(params) {
        return Joi.validate(params, Joi.object().keys({
            location_id: Joi.number().integer().allow(null).required(),
        }))
    }
}

module.exports.SettingsValidation = SettingsValidation;