const Joi = require('joi');

class Todos {
    createTodo(name, description, project_id, start_date, end_date, status, progress, assigned_user_id, project_list_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            assigned_user_id: Joi.number().integer().required(),
            description: Joi.string().allow(""),
            start_date: Joi.date().allow(""),
            end_date: Joi.date().allow(""),
            project_id: Joi.number().integer().required(),
            status: Joi.number().integer().required(),
            progress: Joi.number().integer().required(),
            project_list_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ name, description, project_id, start_date, end_date, status, progress, assigned_user_id, project_list_id }, schema);
        return result;
    }

    idValidation(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ id }, schema);
        return result;
    }

    fetchTodo(todo_id, project_id, project_list_id, user_id,status) {
        const schema = Joi.object().keys({
            todo_id: Joi.number().integer().allow(""),
            project_id: Joi.number().integer().allow(""),
            project_list_id: Joi.number().integer().allow(""),
            user_id: Joi.number().integer().allow(""),
            status: Joi.number().integer().allow(""),
        });
        var result = Joi.validate({ todo_id, project_id, project_list_id, user_id,status }, schema);
        return result;
    }

    updateTodo(name,description,project_id, start_date, end_date,status,progress, assigned_user_id,todo_id) {
        const schema = Joi.object().keys({

            name: Joi.string().allow(""),
            assigned_user_id: Joi.number().integer().allow(null),
            description: Joi.string().allow(""),
            start_date: Joi.date().allow(""),
            end_date: Joi.date().allow(""),
            project_id: Joi.number().integer().allow(null),
            status: Joi.number().integer().allow(null),
            progress:Joi.number().integer().allow(null),
            todo_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ name,description,project_id, start_date, end_date,status,progress, assigned_user_id,todo_id }, schema);
        return result;
    }


}
module.exports = new Todos;
