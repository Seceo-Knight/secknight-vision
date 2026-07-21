import * as joi from "@hapi/joi";

export const validateClickInClickOutSchema = joi.object({
    startDate: joi.string().trim().required().isoDate(),
    endDate: joi.string().trim().required().isoDate(),
}).required();

const sessionEachObjectSchema = joi.object({
    type: joi.number().positive().valid(1, 2).required(),
    mode: joi.number().positive().valid(1, 2).required(),
    startDate: joi.string().trim().required().isoDate(),
    endDate: joi.string().trim().required().isoDate()
});

const sessionArraySchema = joi.array().items(sessionEachObjectSchema).min(1).unique().required();

export const validateTimesheetSchema = joi.object({
    data: joi.alternatives().try(sessionEachObjectSchema, sessionArraySchema).required()
});