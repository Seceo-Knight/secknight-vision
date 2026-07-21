"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;


class TodosCURD {
    async createTodo(name, description, project_id, start_date, end_date, status, progress, project_list_id) {
        try {
            return await mySql.query(`
                INSERT INTO project_todo (name,description,start_date,end_date,status,project_id,progress,project_list_id,type)
                VALUES ('${name}','${description}','${start_date}','${end_date}',${status},${project_id},${progress},${project_list_id},1)
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getTodosByName(name, project_id, project_list_id) {
        try {
            return await mySql.query(`
                SELECT * FROM project_todo WHERE name='${name}'  AND project_id =${project_id} AND project_list_id=${project_list_id}
           `)
        }
        catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async fetchTodo(todo_id, is_todo, project_id, is_project, project_list_id, is_project_list, admin_id, manager_id, is_manager, user_id, is_user, status, is_status) {
        try {
            return await mySql.query(`
                SELECT pt.id AS todo_id ,pt.name AS todo_name ,pt.description,ptu.user_id, u.name AS user_name, d.name AS department_name,pt.progress,pt.start_date,
                pt.end_date,pt.progress,pt.created_at,
                p.id AS project_id ,p.name AS project_name,p.admin_id,p.manager_id,
                pt.project_list_id AS module_id,pl.name  AS module_name,pt.status
                FROM project_todo pt 
                INNER JOIN project p ON p.id=pt.project_id
                INNER JOIN project_list pl ON pl.id=pt.project_list_id
                INNER JOIN project_todo_to_users ptu ON ptu.project_todo_id=pt.id
                INNER JOIN users u ON u.id=ptu.user_id
                INNER JOIN department d ON d.id=u.department_id
                WHERE (if (${is_project} ,(pt.project_id=${project_id}),(pt.project_id IN ( SELECT id FROM project WHERE admin_id=${admin_id} ) )))
                AND  (if (${is_manager} ,(p.manager_id=${manager_id}),(p.id IN ( SELECT id FROM project WHERE admin_id=${admin_id} ) )))
                AND (if (${is_user} ,(ptu.user_id=${user_id}),(ptu.user_id IN ( SELECT id FROM users WHERE admin_id=${admin_id}))))
                AND (if (${is_project_list} ,(pt.project_list_id=${project_list_id}),(pt.project_list_id IN 
                    (SELECT id FROM  project_list WHERE project_id IN 
                    (SELECT id FROM project WHERE admin_id =${admin_id} AND  (if (${is_manager} ,(p.manager_id=${manager_id}),
                    (p.id IN ( SELECT id FROM project WHERE admin_id=${admin_id})))))))))
                AND if(${is_todo} , (pt.id=${todo_id}),(pt.id IN (SELECT id FROM project_todo WHERE project_id IN  
                    (SELECT id FROM project WHERE admin_id =${admin_id} AND (if (${is_manager} ,(p.manager_id=${manager_id}),
                    (p.id IN ( SELECT id FROM project WHERE admin_id=${admin_id} )))))))) 
                AND  pt.type=1
                AND  (IF (${is_status} ,(pt.status=${status}),(pt.project_id IN ( SELECT id FROM project WHERE admin_id=${admin_id}) ))) 
               
            `)
        }
        catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteTodo(todo_id) {
        try {
            return await mySql.query(`
                 DELETE FROM project_todo WHERE id=${todo_id}
           `)
        }
        catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getTodo(todo_id) {
        try {
            return await mySql.query(`
                 SELECT pt.*,pl.start_date AS module_start_date,pl.end_date AS module_end_date  FROM project_todo pt
                 INNER JOIN project_list pl ON pl.id=pt.project_list_id
                 WHERE pt.id=${todo_id}
           `)
        }
        catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateTodo(name, description, start_date, end_date, status, progress, todo_id) {
        try {
            return await mySql.query(`
            UPDATE project_todo  SET  name='${name}', description='${description}',
            start_date='${start_date}',
            end_date='${end_date}',status=${status},progress=${progress} 
            WHERE id =${todo_id}
          `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async assignTodoToUser(todo_id, user_id) {
        try {
            return await mySql.query(`
       INSERT INTO project_todo_to_users (user_id,project_todo_id)
       VALUES (${user_id},${todo_id})
       `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateTodoToUser(todo_id, user_id) {
        try {
            return await mySql.query(`
     UPDATE project_todo_to_users SET user_id=${user_id}
     WHERE project_todo_id=${todo_id}
     `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
}

module.exports = new TodosCURD;
