'use strict';
const moment = require('moment');

if (process.env.IS_DEBUGGING) console.log(__filename);

const mySql = require('../../../database/MySqlConnection').getInstance();

class ZohoCURD {

    async createProject(name, description, admin_id, manager_id, start_date, end_date, integration_org_id, ext_project_id) {
        start_date = start_date ? moment(start_date).utc().format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00';
        end_date = end_date ? moment(end_date).utc().format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00';
        return await mySql.query(`
            INSERT INTO project (name,description,admin_id,manager_id,start_date,end_date,status,actual_start_date,actual_end_date,integration_org_id,ext_project_id)
            VALUES ('${name}','${description}',${admin_id},${manager_id},'${start_date}','${end_date}',1,'0000:00:00 00:00:00','0000:00:00 00:00:00',${integration_org_id},'${ext_project_id}')
        `);
    }

    async deleteProject(admin_id, project_id) {
        return await mySql.query(`DELETE FROM project  WHERE id =${project_id} AND admin_id =${admin_id}`);

    }

    async createProjectList(name, ext_list_id, project_id, type) {
        return await mySql.query(`
            INSERT INTO project_list (name,project_id, type,ext_list_id)
            VALUES('${name}',${project_id},${type},'${ext_list_id}')
         `);
    }

    async deleteProjectList(project_id, task_list_id) {
        return await mySql.query(`DELETE FROM project_list  WHERE id =${task_list_id} AND project_id=${project_id}`);
    }

    async createTask(name, description, start_date, end_date, status, project_id, progress, user_id, project_list_id, ext_id) {
        return await mySql.query(`
                INSERT INTO project_todo (name,description,start_date,due_date,status,project_id,progress,user_id,project_list_id,ext_id)
                VALUES ('${name}','${description}','${start_date}','${end_date}',${status},${project_id},${progress},${user_id},${project_list_id},'${ext_id}')
            `);
    }

    async updateTask(project_todo_id, name, description, start_date, due_date, status, progress) {
        return await mySql.query(`
                UPDATE project_todo SET name = '${name}', description = '${description}', start_date = '${start_date}', due_date = '${due_date}', status =${status},progress=${progress}
                WHERE id=${project_todo_id}
            `)
    }

    async deleteTask(project_id, task_id) {
        return await mySql.query(`DELETE FROM project_todo  WHERE id =${task_id} AND project_id=${project_id}`);
    }

    async createBug(name, description, project_id, ext_project_id, ext_issue_id, assigned_by_id, assigned_to_id, status, type, severity, due_date) {
        return await mySql.query(`
                INSERT INTO issue (name,description,project_id,ext_project_id,ext_issue_id,assigned_by_id,assigned_to_id,status,type,severity,due_date)
                VALUES ('${name}','${description}',${project_id},'${ext_project_id}','${ext_issue_id}',${assigned_by_id},${assigned_to_id},${status},${type},${severity},'${due_date}')
            `);
    }

    async deleteTask(project_id, issue_id) {
        return await mySql.query(`DELETE FROM issue  WHERE id =${issue_id} AND project_id=${project_id}`);
    }

    async projectUsers(project_id) {
        return await mySql.query(`
            SELECT pu.user_id, pu.project_id, pu.ext_user_id, pu.ext_project_id, u.name AS first_name, u.full_name AS last_name, u.email
            FROM project_to_users pu
            INNER JOIN users u ON u.id = pu.user_id
            WHERE project_id = ${project_id}
        `)
    }
}

module.exports = new ZohoCURD;