'use strict';
const Joi = require('@hapi/joi');

class ClockInValidator {

    sessionEachObjectSchema = Joi.object({
        type: Joi.number().positive().valid(1, 2).required(),
        mode: Joi.number().positive().valid(1, 2).required(),
        startDate: Joi.string().trim().required().isoDate(),
        endDate: Joi.string().trim().required().isoDate().allow(null, ''),
        reason: Joi.string().trim().required().allow(null, '')
    });
    sessionArraySchema = Joi.array().items(this.sessionEachObjectSchema).min(1).unique().required();


    validateClockInParams() {
        return Joi.object({
            data: Joi.alternatives().try(this.sessionEachObjectSchema, this.sessionArraySchema).required()
        });
    }

    validateDetailedClockInParams() {
        return Joi.object({
            startDate: Joi.string().trim().required().isoDate(),
            endDate: Joi.string().trim().required().isoDate(),
        }).required();
    }
}

module.exports = new ClockInValidator;