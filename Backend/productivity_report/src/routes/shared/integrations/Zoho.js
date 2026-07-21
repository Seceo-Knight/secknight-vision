
'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const mySql = require('../../../database/MySqlConnection').getInstance();
const Logger = require('../../../Logger').logger;

class Zoho {

    /**
     * Add zohointegration creds data.
     *
     * @function addZohointegrationData
     * @memberof Zoho
     * @param {string} name
     * @param {string} access_token
     * @param {string} refresh_token
     * @param {number} admin_id
     * @param {number} manager_id
     * @param {number} integration_id
     * @returns {Object} - Data or Error.
     **/
    async addZohointegrationData(name, access_token, refresh_token, admin_id, manager_id, integration_id) {
        try {
            return await mySql.query(`
                INSERT INTO integration_creds (name, access_token, refresh_token, admin_id, manager_id,integration_id,status)
                VALUES ('${name}','${access_token}' , '${refresh_token}', ${admin_id}, ${manager_id},${integration_id},1);
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    /**
     * Check zoho integration creds data.
     *
     * @function checkZohointegrationData
     * @memberof Zoho
     * @param {number} admin_id
     * @param {number} integration_id
     * @returns {Object} - Data or Error.
     **/
    async checkZohointegrationData(integration_id, admin_id, manager_id) {
        try {
            return await mySql.query(`
                SELECT *  
                FROM integration_creds
                WHERE integration_id=${integration_id} AND  admin_id=${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    /**
     * Zoho integration creds data.
     *
     * @function checkZohointegrationData
     * @memberof Zoho
     * @param {number} admin_id
     * @param {number} integration_id
     * @returns {Object} - Data or Error.
     **/
    async zohointegrationData(admin_id, manager_id) {
        try {
            return await mySql.query(`
                SELECT *  
                FROM integration_creds
                WHERE  admin_id=${admin_id} AND integration_id=2
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateIntegrationData(admin_id, manager_id, access_token) {
        try {
            return await mySql.query(`
                UPDATE integration_creds
                SET access_token='${access_token}'
                WHERE  admin_id=${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getOrginization(admin_id, manager_id, access_token, integration_id) {
        try {
            return await mySql.query(`
                SELECT * 
                FROM integration_organization
                WHERE  admin_id=${admin_id} AND integration_id= ${integration_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async addPortals(portals) {
        try {
            return await mySql.query(`
                INSERT INTO integration_organization (name,ext_org_id,admin_id,manager_id,integration_id,integration_creds_id)
                VALUES ?`, [portals]
            );
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getLocalProject(integration_org_id, admin_id, manager_id) {
        try {
            return await mySql.query(`
                SELECT * 
                FROM project
                WHERE admin_id=${admin_id} AND integration_org_id=${integration_org_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async addprojects(projects) {
        try {
            return await mySql.query(`
                INSERT INTO project (name,description,admin_id,manager_id,ext_project_id,integration_org_id,start_date,end_date,status,progress)
                VALUES ?`, [projects]
            );
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async upsertProjects(name, description, admin_id, manager_id, ext_project_id, integration_org_id, start_date, end_date, actual_start_date, actual_end_date, status, progress) {
        try {
            return await mySql.query(`
                INSERT INTO project
                    (name, description, admin_id, manager_id, ext_project_id, integration_org_id, start_date, end_date, actual_start_date, actual_end_date, status, progress)
                VALUES
                    ("${name}", "${description}", ${admin_id}, ${manager_id}, "${ext_project_id}", ${integration_org_id}, "${start_date}", "${end_date}", "${actual_start_date}", "${actual_end_date}", ${status}, ${progress})
                ON DUPLICATE KEY UPDATE
                    id = LAST_INSERT_ID(id),
                    name = "${name}",
                    description = "${description}",
                    manager_id = ${manager_id},
                    ext_project_id = "${ext_project_id}",
                    integration_org_id = ${integration_org_id},
                    start_date = "${start_date}",
                    end_date = "${end_date}",
                    actual_start_date = "${actual_start_date}",
                    actual_end_date = "${actual_end_date}",
                    status = ${status},
                    progress = ${progress}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getProject(project_id, manager_id, admin_id) {
        try {
            return await mySql.query(`
                SELECT p.id AS project_id,p.ext_project_id,p.name,o.id AS integration_org_id,o.ext_org_id
                FROM project p
                INNER JOIN integration_organization o ON o.id=p.integration_org_id
                WHERE p.id=${project_id} AND  p.admin_id=${admin_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getTaskListByExtenalId(ext_list_id, project_id) {
        try {
            return await mySql.query(`
                SELECT *
                FROM project_list
                WHERE project_id=${project_id} AND ext_list_id='${ext_list_id}'
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async addNewTaskList(ext_list_id, name, project_id, type) {
        try {
            return await mySql.query(`
            INSERT INTO project_list (ext_list_id, name, project_id, type)
            VALUES ('${ext_list_id}', '${name}', ${project_id}, ${type})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getTaskByExtenalId(ext_id, project_id, admin_id) {
        try {
            return await mySql.query(`
                SELECT * 
                FROM project_todo
                WHERE ext_id='${ext_id}' AND  project_id= ${project_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateTask(due_date, start_date, status, progress, task_id) {
        try {
            return await mySql.query(`
                UPDATE project_todo
                SET due_date = '${due_date}', start_date= '${start_date}',status=${status},progress=${progress}
                WHERE id = ${task_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async insertTask(ext_id, name, description, project_id, project_list_id, due_date, due_complete, start_date, status, progress) {
        try {
            return await mySql.query(`
                INSERT INTO project_todo (ext_id, name,description, project_id,project_list_id,due_date,due_complete,start_date,status, progress)
                VALUES ('${ext_id}', '${name}','${description}', ${project_id}, ${project_list_id},'${due_date}',${due_complete},'${start_date}',${status},${progress})
                ON DUPLICATE KEY UPDATE
                id = LAST_INSERT_ID(id),
                name = "${name}",
                description = "${description}",
                due_date = "${due_date}",
                start_date = "${start_date}",
                status = ${status},
                progress = ${progress}
                `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async insertIssue(name, description, project_id, ext_issue_id, assigned_by_id, assigned_to_id, status, type, severity, due_date) {
        try {
            return await mySql.query(`
                INSERT INTO issue (name,description,project_id,ext_issue_id,assigned_by_id,assigned_to_id,status,type,severity,due_date)
                VALUES ('${name}','${description}',${project_id},'${ext_issue_id}',${assigned_by_id},${assigned_to_id},${status},${type},${severity},'${due_date}')
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async insertIssueBulk(issues) {
        try {
            return await mySql.query(`
                INSERT INTO issue (name,description,project_id,ext_issue_id,ext_project_id,status,type,severity,due_date,assigned_by_id,assigned_to_id)
                VALUES ${issues}
                ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                project_id = VALUES(project_id),
                ext_project_id = VALUES(ext_project_id),
                ext_issue_id = VALUES(ext_issue_id),
                type = VALUES(type),
                description = VALUES(description),
                status = VALUES(status),
                severity = VALUES(severity),
                due_date = VALUES(due_date),
                assigned_by_id=VALUES(assigned_by_id),
                assigned_to_id=VALUES(assigned_to_id)
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getAllProjects(manager_id, admin_id, skip, limit, integration_org_id) {
        try {
            return await mySql.query(`
                SELECT p.id AS project_id,p.ext_project_id,p.name,p.description,p.integration_org_id,p.start_date,p.end_date,p.actual_start_date,
                p.actual_end_date,p.status,p.progress,p.manager_id,(SELECT count(*) FROM project WHERE (p.manager_id=${manager_id} OR
			    admin_id=${admin_id}) AND integration_org_id=${integration_org_id}) AS total_count
                FROM project p
                WHERE (p.manager_id=${manager_id} OR admin_id=${admin_id}) AND integration_org_id=${integration_org_id}
                LIMIT ${skip},${limit}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async overView(admin_id, manager_id, integration_org_id) {
        try {
            return await mySql.query(`
                SELECT COUNT(*) AS total_task,
                (SELECT COUNT(*) FROM project_todo pt INNER JOIN project p ON p.id=pt.project_id WHERE pt.status=3 AND integration_org_id=${integration_org_id} AND (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) ) AS closed_task,
                (SELECT COUNT(*) FROM issue i INNER JOIN project p ON p.id=i.project_id WHERE integration_org_id=${integration_org_id} AND (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) ) AS total_issue,
                (SELECT COUNT(*) FROM issue i INNER JOIN project p ON p.id=i.project_id WHERE i.status=3 AND integration_org_id=${integration_org_id} AND (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) ) AS closed_issue
                FROM project_todo pt
                INNER JOIN project p ON p.id=pt.project_id 
                WHERE  (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) AND integration_org_id=${integration_org_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async integration() {
        try {
            return await mySql.query(`
                SELECT i.id, i.name, i.image
                FROM integration i
                WHERE status=1
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async integrationData(manager_id, admin_id) {
        try {
            return await mySql.query(`
                SELECT ic.id AS integration_data_id,ic.name AS integration_data_name,ic.status,i.name AS integration_name,i.image,ic.integration_id
                FROM integration_creds ic
                INNER JOIN integration i ON i.id=ic.integration_id 
                WHERE manager_id=${manager_id} OR admin_id=${admin_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteIntegrationData(manager_id, admin_id, integration_data_id) {
        try {
            return await mySql.query(`
                DELETE FROM integration_creds 
                WHERE id=${integration_data_id} AND (manager_id=${manager_id} OR admin_id=${admin_id})
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async portals(manager_id, admin_id) {
        try {
            return await mySql.query(`
                SELECT io.id AS integration_org_id,io.name AS portal_name,io.ext_org_id,i.name AS integration_name
                FROM integration_organization io
                INNER JOIN integration i ON i.id=io.integration_id
                WHERE manager_id=${manager_id} OR admin_id=${admin_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async issues(admin_id, manager_id, status, skip, limit, is_project_id, is_status, project_id) {
        project_id = project_id ? project_id : 0
        status = status ? status : 0
        try {
            return await mySql.query(`
                SELECT i.id AS issue_id,i.ext_issue_id,i.name AS issue_name,i.description,i.project_id,i.assigned_by_id,i.assigned_to_id,i.severity,
                i.due_date,p.name AS project_name,u_by.name AS first_name,u_by.full_name AS last_name,u_by.photo_path AS assigned_by_photo_path,
                u_to.name AS first_name,u_to.full_name AS last_name,u_to.photo_path AS assigned_to_photo_path,i.status,(SELECT count(*) FROM issue i WHERE (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) AND i.type=5 
                AND if (${is_status}, (i.status=${status}), (i.status IN(SELECT i.status from issue i) ))
                AND if (${is_project_id}, (i.project_id=${project_id}), (i.project_id IN(SELECT i.project_id from issue i) ))) AS total_count
                FROM issue i
                INNER JOIN project p ON p.id=i.project_id
                LEFT JOIN users u_by ON u_by.id=i.assigned_by_id
                LEFT JOIN users u_to ON u_to.id=i.assigned_to_id
                WHERE (p.manager_id=${manager_id} OR  p.admin_id=${admin_id}) 
                AND i.type=5 AND if (${is_status}, (i.status=${status}), (i.status IN(SELECT i.status from issue i) ))
                AND if (${is_project_id}, (i.project_id=${project_id}), (i.project_id IN(SELECT i.project_id from issue i) ))
                ORDER BY i.created_at desc
                LIMIT ${skip},${limit}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async projectList(manager_id, admin_id, project_id) {
        try {
            return await mySql.query(`
                SELECT pl.id AS project_list_id,pl.ext_list_id,pl.name AS project_list_name,pl.project_id
                FROM project_list pl
                INNER JOIN project p ON p.id=pl.project_id 
                WHERE (manager_id=${manager_id} OR admin_id=${admin_id}) AND project_id=${project_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async projectTODO(admin_id, manager_id, status, is_status, project_list_id, skip, limit) {
        try {
            return await mySql.query(`
                SELECT pt.project_id,pt.ext_id,pt.id AS project_todo_id,pt.project_list_id,pt.name,pt.description,pt.due_date,pt.due_complete,pt.start_date,
                pt.end_date,pt.status,pt.progress,ptou.user_id,p.name AS project_name,u.name,u.full_name,u.photo_path,
                (SELECT COUNT(*) FROM project_todo pt
                    WHERE(p.manager_id=${manager_id} OR p.admin_id=${admin_id}) 
                    AND if (false, (pt.status=${status}), (pt.status IN(SELECT pt.status from project_todo pt) ))
                    AND pt.project_list_id=${project_list_id}
                ) AS total_count
                FROM project_todo pt 
                INNER JOIN project p ON p.id=pt.project_id
                LEFT JOIN project_todo_to_users ptou ON pt.id=ptou.project_todo_id 
                LEFT JOIN users u ON u.id=ptou.user_id
                WHERE  (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) 
                AND if (${is_status}, (pt.status=${status}), (pt.status IN(SELECT pt.status from project_todo pt) ))
                AND pt.project_list_id=${project_list_id}
                LIMIT ${skip},${limit}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async unicProjectsWithTasks(manager_id, admin_id) {
        try {
            return await mySql.query(`
                SELECT pt.project_id,pt.ext_id,p.name AS projct_name,p.admin_id,pt.name,pt.description,pt.due_date,pt.start_date,
                pt.due_complete,pt.start_date,pt.end_date,pt.status,pt.progress,ptou.user_id,pt.project_list_id,pl.name AS project_list_name
                FROM project_todo pt
                INNER JOIN project p ON p.id=pt.project_id 
                INNER JOIN project_list pl ON pl.id=pt.project_list_id 
                LEFT JOIN project_todo_to_users ptou ON pt.id=ptou.project_todo_id 
                WHERE p.manager_id=${manager_id} OR p.admin_id=${admin_id}
                GROUP BY pt.project_id
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async projectStat(project_id) {
        try {
            return await mySql.query(`
            SELECT COUNT(*) AS total_task,
            (SELECT COUNT(*) FROM project_todo WHERE status=3 AND project_id=${project_id}) AS completed_task,
            (SELECT COUNT(*) FROM issue WHERE project_id=${project_id}) AS total_issue,
            (SELECT COUNT(*) FROM issue WHERE status=1 AND project_id=${project_id}) AS issue_in_progress,
            (SELECT COUNT(*) FROM issue WHERE status=2 AND project_id=${project_id}) AS issue_to_be_tested,
            (SELECT COUNT(*) FROM issue WHERE status=3 AND project_id=${project_id}) AS issue_closed,
            (SELECT COUNT(*) FROM issue WHERE status=4 AND project_id=${project_id}) AS issue_open,
            (SELECT COUNT(*) FROM issue WHERE status=5 AND project_id=${project_id}) AS issue_reopen
            FROM project_todo pt
            WHERE pt.project_id=${project_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async todayDueTask(admin_id, manager_id, date, integration_org_id, project_id, is_project_id) {
        return await mySql.query(`
                SELECT pt.project_id,pt.id AS project_todo_id,pt.project_list_id,pt.name AS task_name,pt.description,pt.due_date,pt.due_complete,
                pt.start_date,pt.end_date,pt.status,pt.progress,ptou.user_id,p.name AS project_name,pl.name AS project_list_name,
                u.name,u.full_name,u.photo_path
                FROM project_todo pt 
                INNER JOIN project p ON p.id=pt.project_id
                INNER JOIN project_list pl ON pl.id=pt.project_list_id
                LEFT JOIN project_todo_to_users ptou ON pt.id=ptou.project_todo_id 
                LEFT JOIN users u ON u.id=ptou.user_id
                WHERE  (p.manager_id=${manager_id} OR p.admin_id=${admin_id})AND pt.status!=3 AND p.integration_org_id=${integration_org_id} 
                AND pt.due_date BETWEEN '${date} 00-00-00' AND '${date} 23-59-59' AND if (${is_project_id}, (pt.project_id=${project_id}), (pt.project_id IN(SELECT pt.project_id from project_todo pt) ))
            `);
    }

    async overDueTasks(manager_id, admin_id, integration_org_id, date, project_id, is_project_id) {
        return await mySql.query(`
                SELECT pt.project_id,pt.id AS project_todo_id,pt.project_list_id,pt.name AS task_name,pt.description,pt.due_date,pt.due_complete,pt.start_date,
                pt.end_date,pt.status,pt.progress,ptou.user_id,p.name AS project_name,pl.name AS project_list_name,u.name,u.full_name,u.photo_path
                FROM project_todo pt 
                INNER JOIN project p ON p.id=pt.project_id
                INNER JOIN project_list pl ON pl.id=pt.project_list_id
                LEFT JOIN project_todo_to_users ptou ON pt.id=ptou.project_todo_id 
                LEFT JOIN users u ON u.id=ptou.user_id
                WHERE  (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) AND pt.status!=3  AND integration_org_id=${integration_org_id} AND pt.due_date <= '${date} 00-00-00'
                AND pt.due_date != '0000-00-00 00:00:00' AND if (${is_project_id}, (pt.project_id=${project_id}), (pt.project_id IN(SELECT pt.project_id from project_todo pt) ))
            `)
    }

    async todayDueIssue(admin_id, manager_id, date, integration_org_id, project_id, is_project_id) {
        return await mySql.query(`
            SELECT i.project_id,i.id AS project_issue_id,i.name iisue_name,i.ext_issue_id,i.assigned_by_id,i.assigned_to_id,i.ext_project_id,i.status,
            i.severity,i.description,i.due_date,p.name AS project_name,u_by.name AS first_name,u_by.full_name AS last_name,u_by.photo_path AS assigned_by_photo_path,
            u_to.name AS first_name,u_to.full_name AS last_name,u_to.photo_path AS assigned_to_photo_path
            FROM issue i
            INNER JOIN project p ON p.id=i.project_id
            LEFT JOIN users u_by ON u_by.id=i.assigned_by_id
            LEFT JOIN users u_to ON u_to.id=i.assigned_to_id
            WHERE  (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) AND i.status!=3  AND p.integration_org_id=${integration_org_id} 
            AND i.due_date BETWEEN '${date} 00-00-00' AND '${date} 23-59-59'
            AND if (${is_project_id}, (i.project_id=${project_id}), (i.project_id IN(SELECT i.project_id from issue i) ))
        `);
    }

    async overDueIssue(manager_id, admin_id, integration_org_id, date, project_id, is_project_id) {
        return await mySql.query(`
                SELECT i.project_id,i.id AS project_issue_id,i.name AS issue_name,i.ext_issue_id,i.assigned_by_id,i.assigned_to_id,i.ext_project_id,i.status,
                i.severity,i.description,i.due_date,p.name AS project_name,u_by.name AS first_name,u_by.full_name AS last_name,u_by.photo_path AS assigned_by_photo_path,
                u_to.name AS first_name,u_to.full_name AS last_name,u_to.photo_path AS assigned_to_photo_path
                FROM issue i
                INNER JOIN project p ON p.id=i.project_id
                LEFT JOIN users u_by ON u_by.id=i.assigned_by_id
                LEFT JOIN users u_to ON u_to.id=i.assigned_to_id
                WHERE  (p.manager_id=${manager_id} OR p.admin_id=${admin_id}) AND i.status!=3  AND p.integration_org_id=${integration_org_id} AND i.due_date <= '${date} 00-00-00'
                AND if (${is_project_id}, (i.project_id=${project_id}), (i.project_id IN(SELECT i.project_id from issue i) ))
                AND i.due_date != '0000-00-00 00:00:00'
            `);
    }

}

module.exports = new Zoho;

