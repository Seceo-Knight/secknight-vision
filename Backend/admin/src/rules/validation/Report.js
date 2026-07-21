const Joi = require('joi');

class Report {
    /**   validation for  employee list for report  */
    employee_list_report(skip, limit, department_id, location_id, role_id) {
        const schema = Joi.object().keys({
            skip: Joi.number().integer().default(0).allow(""),
            limit: Joi.number().integer().default(10).allow(""),
            location_id: Joi.number().integer().default(0).allow(""),
            department_id: Joi.number().integer().default(0).allow(""),
            role_id: Joi.number().integer().default(0).allow(""),

        });
        var result = Joi.validate({
            skip,
            limit,
            department_id,
            location_id,
            role_id
        }, schema);
        return result;
    }

    /** validation for download user report  */
    downloadUserReport(user_id, downloadOption, from_date, to_date, from_date_utc, to_date_utc, skip, limit) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            downloadOption: Joi.number().integer().required(),
            from_date: Joi.string().required(),
            to_date: Joi.string().required(),
            from_date_utc: Joi.string().required().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/).required().error(() => 'Invalid from date format.'),
            to_date_utc: Joi.string().required().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/).required().error(() => 'Invalid to date format.'),
            skip: Joi.number().integer().default(0).allow(""),
            limit: Joi.number().integer().default(10).allow(""),
        })
        var result = Joi.validate({ user_id, downloadOption, from_date, to_date, from_date_utc, to_date_utc, skip, limit }, schema);
        return result;
    }

    multipleUserReport(user_id, from_date, to_date, ) {
        const schema = Joi.object().keys({
            user_id: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One User Must Required !'),
            from_date: Joi.date().required().error(() => 'Starting Date Required !'),
            to_date: Joi.date().required().error(() => 'Ending Date Required !'),
        })
        var result = Joi.validate({
            user_id,
            from_date,
            to_date
        }, schema);
        return result;
    }

    autoEmailReportValidation(data) {
        const schema = {
            recipient_email: Joi.string().email().required(),
            website_analytics: Joi.number().required().valid([0, 1]),
            application_analytics: Joi.number().required().valid([0, 1]),
            keystroke: Joi.number().valid([0, 1]),
            browser_history: Joi.number().required().valid([0, 1]),
            user_log: Joi.number().required().valid([0, 1]),
            top_website_analytics: Joi.number().required().valid([0, 1]),
            top_application_analytics: Joi.number().required().valid([0, 1]),
            status: Joi.number().required().valid([0, 1]),
            frequency_type: Joi.number().required().valid([1, 2, 3])
        };
        return Joi.validate(data, schema);
    }

    downloadUserReportMultipleUsers(user_id, downloadOption, from_date, to_date, skip, limit, from_date_utc, to_date_utc) {
        const schema = Joi.object().keys({
            user_id: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One User Must Required !'),
            downloadOption: Joi.number().integer().required(),
            from_date: Joi.string().required(),
            to_date: Joi.string().required(),
            skip: Joi.number().integer().default(0).allow(""),
            limit: Joi.number().integer().default(10).allow(""),
            from_date_utc: Joi.string().required().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/).required().error(() => 'Invalid from date format.'),
            to_date_utc: Joi.string().required().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/).required().error(() => 'Invalid to date format.'),
        })
        var result = Joi.validate({ user_id, downloadOption, from_date, to_date, skip, limit, from_date_utc, to_date_utc }, schema);
        return result;
    }

}
module.exports = new Report;