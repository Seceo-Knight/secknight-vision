"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../../../database/MySqlConnection').getInstance();
const Logger = require('../../../../logger/Logger').logger;
// const EmpKeyStrokesModel = require('../../../../models/employee_keystrokes.schema');


class TaskModel {
  async createTask(name, employee_id, project_id, module_id, description, start_date, end_date, created_by, priority, status) {
    try {

      let query = `INSERT INTO project_tasks (name,description,start_date,end_date,employee_id,project_id,project_module_id,created_by,status,priority,progress,updated_by)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      return await mySql.query(query, [name, description, start_date, end_date, employee_id, project_id, module_id, created_by, status, priority, 0, created_by])
      // return await mySql.query(`
      //   INSERT INTO project_tasks (name,description,start_date,end_date,employee_id,project_id,project_module_id,created_by,status,priority,progress,updated_by)
      //   VALUES ('${name}',"${description}",'${start_date}','${end_date}',
      //        ${employee_id},${project_id},${module_id},${created_by},${status},${priority},0,${created_by}) `);
    } catch (err) {
      Logger.error(`----error-----${err}------${__filename}----`);
      return null;
    }
  }

  async getTask(project_id, task_id, organization_id, status, name, module_id) {
    try {
      let query = `
                SELECT pt.id AS task_id , pt.name, pt.project_module_id, pm.name AS project_module_name,
                pt.project_id, p.name AS 
                project_name,pt.employee_id,CONCAT(u.first_name ,' ',u.last_name) AS employee_name,
                pt.description,pt.progress,pt.status,pt.status_updateAt,pt.priority,
                pt.start_date,pt.end_date,pt.created_by,CONCAT(ua.first_name ,' ',ua.last_name) assigned_by,pt.updated_by,pt.created_at,
                sec_to_time(sum(eet.duration)) AS time
                FROM project_tasks pt
                LEFT JOIN projects p ON p.id= pt.project_id
                LEFT JOIN users u ON u.id=pt.employee_id
                LEFT JOIN users ua ON ua.id=pt.created_by
                LEFT JOIN project_modules pm ON pm.id= pt.project_module_id
                LEFT JOIN employee_tasks_timesheet eet ON eet.task_id=pt.id
                WHERE organization_id=${organization_id}`;

      if (project_id) query += ` AND p.id=${project_id}`;
      if (task_id) query += ` AND pt.id=${task_id}`;
      if (status == 0 || status) query += ` AND pt.status=${status}`;
      if (name) query += ` AND pt.name  LIKE '${name}%'`;
      if (module_id) query += ` AND pm.id=${module_id}`;
      query += ` GROUP BY pt.id`;

      return await mySql.query(query);

    } catch (err) {
      Logger.error(`----error-----${err}------${__filename}----`);
      return null;
    }
  }

  async deleteTask(task_id) {
    try {
      return await mySql.query(`
         DELETE FROM project_tasks WHERE id IN (${task_id}) 
      `);
    } catch (err) {
      Logger.error(`----error-----${err}------${__filename}----`);
      return null;
    }
  }
  async getSingleTask(task_id) {
    try {
      return await mySql.query(`
        SELECT pt.name ,pt.status,pt.project_module_id,pt.start_date,pt.end_date ,pm.start_date AS module_start_date,pm.end_date AS module_end_date
        ,pt.priority,pt.description,pt.employee_id ,p.start_date AS project_start_date,p.end_date AS project_end_date
        from project_tasks pt
        LEFT JOIN project_modules pm ON pm.id= pt.project_module_id 
        LEFT JOIN projects p ON p.id= pt.project_id
        WHERE pt.id = ${task_id} 
        `);
    } catch (err) {
      Logger.error(`----error-----${err}------${__filename}----`);
      return null;
    }
  }

