import * as joi from "@hapi/joi";
import { EActivityDataMode } from "src/common/enums/activity-data.enum";

const appObjectSchema = joi.object({
    ageOfData: joi.number().integer().valid(-1).optional(),
    app: joi.string().allow(null, '').optional(),
    start: joi.number().integer().positive().allow(0),
    end: joi.number().integer().positive().allow(0),
    title: joi.string().required().trim().allow(null, ''),
    url: joi.string().uri().allow(null, '').required().trim(),
    keystrokes: joi.string().allow(null, '').required().trim(),
}).required();
const appArraySchema = joi.array().items(appObjectSchema).min(1).unique().required();


const sessionEachObjectSchema = joi.object({
    dataId: joi.string().required().trim().isoDate(),
    systemTimeUtc: joi.string().required().trim().isoDate(),

    projectId: joi.number().integer().allow(0).required(),
    taskId: joi.number().integer().allow(0).required(),
    breakInSeconds: joi.number().integer().positive().allow(0).required(),

    clicksCount: joi.number().integer().positive().allow(0),
    fakeActivitiesCount: joi.number().integer().positive().allow(0),
    keysCount: joi.number().integer().positive().allow(0),
    movementsCount: joi.number().integer().positive().allow(0),

    taskNote: joi.string().required().trim().allow(''),

    activityPerSecond: {
        buttonClicks: joi.array().items(joi.number().required()).max(400),
        fakeActivities: joi.array().items(joi.number().required()).max(400),
        keystrokes: joi.array().items(joi.number().required()).max(400),
        mouseMovements: joi.array().items(joi.number().required()).max(400),
    },

    mode: {
        name: joi.string().required().trim().valid(EActivityDataMode.computer, EActivityDataMode.remote),
        start: joi.number().integer().positive().allow(0),
        end: joi.number().integer().positive().allow(0),
    },
    appUsage: joi.alternatives().try(appObjectSchema, appArraySchema).required()
});
const sessionArraySchema = joi.array().items(sessionEachObjectSchema).min(1).unique().required();


export const validateActivityDataSchema = joi.object({
    sign: joi.string().trim().required(),
    data: joi.alternatives().try(sessionEachObjectSchema, sessionArraySchema).required(),
}).required();