"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const moment = require('moment');
const _ = require('underscore');



const JoiValidation = require('../../../rules/validation/Todos');
const TodosCURD = require('../../shared/TodosCURD')
const sendResponse = require('../../../utils/myService').sendResponse;
const Logger = require('../../../Logger').logger;
const ProjectCURD = require('../../shared/ProjectCURD');


class Todos {

    async createTodos(req, res) {
        let date = moment().format("YYYY-MM-DD");
        let admin_id = req['decoded'].jsonData.admin_id;
        let project_list_id = req.body.module_id;
        let name = req.body.name;
        let description = req.body.description || null;
        let project_id = req.body.project_id;
        let start_date = moment(req.body.start_date).format('YYYY-MM-DD');
        let end_date = moment(req.body.end_date).format('YYYY-MM-DD');
        let status = req.body.status;
        let progress = req.body.progress;
        let assigned_user_id = req.body.assigned_user_id;
        let validate = JoiValidation.createTodo(name, description, project_id, start_date, end_date, status, progress, assigned_user_id, project_list_id);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        try {
            let check_todo = await TodosCURD.getTodosByName(name, project_id, project_list_id);
            if (check_todo.length > 0) return sendResponse(res, 404, null, 'Todo is Already Exists', null);
            let project_details = await ProjectCURD.getProjectModule(project_list_id, true, 1, false, false, 1, admin_id, 1, false);
            if (project_details.length > 0) {
                if (req.body.start_date && req.body.end_date) {
                    let project_start_date = moment(project_details[0].start_date).format('YYYY-MM-DD');
                    let project_end_date = moment(project_details[0].end_date).format('YYYY-MM-DD');
                    let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
                    let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
                    let is_before = moment(start_date).isSameOrBefore(end_date);
                    if (!is_start_date || !is_end_date) {
                        return sendResponse(res, 400, null, 'Todo Start Date and End Date With In The Project Module  Duration.', null);
                    }
                    else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                        return sendResponse(res, 400, null, 'Please Select Valid  Start Date And End Date', null);
                    }
                }
            }
            let insert_todo = await TodosCURD.createTodo(name, description, project_id, start_date, end_date, status, progress, project_list_id)

            if (!insert_todo) {
                return sendResponse(res, 400, null, 'Faled To Create Todo', null);
            } else if (insert_todo.affectedRows > 0) {

                const assign_user = await TodosCURD.assignTodoToUser(insert_todo.insertId, assigned_user_id);
                if (!assign_user) {
                    return sendResponse(res, 400, null, 'Unable To Assign Todo To User. ', null);
                } else if (assign_user.affectedRows > 0) {
                    const get_todo = await getTodoData(insert_todo.insertId, true, 1, false, 1, false, admin_id, 1, false, 1, false)
                    return sendResponse(res, 200, get_todo, 'Successfully Created Todo ', null);
                }

            }
            return sendResponse(res, 400, null, 'Faled To Create Todo', null);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Faled To Create Todo', null);
        }

    }


    async fetchTodo(req, res) {
        let is_todo = req.body.todo_id ? true : false;
        let todo_id = req.body.todo_id || null;
        let project_id = req.body.project_id || null;
        let is_project = req.body.project_id ? true : false;
        let project_list_id = req.body.module_id || null;
        let manager_id = req['decoded'].jsonData.is_manager ? req['decoded'].jsonData.id : null;
        let is_manager = req['decoded'].jsonData.is_manager;
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_id = req.body.user_id || null;
        let is_user = req.body.user_id ? true : false;
        let is_project_list = req.body.module_id ? true : false;
        const status = req.body.status || null;
        const is_status = req.body.status ? true : false;

        try {

            let validate = JoiValidation.fetchTodo(req.body.todo_id, req.body.project_id, req.body.project_list_id, req.body.user_id, req.body.status);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let todo_data = await TodosCURD.fetchTodo(todo_id, is_todo, project_id, is_project, project_list_id, is_project_list, admin_id, manager_id, is_manager, user_id, is_user, status, is_status)
            if (todo_data.length <= 0) return sendResponse(res, 400, null, 'No Todos Found', null);
            var result = []
            _.map(_.groupBy(todo_data, elem => elem.project_name),
                (vals, key) => {
                    result.push({ project_name: key, modules: vals });
                })
            return sendResponse(res, 200, { todo_data: result }, 'Todo Data', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Get Todos.', null);
        }

    }

    async deleteTodo(req, res) {
        let todo_id = req.body.todo_id

        try {

            let validate = JoiValidation.idValidation(todo_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let todo_data = await TodosCURD.getTodo(todo_id)
            if (todo_data.length <= 0) return sendResponse(res, 400, null, 'No Todos Found', null);

            let delte_todo = await TodosCURD.deleteTodo(todo_id)
            if (!delte_todo) {
                return sendResponse(res, 400, null, 'Unable To Delete Todo.', null);
            }
            else if (delte_todo.affectedRows > 0) {
                return sendResponse(res, 200, req.body, 'Todo Deleted Successfully.', null);
            }
            return sendResponse(res, 200, req.body, 'Todo Deleted Successfully.', null);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Delete Todo.', null);
        }

    }

    async UpdateTodo(req, res) {
        let todo_id = req.body.todo_id;
        let admin_id = req['decoded'].jsonData.admin_id;
        let date = moment().format("YYYY-MM-DD");

        try {
            let validate = JoiValidation.updateTodo(req.body.name, req.body.description, req.body.project_id, req.body.start_date, req.body.end_date, req.body.status, req.body.progress, req.body.assigned_user_id, todo_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let todo_data = await TodosCURD.getTodo(todo_id)
            if (todo_data.length <= 0) return sendResponse(res, 400, null, 'No Todos Found', null);
            if (req.body.name) {
                let check_todo = await TodosCURD.getTodosByName(req.body.name, todo_data[0].project_id, todo_data[0].project_list_id);
                if (check_todo.length > 0) return sendResponse(res, 404, null, 'Todo is Already Exists', null);
            }

            let name = req.body.name || todo_data[0].name;
            let description = req.body.description || todo_data[0].description;
            // let project_id = req.body.project_id || todo_data[0].project_id;
            let start_date = req.body.start_date ? moment(req.body.start_date).format('YYYY-MM-DD') :
                moment(todo_data[0].start_date).format('YYYY-MM-DD');
            let end_date = req.body.end_date ? moment(req.body.end_date).format('YYYY-MM-DD') :
                moment(todo_data[0].end_date).format('YYYY-MM-DD');
            let status = req.body.status || todo_data[0].status;
            let progress = req.body.progress || todo_data[0].progress;
            let assigned_user_id = req.body.assigned_user_id || todo_data[0].user_id;
            if (req.body.start_date && req.body.end_date) {
                let project_start_date = moment(todo_data[0].module_start_date).format('YYYY-MM-DD');
                let project_end_date = moment(todo_data[0].module_end_date).format('YYYY-MM-DD');
                let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
                let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
                let is_before = moment(start_date).isSameOrBefore(end_date);
                if (!is_start_date || !is_end_date) {
                    return sendResponse(res, 400, null, 'Todo Start Date and End Date With In The Project Module  Duration.', null);
                }
                else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                    return sendResponse(res, 400, null, 'Please Select Valid  Start Date And End Date', null);
                }
            }
            let update_data = await TodosCURD.updateTodo(name, description, start_date, end_date, status, progress, todo_id);
            if (!update_data) return sendResponse(res, 400, null, 'Unable To Update Todo', null);
            else if (update_data.affectedRows > 0) {


                if (req.body.assigned_user_id) {
                    const assign_user = await TodosCURD.updateTodoToUser(todo_id, req.body.assigned_user_id);
                    if (!assign_user) {
                        return sendResponse(res, 400, null, 'Unable To Update Todo To User. ', null);
                    } else if (assign_user.affectedRows > 0) {

                        const get_todo = await getTodoData(todo_id, true, 1, false, 1, false, admin_id, 1, false, 1, false, 1, false)
                        return sendResponse(res, 200, get_todo, 'Successfully Updated ', null);
                    }
                }

                const get_todo = await getTodoData(todo_id, true, 1, false, 1, false, admin_id, 1, false, 1, false, 1, false)
                return sendResponse(res, 200, get_todo, 'Successfully Updated ', null);

            }
            return sendResponse(res, 400, null, 'Unable To Update Todo', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Update Todo', null);
        }

    }
}
module.exports = new Todos;


async function getTodoData(todo_id, is_todo, project_id, is_project, project_list_id, is_project_list, admin_id, manager_id, is_manager, user_id, is_user) {
    var result = []
    try {
        let todo_data = await TodosCURD.fetchTodo(todo_id, is_todo, project_id, is_project, project_list_id, is_project_list, admin_id, manager_id, is_manager, user_id, is_user, 1, false)
        _.map(_.groupBy(todo_data, elem => elem.project_name),
            (vals, key) => {
                result.push({ project_name: key, modules: vals });
            })
        return result;
    } catch {

        return result;
    }


}
