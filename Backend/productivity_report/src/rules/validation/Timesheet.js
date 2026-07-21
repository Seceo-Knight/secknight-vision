const Joi = require('joi');

class Timesheet {

    createTimesheet(project_id, user_id, todo_id, note, reason, start_time, end_time, module_id) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            reason: Joi.string().required(),
            note: Joi.string().required(),
            start_time: Joi.date().required(),
            end_time: Joi.date().required(),
            project_id: Joi.number().integer().required(),
            todo_id: Joi.number().integer().required(),
            module_id: Joi.number().integer().allow(null),
        });
        var result = Joi.validate({ project_id, user_id, todo_id, note, reason, start_time, end_time, module_id }, schema);
        return result;
    }

    idValidation(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer(),
        });
        var result = Joi.validate({ id }, schema);
        return result;
    }

    idValidate(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ id }, schema);
        return result;
    }

    deleteTimesheet(timesheet_ids) {
        const schema = Joi.object().keys({
            timesheet_ids: Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid Timesheet id is required'),
        });
        var result = Joi.validate({ timesheet_ids }, schema);
        return result;
    }


    updateTimesheet(project_id, user_id, todo_id, note, reason, start_time, end_time, timesheet_id) {

        const schema = Joi.object().keys({
            user_id: Joi.number().integer().allow(""),
            timesheet_id: Joi.number().integer().required(),
            reason: Joi.string().allow(""),
            note: Joi.string().allow(""),
            start_time: Joi.date().allow(""),
            end_time: Joi.date().allow(""),
            project_id: Joi.number().integer().allow(""),
            todo_id: Joi.number().integer().allow(""),
        });
        var result = Joi.validate({ project_id, user_id, todo_id, note, reason, start_time, end_time, timesheet_id }, schema);
        return result;
    }


    getTimesheet(user_id, timesheet_id,from_date,to_date,project_id) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().allow(null),
            timesheet_id: Joi.number().integer().allow(null),
            from_date:Joi.date().allow(null),
            to_date:Joi.date().allow(null),
            project_id: Joi.number().integer().allow(null), 
        });
        var result = Joi.validate({ user_id, timesheet_id ,from_date,to_date,project_id}, schema);
        return result;
    }
}
module.exports = new Timesheet;
