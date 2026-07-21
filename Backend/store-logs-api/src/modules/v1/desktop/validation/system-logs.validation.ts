import * as joi from "@hapi/joi";

const eventObjectSchema = joi.object({
    title: joi.string().required().trim(),
    type: joi.string().allow(null, '').optional(),
    description: joi.string().allow(null, '').optional(),
    start: joi.number().integer().positive().allow(0).required(),
    end: joi.number().integer().positive().allow(0).required(),
}).required();
const eventArraySchema = joi.array().items(eventObjectSchema).min(1).unique().required();


export const validateSystemLogsSchema = joi.object({
    dataId: joi.string().required().trim().isoDate(),
    device: {
        name: joi.string().required().trim(),
        start: joi.number().integer().positive().allow(0).required(),
        end: joi.number().integer().positive().allow(0).required(),
    },
    events: joi.alternatives().try(eventObjectSchema, eventArraySchema).required()
}).required();


const eventsObjectSchema = joi.object({
    dataId: joi.string().required().trim().isoDate(),
    title: joi.string().required().trim(),
    type: joi.string().allow(null, '').optional(),
    description: joi.string().allow(null, '').optional(),
}).required();
const eventsArraySchema = joi.array().items(eventsObjectSchema).min(1).required();

export const validateSystemLogDatasSchema = joi.object({
    events: joi.alternatives().try(eventsObjectSchema, eventsArraySchema).required()
}).required();