  async updateTask(task_id, name, status, start_date, end_date, employee_id, description, priority, status_updateAt, user_id) {
    try {
      let query = `UPDATE project_tasks SET  name=? , start_date=?,end_date=?,
      employee_id=? , description=? , priority=?   WHERE id = ?`;
      let params = [name, start_date, end_date, employee_id, description, priority, task_id];

      if (status || status == 0) {
        query = `UPDATE project_tasks SET  name=? , start_date=?,end_date=?,
                employee_id=? , description=? , priority=? ,status=?,status_updateAt=?,updated_by=?   WHERE id = ?`;
        params = [name, start_date, end_date, employee_id, description, priority, status, status_updateAt, user_id, task_id];

      }
      return await mySql.query(query, params)
    } catch (err) {
      Logger.error(`----error-----${err}------${__filename}----`);
      return null;
    }
  }
  async getTimesheets(employee_id, project_id, from_date, to_date, organization_id, is_employee, is_project, is_date) {
    try {
      return await mySql.query(`
     SELECT t.id,t.attendance_id,t.attendance_id,t.start_time,t.end_time,t.duration,t.created_at,t.task_id,
     pt.name AS task_name ,p.id AS project_id ,p.name AS project_name,concat(u.first_name ," ",u.last_name) AS employee_name ,pt.employee_id
     FROM employee_tasks_timesheet t
     LEFT JOIN project_tasks pt ON t.task_id=pt.id
     LEFT JOIN projects  p ON p.id=pt.project_id
     LEFT JOIN users u ON u.id=pt.employee_id
     WHERE (if (${is_employee}, (pt.employee_id=${employee_id}),(t.id IN (SELECT id FROM employee_tasks_timesheet 
     WHERE task_id IN (SELECT id FROM project_tasks WHERE project_id IN (SELECT id FROM projects WHERE organization_id =${organization_id}) ) ))))
     AND (if(${is_project}, (p.id=${project_id}),(p.id IN (SELECT id FROM projects WHERE organization_id =${organization_id}))) ) 
     AND  (if (${is_date} ,(t.start_time >='${from_date} 00:00:00' AND t.end_time <='${to_date} 23:59:59'),(t.id  IN (SELECT id FROM employee_tasks_timesheet 
     WHERE task_id IN (SELECT id FROM project_tasks WHERE project_id IN (SELECT id FROM projects WHERE organization_id =${organization_id}) ) ))) )
    `);
    } catch (err) {
      Logger.error(`----error-----${err}------${__filename}----`);
      return null;
    }
  }
  async deleteTimesheet(timesheet_ids) {
    try {
      return await mySql.query(`
           DELETE FROM employee_tasks_timesheet WHERE id IN (${timesheet_ids}) 
        `);
    } catch (err) {
      Logger.error(`----error-----${err}------${__filename}----`);
      return null;
    }
  }

  async getTaskByName(module_id, name) {
    try {
      return await mySql.query(`
           SELECT name ,status from project_tasks  WHERE project_module_id = ${module_id} AND name='${name}'
        `);
    } catch (err) {
      Logger.error(`----error-----${err}------${__filename}----`);
      return null;
    }
  }

  async getOrgnization(id) {
    try {
      return await mySql.query(`
      SELECT id  from organizations Where user_id =${id}
     `);
    } catch (err) {
      return null
    }
  }

  /**
   * get task timesheets
   * @function getTaskTimesheets
   * @memberof TaskModel
   * @param {array} taskId
   * @returns {Promise<Object>} task timesheets or error 
   */
  getTaskTimesheets(taskId) {
    return mySql.query('SELECT task_id, start_time, end_time, duration FROM `employee_tasks_timesheet` WHERE task_id =? ORDER BY created_at DESC', [taskId])
  }

  /**
   * get task 
   * @function checkTask
   * @memberof TaskModel
   * @param {number} taskId
   * @param {number} organization_id
   * @returns {Promise<Object>} task or error 
   */
  checkTask(taskId, organization_id) {
    const query = `SELECT pt.id
                   FROM project_tasks pt 
                   INNER JOIN projects p ON p.id=pt.project_id 
                   WHERE pt.id =? AND p.organization_id=?`
    return mySql.query(query, [taskId, organization_id])
  }

}
module.exports = new TaskModel;