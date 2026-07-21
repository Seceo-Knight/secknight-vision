const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class TaskValidation {

    createTask(name, employee_id, project_id, module_id, description, start_date, end_date, priority, status) {
        const schema = Joi.object().keys({
            name: Joi.string().required().max(200).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            employee_id: Joi.number().integer().required(),
            project_id: Joi.number().integer().required(),
            module_id: Joi.number().integer().allow(null),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            description: Joi.string().allow(null, "").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            priority: Joi.number().integer().valid(1, 2, 3).required(),
            status: Joi.number().integer().valid(0, 1, 2, 4).required(),
        });
        var result = Joi.validate({ name, employee_id, project_id, module_id, description, start_date, end_date, priority, status }, schema);
        return result;
    }

    getTask(project_id, status, task_id, name) {
        const schema = Joi.object().keys({
            project_id: Joi.number().integer().allow(null),
            status: Joi.number().integer().allow(null),
            task_id: Joi.number().integer().allow(null, ''),
            name: Joi.string().allow(null, ''),
            module_id: Joi.number().integer().allow(null, ''),
        });
        var result = Joi.validate({ project_id, status, task_id, name }, schema);
        return result;
    }

    idValidation(id) {
        const schema = Joi.object().keys({
            id: Joi.array().items(Joi.number().integer().required()).error(err => 'Aleast One Valid Id is Require'),
        });
        var result = Joi.validate({ id }, schema);
        return result;
    }

    updateTask(task_id, name, status, start_date, end_date, employee_id, description, priority) {
        const schema = Joi.object().keys({
            name: Joi.string().allow(null, '').max(200).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            status: Joi.number().integer().valid(0, 1, 2, 4).allow(null),
            task_id: Joi.number().integer().allow(null),
            start_date: Joi.date().allow(null),
            end_date: Joi.date().allow(null),
            employee_id: Joi.number().integer().allow(null, ''),
            priority: Joi.number().integer().valid(1, 2, 3).allow(null, '').error(err => 'Priority Must Be in [1,2,3]'),
            description: Joi.string().allow(null, "").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
        });
        var result = Joi.validate({ task_id, name, status, start_date, end_date, employee_id, description, priority }, schema);
        return result;
    }

    /**
    * get task timesheets
    * @function getTimesheets
    * @memberof TaskValidation
    * @param {number} task_id
    * @returns {Promise<Object>}  value or error 
    */
    getTimesheets({ task_id }) {
        const schema = Joi.object().keys({
            task_id: Joi.number().integer().required(),
        });
        return Joi.validate({ task_id }, schema);
    }

}
module.exports = new TaskValidation;





