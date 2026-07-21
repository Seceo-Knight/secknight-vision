'use strict';

const Joi = require('@hapi/joi');
// const Common = require('../../../../utils/helpers/Common')
const Common = require('../../../../utils/helpers/Common');


class AdminDashboardValidation {
    static validateCreateProject() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                description: Joi.string().required().trim().max(200),
                assigned_non_admin_users: Joi.array().items(Joi.number()).default(null),
                assigned_users: Joi.array().items(Joi.number()).default(null),
                start_date: Joi.date().required(),
                end_date: Joi.date().required().greater(Joi.ref('start_date')),
            })
            .required();
    }

    static validateUpdateProject() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                description: Joi.string().required().trim().max(200),
                _id: Joi.string().required(),
                assigned_non_admin_users: Joi.array().items(Joi.number()).default(null),
                assigned_users: Joi.array().items(Joi.number()).default(null),
                start_date: Joi.date().required(),
                end_date: Joi.date().required().greater(Joi.ref('start_date')),
            })
            .required();
    }

    static validateDeleteProject() {
        return Joi.object()
            .keys({
                _id: Joi.string().required(),
            })
            .required();
    }
    static validateDeleteMultipleProjectTask() {
        return Joi.object({
            _ids: Joi.array().items(Joi.string().required()).required()
        }).required();
    }

    static validateProjectId() {
        return Joi.object()
            .keys({
                project_id: Joi.string().required(),
            })
            .required();
    }

    static validateFetchProject() {
        return Joi.object()
            .keys({
                skip: Joi.number().required().default(0),
                limit: Joi.number().required().default(10),
                search: Joi.string().default(null),
                sort: Joi.string().allow("ASC", "DESC").default('ASC'),
            })
            .required();
    }

    static validateFetchProjectEmployee() {
        return Joi.object()
            .keys({
                search: Joi.string().default(null),
                sort: Joi.string().allow("ASC", "DESC").default('ASC'),
                employee_id: Joi.number().required(),
            })
            .required();
    }


    static validateFetchProjectFolder() {
        return Joi.object()
            .keys({
                skip: Joi.number().required().default(0),
                limit: Joi.number().required().default(10),
                search: Joi.string().default(null),
                project_id: Joi.string().required(),
            })
            .required();
    }

    static validateAssignEmployeeProject() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().required(),
                _id: Joi.string().required(),
            })
            .required();
    }

    static validateCreateProjectFolder() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                project_id: Joi.string().required(),
            })
            .required();
    }

    static validateUpdateProjectFolder() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                project_id: Joi.string().required(),
                _id: Joi.string().required(),
            })
            .required();
    }

    static validateCreateProjectTask() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                folder_name: Joi.string().valid('Current Task', 'Next Task', 'Future Task', 'Finished Task').default(null),
                project_id: Joi.string().required(),
                is_start: Joi.boolean().required()
            })
            .required();
    }

    static validateCreateProjectTaskDashboard() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                folder_id: Joi.string().required().trim().max(200),
                project_id: Joi.string().required(),
                employee_id: Joi.string().required(),
            })
            .required();
    }

    static validateBulkCreateProject() {
        return Joi.array().items(
            Joi.object().keys({
                'Client Name': Joi.string().required().trim().max(50),
                'Manager Name': Joi.string().required().trim(),
                'Employee Name': Joi.string().required().trim(),
                'Start Date': Joi.date().required(),
                'End Date': Joi.date().required().greater(Joi.ref('Start Date')),
                'Description': Joi.string().allow('').trim().max(200)
            })
        ).min(1).required();
    }
    
    static validateUpdateProjectTask() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                folder_id: Joi.string().required().trim().max(200),
                project_id: Joi.string().required(),
                task_id: Joi.string().required(),
            })
            .required();
    }

    static validateUpdateProjectTaskMobile() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                folder_name: Joi.string().valid('Current Task', 'Next Task', 'Future Task', 'Finished Task').default(null),
                project_id: Joi.string().required(),
                task_id: Joi.string().required(),
                is_start: Joi.boolean().required(),
            })
            .required();
    }

    static validateFetchProjectTask() {
        return Joi.object()
            .keys({
                skip: Joi.number().required().default(0),
                limit: Joi.number().required().default(10),
                search: Joi.string().default(null),
                project_id: Joi.string().required(),
                folder_id: Joi.string().required(),
                assigned_non_admin_users: Joi.number().default(0), 
                assigned_users: Joi.number().default(0)
            })
            .required();
    }

    static validateFetchProjectTaskList() {
        return Joi.object()
            .keys({
                skip: Joi.string().default(0),
                limit: Joi.string().default(10),
                search: Joi.string().default(null), 
                employee_id: Joi.string().default(null), 
                task_id: Joi.string().default(null), 
                manager_id: Joi.string().default(null), 
                project_id: Joi.string().default(null), 
                folder_id: Joi.string().default(null), 
                start_date: Joi.string().default(null),
                end_date: Joi.string().default(null),
                sortColumn: Joi.string().default(null),
                sortOrder: Joi.string().default(null)
            })
            .required();
    }

    static validateFetchProjectTaskListMultipleEmployees() {
        return Joi.object()
            .keys({
                skip: Joi.string().default(0),
                limit: Joi.string().default(10),
                search: Joi.string().default(null), 
                employee_id: Joi.string().default(null), 
                task_id: Joi.string().default(null), 
                manager_id: Joi.string().default(null), 
                project_id: Joi.string().default(null), 
                folder_id: Joi.string().default(null), 
                start_date: Joi.string().default(null),
                end_date: Joi.string().default(null),
                sortColumn: Joi.string().default(null),
                sortOrder: Joi.string().default(null),
                employee_ids: Joi.string().default(null),
            })
            .required();
    }

    static validateFetchProjectTaskListMultipleEmployees() {
        return Joi.object()
            .keys({
                skip: Joi.string().default(0),
                limit: Joi.string().default(10),
                search: Joi.string().default(null), 
                employee_id: Joi.string().default(null), 
                task_id: Joi.string().default(null), 
                manager_id: Joi.string().default(null), 
                project_id: Joi.string().default(null), 
                folder_id: Joi.string().default(null), 
                start_date: Joi.string().default(null),
                end_date: Joi.string().default(null),
                sortColumn: Joi.string().default(null),
                sortOrder: Joi.string().default(null),
                employee_ids: Joi.string().default(null),
            })
            .required();
    }

    static validateFetchProjectTaskListMobile() {
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

    static validateAssignEmployeeTask() {
        return Joi.object()
            .keys({
                employee_id: Joi.number().required(),
                task_id: Joi.string().required(),
            })
            .required();
    }

    static validateFetchAssignEmployeeTask() {
        return Joi.object()
            .keys({
                task_id: Joi.string().required(),
            })
            .required();
    }

    static validateTaskRemainingTime() {
        return Joi.object()
            .keys({
                remaining_time: Joi.number().required().allow(0).positive().default(0),
                task_id: Joi.string().required(),
            })
            .required();
    }

    static validateGetAssignedUserList() {
        return Joi.object()
            .keys({
                skip: Joi.number().required().default(0),
                limit: Joi.number().required().default(10),
                search: Joi.string().default(null),
            })
            .required();
    }



    static validateFetchProject() {
        return Joi.object()
            .keys({
                skip: Joi.number().required().default(0),
                limit: Joi.number().required().default(10),
                search: Joi.string().default(null),
                sort: Joi.string().allow("ASC", "DESC").default('ASC'),
            })
            .required();
    }

    static validateFetchProjectFolder() {
        return Joi.object()
            .keys({
                skip: Joi.number().required().default(0),
                limit: Joi.number().required().default(10),
                search: Joi.string().default(null),
                project_id: Joi.string().required(),
            })
            .required();
    }

    static validateFetchProjectTaskListMobile() {
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

    static validateCreateProjectTaskNew() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                folder_name: Joi.string().valid('Current Task', 'Next Task', 'Future Task', 'Finished Task').required(),
                project_id: Joi.string().required(),
                is_start: Joi.boolean().optional().default(false),
                description: Joi.string().trim().max(500),
            })
            .required();
    }

    static validateUpdateProjectTaskMobileNew() {
        return Joi.object()
            .keys({
                title: Joi.string().required().trim().max(50),
                folder_name: Joi.string().valid('Current Task', 'Next Task', 'Future Task', 'Finished Task').default(null),
                project_id: Joi.string().required(),
                task_id: Joi.string().required(),
                is_start: Joi.boolean().optional().default(false),
                description: Joi.string().trim().max(500),
            })
            .required();
    }

    static validateDeleteProject() {
        return Joi.object()
            .keys({
                _id: Joi.string().required(),
            })
            .required();
    }

    static validateTaskRemainingTime() {
        return Joi.object()
            .keys({
                remaining_time: Joi.number().required().positive().default(0),
                task_id: Joi.string().required(),
            })
            .required();
    }

    static validateBulkCreateProjectTask() {
        return Joi.array().items(
            Joi.object().keys({
                'Title': Joi.string().required().trim().max(50),
                'Client Name': Joi.string().required().trim(),
                'Folder Name': Joi.string().required().trim(),
                'Employee Name': Joi.string().required().trim(),
            })
        ).min(1).required();
    }

}

module.exports = AdminDashboardValidation;