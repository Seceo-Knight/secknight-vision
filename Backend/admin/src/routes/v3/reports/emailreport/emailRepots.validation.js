const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common')


class EmailReportsValidation {
    emailReport(data) {
        const schema = {
            name: Joi.string().required().max(1000).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            frequency: Joi.number().positive().required(),
            recipients: Joi.array().items(Joi.string().max(250).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiArrayStringErrorMessage(errors);
            })).min(1).required(),
            filter_type: Joi.number().positive().required(),
            user_ids: Joi.array().items(Joi.number().allow(null).allow("")),
            department_ids: Joi.array().items(Joi.number().allow(null)),
            location_ids: Joi.array().items(Joi.number().allow(null)),
            shift_ids: Joi.array().items(Joi.number().allow(null)),
            content: Joi.object({
                productivity: Joi.number().valid([0, 1]).required(),
                timesheet: Joi.number().valid([0, 1]).required(),
                apps_usage: Joi.number().valid([0, 1]).required(),
                websites_usage: Joi.number().valid([0, 1]).required(),
                keystrokes: Joi.number().valid([0, 1]),
                projects: Joi.number().valid([0, 1]),
                tasks: Joi.number().valid([0, 1]),
                prodInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                timesheetInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                appsInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                websitesInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                hrms_attendance: Joi.number().valid(0, 1).default(0).required(),
                attendance: Joi.number().valid([0, 1]).default(0).required(),
                manager_log: Joi.number().valid([0, 1]).default(0)
            }).required(),
            custom: Joi.object({
                start: Joi.string(),
                end: Joi.string(),
                date: Joi.string(),
                time: timeSchema,
            }).optional().default(null),
            report_types: Joi.array().items(Joi.string().valid('csv', 'pdf').required().error(() => 'Please give valid value'))
        };
        return Joi.validate(data, schema);
    }

    emailReportDelete(data) {
        const schema = {
            email_report_ids: Joi.array().items(Joi.number().required()).min(1).required(),
        };
        return Joi.validate(data, schema);
    }

    editEmailReport(data) {
        const schema = {
            name: Joi.string().max(1000).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            email_report_id: Joi.number().positive().required(),
            frequency: Joi.number().positive(),
            recipients: Joi.array().items(Joi.string().max(250).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiArrayStringErrorMessage(errors);
            })),
            filter_type: Joi.number(),
            add_user_ids: Joi.array().items(Joi.number().allow(null).allow("")),
            del_user_ids: Joi.array().items(Joi.number().allow(null).allow("")),
            add_department_ids: Joi.array().items(Joi.number().allow(null).allow("")),
            del_department_ids: Joi.array().items(Joi.number().allow(null)),
            location_ids: Joi.array().items(Joi.number().allow(null)),
            shift_ids: Joi.array().items(Joi.number().allow(null)),
            content: Joi.object({
                productivity: Joi.number().valid([0, 1]).required(),
                timesheet: Joi.number().valid([0, 1]).required(),
                apps_usage: Joi.number().valid([0, 1]).required(),
                websites_usage: Joi.number().valid([0, 1]).required(),
                keystrokes: Joi.number().valid([0, 1]),
                projects: Joi.number().valid([0, 1]),
                tasks: Joi.number().valid([0, 1]),
                prodInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                timesheetInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                appsInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                websitesInMinutes: Joi.number().valid([0, 1]).default(0).required(),
                hrms_attendance: Joi.number().valid([0, 1]).default(0).required(),
                attendance: Joi.number().valid([0, 1]).default(0).required(),
                manager_log: Joi.number().valid([0, 1]).default(0)
            }).required(),
            custom: Joi.object({
                start: Joi.string(),
                end: Joi.string(),
                date: Joi.string(),
                time: timeSchema,
            }).allow(null),
            report_types: Joi.array().items(Joi.string().valid('csv', 'pdf').required().error(() => 'Please give valid value'))
        };
        return Joi.validate(data, schema);
    }

    getEmailReport(data) {
        const schema = {
            page: Joi.number().positive().default(1),
            limit: Joi.number().default(10),
            name: Joi.string().allow(null, ""),
            sortColumn: Joi.string().allow(null, "").default(null),
            sortOrder: Joi.string().allow(null, "").default(null)
        };
        return Joi.validate(data, schema);
    }
}

module.exports = new EmailReportsValidation;


const timeSchema = Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).allow(null, 'undefined');;