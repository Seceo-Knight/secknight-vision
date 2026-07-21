const Joi = require('joi');
const HapiJoi = require('@hapi/joi');
const Common = require('../../../../utils/helpers/Common');
const moment = require('moment');

class ProjectValidation {

    addProject(name, user_ids, organization_id, start_date, end_date, description, manager_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required().max(225).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            user_ids: Joi.array().items(Joi.number().integer().required()).error(err => 'Aleast One Valid User Id is Require'),
            organization_id: Joi.number().integer().required(),
            manager_id: Joi.number().integer().allow(null),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            description: Joi.string().allow(null, "").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
        });
        var result = Joi.validate({ name, user_ids, organization_id, start_date, end_date, description, manager_id }, schema);
        return result;
    }

    getProject(project_id, organization_id, status) {
        const schema = Joi.object().keys({
            organization_id: Joi.number().integer().required(),
            project_id: Joi.number().integer().allow(null),
            status: Joi.number().integer().allow(null),
        });
        var result = Joi.validate({ project_id, organization_id, status }, schema);
        return result;
    }

    idValidation(project_id) {
        const schema = Joi.object().keys({
            project_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ project_id }, schema);
        return result;
    }

    idsValidation(id) {
        const schema = Joi.object().keys({
            id: Joi.array().items(Joi.number().integer().required()).error(err => 'Aleast One Valid  Id is Require'),
        });
        var result = Joi.validate({ id }, schema);
        return result;
    }

    addProjectModule(name, project_id, created_by, start_date, end_date, description) {
        const schema = Joi.object().keys({
            name: Joi.string().required().max(200).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            created_by: Joi.number().integer().required(),
            project_id: Joi.number().integer().required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),
            description: Joi.string().allow(null, "").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),

        });
        var result = Joi.validate({ name, project_id, created_by, start_date, end_date, description }, schema);
        return result;
    }

    getProjectModule(project_id, module_id, status, sortColumn, sortOrder, searchValue, skip, limit) {
        const schema = Joi.object().keys({
            status: Joi.number().integer().allow(null),
            module_id: Joi.number().integer().allow(null),
            project_id: Joi.number().integer().required(),
            sortColumn: Joi.string().optional().default(null),
            sortOrder: Joi.string().optional().default(null).valid('A', 'D'),
            searchValue: Joi.string().optional().default(null),
            skip: Joi.number().optional().default(0),
            limit: Joi.number().optional().default(10),
        });

        var result = Joi.validate({ project_id, module_id, status, sortColumn, sortOrder, searchValue, skip, limit }, schema);
        return result;
    }


    updateProjectModule(module_id, name, status, start_date, end_date) {
        const schema = Joi.object().keys({
            name: Joi.string().allow(null).max(200).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            status: Joi.number().integer().allow(null),
            module_id: Joi.number().integer().required(),
            start_date: Joi.date().allow(null),
            end_date: Joi.date().allow(null),
        });
        var result = Joi.validate({ module_id, name, status, start_date, end_date }, schema);
        return result;
    }

    UpdateProject(project_id, name, status, start_date, end_date, description, progress, user_ids) {
        const schema = Joi.object().keys({
            name: Joi.string().allow(null).max(225).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            start_date: Joi.date().allow(null),
            end_date: Joi.date().allow(null),
            description: Joi.string().allow(null, "").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            status: Joi.number().integer().allow(null),
            project_id: Joi.number().integer().required(),
            progress: Joi.number().integer().min(0).max(100).allow(null).error(err => 'Progress Must In Between 0 TO 100%'),
            user_ids: Joi.array().items(Joi.number().integer()).error(err => 'User Id Must Be Number.'),
        });
        var result = Joi.validate({ project_id, name, status, start_date, end_date, description, progress, user_ids }, schema);
        return result;
    }

    addEmployeesToProject(project_id, Employee_ids) {
        const schema = Joi.object().keys({
            Employee_ids: Joi.array().items(Joi.number().integer().required()).error(err => 'Aleast One Valid Employee Id is Require'),
            project_id: Joi.number().integer().required()
        });
        var result = Joi.validate({ project_id, Employee_ids }, schema);
        return result;
    }

    projects() {
        return HapiJoi.object().keys({
            project_id: HapiJoi.number().positive().optional().default(null),
            status: HapiJoi.number().optional().default(null),
            sortColumn: HapiJoi.string().optional().default(null),
            sortOrder: HapiJoi.string().optional().default(null).valid('A', 'D'),
            searchValue: HapiJoi.string().optional().default(null),
            skip: HapiJoi.number().optional().default(0),
            limit: HapiJoi.number().optional().default(50000)
        }).required().optional();
    }

    projectWebApps() {
        return HapiJoi.object().keys({
            project_id: HapiJoi.number().positive().required(),
            skip: HapiJoi.number().required().default(0),
            limit: HapiJoi.number().required().default(20),
            status: HapiJoi.number().positive().valid(1, 2, 3, 4, 5).default(5),
            type: HapiJoi.string().valid("APP", "WEB", "ALL").default("ALL"),
            sortBy: HapiJoi.string().valid("app", "duration").default("duration"),
            order: HapiJoi.string().valid("A", "D").default("D"),
            search: HapiJoi.string().allow("", null).default(null)
        }).required();
    }

    createProject({ name, user_ids, start_date, end_date,
        description, module_name, module_start_date, module_end_date,
        task_name, task_user_id, module, task_description, task_start_date, task_end_date, priority, status
    }) {
        const today = moment().format("YYYY-MM-DD")
        const schema = Joi.object().keys({
            name: Joi.string().required().max(225).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            user_ids: Joi.array().items(Joi.number().integer().required()).error(err => 'Aleast One Valid User Id is Require'),
            start_date: Joi.date().min(today).required(),

            end_date: Joi.date().required().min(Joi.ref('start_date')).error(er => "project end date is must be valid date and it should greater than start date"),

            description: Joi.string().allow(null, "").regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),

            module_name: Joi.string().allow(null, "").max(225).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),

            module_start_date: Joi.date().when('module_name', {
                is: Joi.exist(),
                then: Joi.date().min(Joi.ref('start_date')).max(Joi.ref('end_date')).required().error(err => "Module start date must be a valid date and it should be in project duration")
            }),

            module_end_date: Joi.date().when('module_name', {
                is: Joi.exist(),
                then: Joi.date().min(Joi.ref('module_start_date')).max(Joi.ref('end_date')).required()
                    .error(err => "Module end date must be a valid date,greater than module start date and it should be in project duration")
            }),

            /**task details */
            task_name: Joi.string().allow(null, "").max(200).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),

            task_user_id: Joi.number().when('task_name', {
                is: Joi.exist(),
                then: Joi.number().required()
            }),

            module: Joi.number().integer().when('task_name', {
                is: Joi.exist(),
                then: Joi.number().required()
            }),

            task_start_date: Joi.date().when('task_name', {
                is: Joi.exist(),
                then: Joi.date().required()
            }),

            task_end_date: Joi.date().when('task_name', {
                is: Joi.exist(),
                then: Joi.date().required().min(Joi.ref('task_start_date')).error(er => "Task end date is must be valid date and it should greater than or equal to task start date"),
            }),
            task_description: Joi.string().allow(null, "").default(null).regex(/[$\(\)<>]/, { invert: true }).error((errors) => {
                return Common.joiErrorMessage(errors)
            }),
            priority: Joi.number().integer().valid(1, 2, 3).when('task_name', {
                is: Joi.exist(),
                then: Joi.number().required()
            }),
            status: Joi.number().integer().valid(0, 1, 2, 4).when('task_name', {
                is: Joi.exist(),
                then: Joi.number().required()
            }),

        });
        return Joi.validate({
            name, user_ids, start_date, end_date, description, module_name,
            module_start_date, module_end_date, task_name, task_user_id, module,
            task_description, task_start_date, task_end_date, priority, status
        }, schema);

    }

    getGroupsEmployeesAllProjects({ group_ids, employee_ids }) {
        const schema = Joi.object().keys({
            employee_ids: Joi.array().items(Joi.number().integer()).min(1).allow(null),
            group_ids: Joi.array().items(Joi.number().integer()).min(1).allow(null),
        }).without('employee_ids', ['group_ids']).error(err => 'Send either employee ids or group ids');

        return Joi.validate({ group_ids, employee_ids }, schema);
    }

    addBulkTasks(task_data) {
        const schema = Joi.array().items(
            Joi.object().keys({
                ProjectName: Joi.string().required(),
                ModuleName: Joi.string().optional().default(null),
                StartDate: Joi.optional(),
                EndDate: Joi.optional(),
                TaskName: Joi.string().required(),
                taskStartDate: Joi.required(),
                taskEndDate: Joi.required(),
                email: Joi.string().email().default(null),
            })
        );

        return Joi.validate(task_data, schema);
    }

    getProjectTasksData({ projectId, projectStatus, taskStartDate, taskEndDate, taskStatus }) {

        const schema = Joi.object().keys({
            projectId: Joi.array().items(Joi.number().integer()).required(),
            projectStatus: Joi.number().positive().optional().valid(0, 1, 2),
            taskStartDate: Joi.string().optional().default(null),
            taskEndDate: Joi.string().optional().default(null),
            taskStatus: Joi.number().optional().default(1).valid(0, 1, 2)
        }).error(err => 'Send either employee ids or group ids');;


        return Joi.validate({ projectId, projectStatus, taskStartDate, taskEndDate, taskStatus }, schema);
    }
}
module.exports = new ProjectValidation;
