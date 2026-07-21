const Joi = require('joi');
const Common = require('../../../../../utils/helpers/Common')

class ReportsValidation {
    emailReport(data) {
        const schema = {
            name: Joi.string().required().max(1000).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            frequency: Joi.number().positive().valid([1, 2, 3, 4, 5, 6, 7, 8, 9]).required(),
            recipients: Joi.array().items(Joi.string().max(250).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiArrayStringErrorMessage(errors);
            })).min(1).required(),
            filter_type: Joi.number().positive().valid([1, 2, 3, 4, 5]).required(),
            user_ids: Joi.array().items(Joi.number().allow(null).allow("")).default([]),
            department_ids: Joi.array().items(Joi.number().allow(null)).default([]),
            location_ids: Joi.array().items(Joi.number().allow(null)).default([]),
            shift_ids: Joi.array().items(Joi.number().allow(null)).default([]),
            content: Joi.object({
                productivity: Joi.number().valid([0, 1]).required(),
                timesheet: Joi.number().valid([0, 1]).required(),
                apps_usage: Joi.number().valid([0, 1]).required(),
                websites_usage: Joi.number().valid([0, 1]).required(),
                keystrokes: Joi.number().valid([0, 1]),
                prodInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                timesheetInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                appsInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                websitesInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                hrms_attendance: Joi.number().valid(0, 1).default(0).required(),
                attendance: Joi.number().valid([0, 1]).default(0).required(),
                manager_log: Joi.number().valid([0, 1]).default(0)
            }).required(),
            report_types: Joi.array().items(Joi.string().valid('csv', 'pdf').required().error(() => 'Please give valid value')),
            custom: Joi.object({
                start: Joi.string(),
                end: Joi.string(),
                date: Joi.string(),
                time: timeSchema
            }).allow(null)
        };
        return Joi.validate(data, schema);
    }
}

module.exports = new ReportsValidation;

const timeSchema = Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, 'undefined');