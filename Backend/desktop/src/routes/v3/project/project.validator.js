'use strict';

const Joi = require('@hapi/joi');
const moment = require('moment');

const Common = require('../../../utils/helpers/CommonFunctions');
class ProjectValidator {

    validateProjectTodo() {
        return Joi.object()
            .keys({
                project_id: Joi.number().integer().required(),
            })
            .required();
    }
    // validateProjectTodoStat() {
    //     return Joi.object().keys({
    //         task_id: Joi.number().required(),
    //         start_time: Joi.string().isoDate().required(),
    //         end_time: Joi.string().isoDate().required().trim().allow(null, ''),
    //         reason: Joi.string().allow(null, '').required().trim(),
    //         type: Joi.string().required().trim().valid('auto', 'manual'),
    //     }).required();
    // }

    validateProjectTodoUpdate() {
        return Joi.object().keys({
            task_id: Joi.number().required(),
            status: Joi.number().required().valid(0, 1, 2, 4),
            updated_at: Joi.date().required(),
        }).required();
    }
    addEmployeeTimeTrack() {
        return Joi.object().keys({
            duration: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            start_time: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            end_time: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
        }).required();
    }

    getEmployeeTimeTrack() {
        return Joi.object().keys({
            from_date: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            to_date: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
        }).required();
    }

    validateAddTask() {
        return Joi.object().keys({
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            name: Joi.string().required().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            description: Joi.string().max(2000).allow(null, "").regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            priority: Joi.number().integer().required(),
            project_id: Joi.number().integer().required(),

        }).required();
    }



    validateProjectTodoStat(data) {

        let scnma = Joi.array().items(Joi.object({
            // start_time: Joi.string().isoDate().required(),
            // end_time: Joi.string().isoDate().required().trim().allow(null, ''),
            start_time: Joi.date().required(),
            end_time: Joi.date().min(Joi.ref('start_time')).allow(null, ''),
            reason: Joi.string().allow(null, '').required().trim().regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            type: Joi.string().required().trim().valid('auto', 'manual').regex(/[<>;]/, { invert: true }).error((err) => { return Common.hapijoiStringErrorMessage(err) }),
            task_id: Joi.number().required(),
        }))
        return scnma.validate(data);

    }

    validateFetchProject() {
        return Joi.object()
            .keys({
                skip: Joi.number().required().default(0),
                limit: Joi.number().required().default(10),
                search: Joi.string().default(null),
                sort: Joi.string().allow("ASC", "DESC").default('ASC'),
            })
            .required();
    }

    validateFetchProjectFolder() {
        return Joi.object()
            .keys({
                skip: Joi.number().required().default(0),
                limit: Joi.number().required().default(10),
                search: Joi.string().default(null),
                project_id: Joi.string().required(),
            })
            .required();
    }

    validateFetchProjectTaskListMobile() {
        return Joi.object()
            .keys({
                skip: Joi.string().default(0),
                limit: Joi.string().default(10),
                search: Joi.string().default(null),
                task_id: Joi.string().default(null),
                manager_id: Joi.string().default(null),
                project_id: Joi.string().default(null),
                folder_name: Joi.string().valid('Current Task', 'Next Task', 'Future Task', 'Finished Task').default(null),
                start_date: Joi.string().default(null),
                end_date: Joi.string().default(null),
                sort_by: Joi.string().valid('ASC', 'DESC').default(null)
            })
            .required();
    }

    validateCreateProjectTask() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                folder_name: Joi.string().valid('Current Task', 'Next Task', 'Future Task', 'Finished Task').required(),
                project_id: Joi.string().required(),
                is_start: Joi.boolean().optional().default(false),
            })
            .required();
    }

    validateUpdateProjectTaskMobile() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                folder_name: Joi.string().valid('Current Task', 'Next Task', 'Future Task', 'Finished Task').default(null),
                project_id: Joi.string().required(),
                task_id: Joi.string().required(),
                is_start: Joi.boolean().optional().default(false),
            })
            .required();
    }

    validateDeleteProject() {
        return Joi.object()
            .keys({
                _id: Joi.string().required(),
            })
            .required();
    }

    validateTaskRemainingTime() {
        return Joi.object()
            .keys({
                remaining_time: Joi.number().required().positive().default(0),
                task_id: Joi.string().required(),
            })
            .required();
    }

}

module.exports = new ProjectValidator;


