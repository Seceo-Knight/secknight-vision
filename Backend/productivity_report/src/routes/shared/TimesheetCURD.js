"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;




class TimesheetCURD {

    async createTimesheet(project_id, user_id, todo_id, note, reason, start_time, end_time, module_id) {
        try {
            return await mySql.query(`
            INSERT INTO timesheet (project_id,user_id,todo_id ,note ,reason ,start_time ,end_time,project_list_id )
            VALUES (${project_id},${user_id},${todo_id},'${note}','${reason}','${start_time}','${end_time}',${module_id})
    `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async getTimesheet(user_id, is_user, admin_id, manager_id, is_manager, is_timesheet, timesheet_id, from_date, to_date, is_date, project_id, is_project) {
        try {
            return await mySql.query(`

                           SELECT pts.id,pts.day,pts.start_time,pts.end_time,pts.user_id,u.name , pts.project_id,
                           p.name AS project_name ,pt.project_list_id,pts.project_todo_id AS todo_id,
                           pt.name AS todo_name,pts.total_time,p.admin_id,p.manager_id,p.integration_org_id AS organization_id,
                           o.name AS organization_name,pts.type ,null AS note ,null AS reason
                           FROM  project_stat_track pts
                           LEFT JOIN project p ON p.id=pts.project_id
                           LEFT JOIN project_todo pt ON pt.id=pts.project_todo_id
                           LEFT JOIN integration_organization o ON o.id=p.integration_org_id
                           LEFT JOIN users u ON u.id=pts.user_id
                           WHERE (if (${is_user}  ,(pts.user_id=${user_id}),(pts.user_id IN (select id from users where admin_id =${admin_id} ) )) )
                           AND (if (${is_timesheet},(pts.id=${timesheet_id}),(pts.id IN (SELECT id FROM project_stat_track WHERE project_id IN
                            (SELECT id FROM project WHERE admin_id=${admin_id})))))
                           AND (if (${is_date},(DATE(pts.start_time)>='${from_date} 00:00:00' AND  DATE(pts.end_time)<='${to_date} 23:59:59'),
                            (pts.id IN (SELECT id FROM project_stat_track WHERE project_id IN
                            (SELECT id FROM project WHERE admin_id=${admin_id})))))      
                            AND (IF (${is_project},(pts.project_id=${project_id}),(pts.id IN (SELECT id FROM project_stat_track WHERE project_id IN
                                (SELECT id FROM project WHERE admin_id=${admin_id})))))
                
                           `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateTimesheet(timesheet_id, project_id, todo_id, user_id, start_time, end_time, note, reason) {
        try {
            return await mySql.query(`
                UPDATE timesheet SET project_id=${project_id}, todo_id=${todo_id},user_id =${user_id},start_time='${start_time}',
                end_time='${end_time}', note='${note}',reason='${reason}'
                WHERE id =${timesheet_id}
                `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getSingleTimesheet(timesheet_id) {
        try {
            return await mySql.query(`
                SELECT * FROM timesheet 
                WHERE id IN (${timesheet_id})
                `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async deleteTimesheet(timesheet_ids) {
        try {
            return await mySql.query(`
                 DELETE FROM project_stat_track 
                 WHERE id IN (${timesheet_ids})
                `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

} module.exports = new TimesheetCURD;




