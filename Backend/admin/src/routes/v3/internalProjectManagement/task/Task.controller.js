const Validation = require('./TaskValidation');
const TaskModel = require('./Task.model');
const moment = require('moment');
const sendResponse = require('../../../../utils/myService').sendResponse;
const ProjectModel = require('../project/Project.model');
const actionsTracker = require('../../services/actionsTracker');
const { projectMessages } = require("../../../../utils/helpers/LanguageTranslate")
const getMessage = require('../../../../utils/messageTranslation').translate;
const _ = require('underscore')

class TaskController {

  async createTask(req, res) {
    let date = moment().format("YYYY-MM-DD");
    const priority = req.body.priority;
    const created_by = req.decoded.user_id;
    const project_id = req.body.project_id;
    const module_id = req.body.module_id || null;
    const name = req.body.name;
    const employee_id = req.body.employee_id;
    const description = req.body.description || "";
    const status = req.body.status == 0 ? 0 : (req.body.status ? req.body.status : 1);
    const language = req.decoded.language;
    const organization_id = req.decoded.organization_id;
    try {
      let validate = Validation.createTask(name, employee_id, project_id, module_id, description, req.body.start_date, req.body.end_date, priority, status);
      if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

      const start_date = moment(req.body.start_date).format('YYYY-MM-DD');
      const end_date = moment(req.body.end_date).format('YYYY-MM-DD');
      // const due_date = moment(req.body.due_date).format('YYYY-MM-DD');
      if (module_id) {
        let check_name = await getTaskByName(name, module_id);
        if (check_name.length > 0) {
          return sendResponse(res, 400, null, projectMessages.find(x => x.id === "44")[language] || projectMessages.find(x => x.id === "44")["en"], null);
        }
        let module_data = await getModule(module_id);
        if (module_data.length > 0) {
          if (req.body.start_date && req.body.end_date) {
            let project_start_date = moment(module_data[0].start_date).format('YYYY-MM-DD');
            let project_end_date = moment(module_data[0].end_date).format('YYYY-MM-DD');
            let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
            let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
            let is_before = moment(start_date).isSameOrBefore(end_date);
            if (!is_start_date || !is_end_date) {
              return sendResponse(res, 400, null, projectMessages.find(x => x.id === "45")[language] || projectMessages.find(x => x.id === "45")["en"], null);
            }
            else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
              return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
            }
          }
        }

      } else {
        let project_data = await ProjectModel.getSingleProject(project_id, organization_id);
        if (project_data.length <= 0) {
          return sendResponse(res, 400, null, projectMessages.find(x => x.id === "23")[language] || projectMessages.find(x => x.id === "23")["en"], null);
        }
        if (start_date && end_date) {
          let project_start_date = moment(project_data[0].start_date).format('YYYY-MM-DD');
          let project_end_date = moment(project_data[0].end_date).format('YYYY-MM-DD');

          let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
          let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
          let is_before = moment(start_date).isSameOrBefore(end_date);

          if (!is_start_date || !is_end_date) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "46")[language] || projectMessages.find(x => x.id === "46")["en"], null);
          }
          else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
          }
        }
      }

      const create_task = await TaskModel.createTask(name, employee_id, project_id, module_id, description, start_date, end_date, created_by, priority, status);
      if (!create_task) {
        return sendResponse(res, 400, null, projectMessages.find(x => x.id === "47")[language] || projectMessages.find(x => x.id === "47")["en"], null);
      } else if (create_task.affectedRows > 0) {
        req.body.task_id = create_task.insertId;
        actionsTracker(req, 'Project %i task %i created.', [project_id, req.body.task_id]);
        return sendResponse(res, 200, req.body, projectMessages.find(x => x.id === "48")[language] || projectMessages.find(x => x.id === "48")["en"], null);
      }
      return sendResponse(res, 400, null, projectMessages.find(x => x.id === "47")[language] || projectMessages.find(x => x.id === "47")["en"], null);

    } catch (err) {
      let msg = getMessage(projectMessages, "47", language) || "Something went wrong."
      return sendResponse(res, 400, null, msg, masg);
    }
  }

  async getTasks(req, res) {
    const project_id = req.body.project_id || null;
    const task_id = req.body.task_id || null
    let status = req.body.status;
    // status = req.body.status == 0 ? 0 : status;
    const created_by = req.decoded.user_id;
    const organization_id = req.decoded.organization_id;
    const name = req.body.name;
    const module_id = req.body.module_id || null;
    const language = req.decoded.language;
    actionsTracker(req, 'Project %i task %i requested.', [project_id, task_id]);

    try {
      let validate = Validation.getTask(project_id, req.body.status, task_id, name, module_id);
      if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

      let get_task = await TaskModel.getTask(project_id, task_id, organization_id, status, name, module_id);
      if (get_task.length == 0) return sendResponse(res, 400, null, projectMessages.find(x => x.id === "49")[language] || projectMessages.find(x => x.id === "49")["en"], null);
      return sendResponse(res, 200, get_task, projectMessages.find(x => x.id === "18")[language] || projectMessages.find(x => x.id === "18")["en"], null);
    } catch (err) {
      return sendResponse(res, 400, null, projectMessages.find(x => x.id === "50")[language] || projectMessages.find(x => x.id === "50")["en"], null);
    }
  }

  async deleteTask(req, res) {
    const task_id = req.body.task_ids;
    try {
      const language = req.decoded.language;
      let validate = Validation.idValidation(task_id);
      if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

      const delete_task = await TaskModel.deleteTask(task_id);
      if (!delete_task) {
        return sendResponse(res, 400, null, projectMessages.find(x => x.id === "51")[language] || projectMessages.find(x => x.id === "51")["en"], null);
      } else if (delete_task.affectedRows > 0) {
        actionsTracker(req, 'Project task %i deleted.', [task_id]);
        return sendResponse(res, 200, null, projectMessages.find(x => x.id === "52")[language] || projectMessages.find(x => x.id === "52")["en"], null);
      }
      return sendResponse(res, 400, null, projectMessages.find(x => x.id === "51")[language] || projectMessages.find(x => x.id === "51")["en"], null);
    } catch (err) {
      return sendResponse(res, 400, null, projectMessages.find(x => x.id === "51")[language] || projectMessages.find(x => x.id === "51")["en"], null);

    }


  }

  async updateTask(req, res) {
    const task_id = req.body.task_id;
    let name = req.body.name;
    let status = req.body.status;
    let date = moment().format("YYYY-MM-DD");
    let employee_id = req.body.employee_id;
    let description = req.body.description;
    let priority = req.body.priority;
    const language = req.decoded.language;
    const user_id = req.decoded.user_id;
    try {
      const status_updateAt = moment.utc().format("YYYY-MM-DD HH:mm:ss");
      let validate = Validation.updateTask(task_id, name, status, req.body.start_date, req.body.end_date, employee_id, description, priority);
      if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

      let start_date = req.body.start_date ? moment(req.body.start_date).format('YYYY-MM-DD') : null;
      let end_date = req.body.end_date ? moment(req.body.end_date).format('YYYY-MM-DD') : null;

      const get_task = await TaskModel.getSingleTask(task_id);
      if (get_task.length == 0) {
        return sendResponse(res, 400, null, projectMessages.find(x => x.id === "53")[language] || projectMessages.find(x => x.id === "53")["en"], null);
      } else {
        if (get_task[0].project_module_id) {

          if (req.body.start_date || req.body.end_date) {
            let project_start_date = moment(get_task[0].module_start_date).format('YYYY-MM-DD');
            let project_end_date = moment(get_task[0].module_end_date).format('YYYY-MM-DD');

            if (req.body.start_date && !req.body.end_date) {

              let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
              if (!is_start_date) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "45")[language] || projectMessages.find(x => x.id === "45")["en"], null);
              }
              else if (!moment(date).isSameOrBefore(start_date)) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
              }

            } else if (!req.body.start_date && req.body.end_date) {
              let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
              if (!is_end_date) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "45")[language] || projectMessages.find(x => x.id === "45")["en"], null);
              }
              else if (!moment(date).isSameOrBefore(end_date)) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
              }
            } else {

              let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
              let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
              let is_before = moment(start_date).isSameOrBefore(end_date);
              if (!is_start_date || !is_end_date) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "45")[language] || projectMessages.find(x => x.id === "45")["en"], null);
              }
              else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
              }
            }

          }
        } else {

          if (req.body.start_date || req.body.end_date) {
            let project_start_date = moment(get_task[0].project_start_date).format('YYYY-MM-DD');
            let project_end_date = moment(get_task[0].project_end_date).format('YYYY-MM-DD');
            if (req.body.start_date && !req.body.end_date) {

              let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
              if (!is_start_date) {
                return sendResponse(res, 401, null, 'Task Start Date and End Date With In The Project Duration.', null);
              }
              else if (!moment(date).isSameOrBefore(start_date)) {
                return sendResponse(res, 400, null, 'Please Select Valid  Start Date And End Date', null);
              }

            } else if (!req.body.start_date && req.body.end_date) {
              let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
              if (!is_end_date) {
                return sendResponse(res, 402, null, 'Task Start Date and End Date With In The Project Duration.', null);
              }
              else if (!moment(date).isSameOrBefore(end_date)) {
                return sendResponse(res, 400, null, 'Please Select Valid  Start Date And End Date', null);
              }
            } else {

              let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
              let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
              let is_before = moment(start_date).isSameOrBefore(end_date);
              if (!is_start_date || !is_end_date) {
                return sendResponse(res, 403, null, projectMessages.find(x => x.id === "46")[language] || projectMessages.find(x => x.id === "46")["en"], null);
              }
              else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                return sendResponse(res, 400, null, projectMessages.find(x => x.id === "3")[language] || projectMessages.find(x => x.id === "3")["en"], null);
              }
            }

          }
        }

        start_date = req.body.start_date ? moment(req.body.start_date).format('YYYY-MM-DD') : moment(get_task[0].start_date).format('YYYY-MM-DD');
        end_date = req.body.end_date ? moment(req.body.end_date).format('YYYY-MM-DD') : moment(get_task[0].end_date).format('YYYY-MM-DD');
        name = name || get_task[0].name;
        priority = priority || get_task[0].priority;
        description = description || get_task[0].description;
        employee_id = employee_id || get_task[0].employee_id;
        if (req.body.name) {
          let check_name = await getTaskByName(name, get_task[0].project_module_id);
          if (check_name.length > 0) {
            return sendResponse(res, 400, null, projectMessages.find(x => x.id === "44")[language] || projectMessages.find(x => x.id === "44")["en"], null);
          }
        }

        const update_task = await TaskModel.updateTask(task_id, name, status, start_date, end_date, employee_id, description, priority, status_updateAt, user_id);
        if (!update_task) {
          return sendResponse(res, 400, null, projectMessages.find(x => x.id === "55")[language] || projectMessages.find(x => x.id === "55")["en"], null);
        } else if (update_task.affectedRows != 0) {
          actionsTracker(req, 'Project task %i updated.', [task_id]);
          return sendResponse(res, 200, req.body, projectMessages.find(x => x.id === "56")[language] || projectMessages.find(x => x.id === "56")["en"], null);
        }
        return sendResponse(res, 400, null, projectMessages.find(x => x.id === "55")[language] || projectMessages.find(x => x.id === "55")["en"], null);
      }
    } catch (err) {
      let msg = getMessage(projectMessages, "47", language) || "Something went wrong."
      return sendResponse(res, 400, null, msg, msg);
    }

  }


  /**
   * get task timesheets
   * @function getTimesheets
   * @memberof TaskController
   * @param {*} req
   * @param {*} res
   * @returns {Object} task timesheets or error 
   */
  async getTimesheets(req, res) {
    const { organization_id, timezone, language } = req.decoded;
    try {
      let { value, error } = Validation.getTimesheets(req.query);
      if (error) return sendResponse(res, 404, null, getMessage(projectMessages, "1", language), error.details[0].message);
      actionsTracker(req, 'Task %i timesheet requested.', [value.task_id]);

      const task = await TaskModel.checkTask(value.task_id, organization_id)
      if (task.length == 0) return sendResponse(res, 400, null, 'not found', null);

      const timesheets = await TaskModel.getTaskTimesheets(value.task_id);
      if (timesheets.length == 0) return sendResponse(res, 400, null, getMessage(projectMessages, "59", language), null);

      return sendResponse(res, 200, { timesheets, timezone }, getMessage(projectMessages, "58", language), null);
    } catch (err) {
      return sendResponse(res, 400, null, getMessage(projectMessages, "60", language), null);
    }

  }


  async deleteTimesheet(req, res) {
    const timesheet_ids = req.body.timesheet_ids
    try {
      let validate = Validation.idValidation(timesheet_ids);
      if (validate.error) return sendResponse(res, 404, null, projectMessages.find(x => x.id === "1")[language] || projectMessages.find(x => x.id === "1")["en"], validate.error.details[0].message);

      const delete_timesheet = await TaskModel.deleteTimesheet(timesheet_ids);
      if (!delete_timesheet) {
        return sendResponse(res, 400, null, 'Unable To Detele Timesheets.', null);
      } else if (delete_timesheet.affectedRows > 0) {
        actionsTracker(req, 'Timesheets ? deleted.', [timesheet_ids]);
        return sendResponse(res, 200, null, 'Timesheets Deeted Successfully.', null);
      }
      return sendResponse(res, 400, null, 'Unable To Detele Timesheets.', null);

    } catch (err) {
      return sendResponse(res, 400, null, 'Unable To Detele Timesheets.', null);
    }
  }
}
module.exports = new TaskController;



async function getModule(module_id) {
  try {
    const get_project = await ProjectModel.getModuleById(module_id);
    return get_project;
  } catch (err) {
    return [];
  }
}

async function getTaskByName(name, module_id) {
  try {
    const get_task = await TaskModel.getTaskByName(module_id, name);
    return get_task;
  } catch (err) {
    return [];
  }
}


// (async function () {
//   let data = await TaskModel.getProductionTime([0])
//   console.log(data, '=============================')
// })()

