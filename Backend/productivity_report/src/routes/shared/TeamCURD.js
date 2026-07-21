"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class TeamCURD {

    async createTeam(name, description, status, admin_id, manager_id) {
        try {
            return await mySql.query(`
          INSERT INTO teams (name,description,admin_id,manager_id,status)
          VALUES ('${name}','${description}',${admin_id},${manager_id},${status})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getTeamByName(name, admin_id) {
        try {
            return await mySql.query(`
            SELECT id FROM teams WHERE name='${name}' AND admin_id=${admin_id} 
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    // SELECT t.id ,t.name,t.status,t.description,t.organization_id,t.created_at FROM teams t
    // INNER JOIN integration_organization io ON io.id=t.organization_id 
    // WHERE (if(${is_team_id},(t.id=${team_id}) ,(t.id IN ( SELECT id FROM teams WHERE organization_id=${organization_id}))))
    // AND t.organization_id=${organization_id}
    // AND (if (${is_manager} ,(t.manager_id=${manager_id}),(t.id IN ( SELECT id FROM teams WHERE organization_id=${organization_id}))))
    // AND io.type=1

    async getTeams(team_id, is_team_id, admin_id, is_manager, manager_id) {
        try {
            return await mySql.query(`

            SELECT t.id ,t.name,t.status,t.description,t.created_at FROM teams t
            WHERE (if(${is_team_id},(t.id=${team_id}) ,(t.id IN ( SELECT id FROM teams WHERE  admin_id=${admin_id}))))
            AND (if (${is_manager} ,(t.manager_id=${manager_id}),(t.id IN ( SELECT id FROM teams WHERE admin_id=${admin_id}))))
            
           `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateTeam(name, description, status, manager_id, admin_id, team_id) {
        try {
            return await mySql.query(`
            UPDATE teams SET name ='${name}',description ='${description}' ,status=${status},manager_id=${manager_id}
            WHERE id =${team_id} AND admin_id =${admin_id}
           `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteTeam(team_id, admin_id) {
        try {
            return await mySql.query(`
             DELETE FROM teams WHERE id =${team_id} AND admin_id=${admin_id}
           `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async addUsersTeam(user_id_list) {
        try {
            return await mySql.query(`
            INSERT INTO users_to_teams (user_id,team_id,manager_id,admin_id ,role)
            VALUES ?`, [user_id_list]);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkUsesTeam(team_id, user_ids) {
        try {
            return await mySql.query(`
            SELECT u.id as user_id,name ,u.admin_id,u.location_id,u.department_id FROM users_to_teams ut
            INNER JOIN users u on u.id=ut.user_id
            WHERE ut.user_id IN (${user_ids}) AND ut.team_id=${team_id}
           `);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getTeamUser(team_id, admin_id, manager_id, is_manager, is_team_id) {
        try {
            return await mySql.query(`
            SELECT ut.id,ut.user_id,ut.status ,ut.reason,u.name AS user_name ,t.name AS team_name,ut.team_id ,ut.role,t.created_at
            FROM users_to_teams ut 
            LEFT JOIN users u ON u.id=ut.user_id
            LEFT JOIN teams t ON t.id=ut.team_id
            WHERE ut.admin_id=${admin_id}
            AND (if (${is_team_id},(ut.team_id=${team_id}),(ut.team_id IN (SELECT team_id FROM users_to_teams WHERE ut.admin_id =${admin_id} ))))
            AND (if (${is_manager},(ut.manager_id=${manager_id}),(ut.id IN (SELECT id FROM users_to_teams WHERE ut.admin_id =${admin_id} ))))
           `);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getTeamUserFromTeam(team_id, user_ids) {
        try {
            return await mySql.query(`
          SELECT * FROM users_to_teams WHERE team_id=${team_id} AND user_id IN (${user_ids})
       `);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async deleteUsesFromTeam(team_id, user_ids) {
        try {
            return await mySql.query(`
            DELETE FROM  users_to_teams WHERE team_id =${team_id} AND user_id IN (${user_ids})
            `);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateUsersTeam(team_id, user_id, reason, status, admin_id, role_id) {
        try {
            return await mySql.query(`
            UPDATE users_to_teams SET reason ='${reason}',status =${status}  ,role=${role_id}
            WHERE team_id =${team_id} AND user_id = ${user_id} AND admin_id=${admin_id}
            `);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async getSingleUser(user_id, team_id, admin_id) {
        try {
            return await mySql.query(`
            SELECT * FROM users_to_teams
            WHERE team_id =${team_id} AND user_id = ${user_id}  AND admin_id=${admin_id}
        `);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkProject(project_id, admin_id) {
        try {
            return await mySql.query(`
            SELECT * FROM project
            WHERE id =${project_id} AND admin_id=${admin_id}
        `);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkTeamToProject(team_id, project_id, admin_id) {
        try {
            return await mySql.query(`
            SELECT * FROM team_to_project
            WHERE project_id =${project_id} AND admin_id=${admin_id} AND team_id IN (${team_id})
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async addTeamToProject(team_id_list) {
        try {
            return await mySql.query(`
            INSERT INTO team_to_project (team_id,project_id, manager_id, admin_id)
            VALUES ?`, [team_id_list]);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkTeam(team_ids, admin_id) {
        try {
            return await mySql.query(`
              SELECT * FROM teams WHERE id IN (${team_ids}) `
            );
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getProjectTeams(project_id, is_project, admin_id, manager_id, is_manager) {
        try {
            return await mySql.query(`
            SELECT tp.id,tp.team_id,t.name AS team_name ,tp.project_id,p.name AS project_name,  tp.admin_id,tp.manager_id ,ut.user_id,u.name AS user_name,t.status ,t.created_at,t.description  ,ut.role,ut.reason  
            FROM team_to_project tp
            LEFT JOIN project p ON p.id=tp.project_id
            LEFT JOIN teams t ON t.id=tp.team_id
            LEFT JOIN users_to_teams ut ON ut.team_id=t.id
            LEFT JOIN users u ON u.id=ut.user_id
            WHERE (if(${is_project},(tp.project_id=${project_id}),(tp.project_id IN (SELECT project_id FROM team_to_project WHERE admin_id=${admin_id}))))
            AND (if(${is_manager},(tp.manager_id=${manager_id}),(tp.id IN (SELECT id FROM team_to_project WHERE admin_id=${admin_id}))))
            AND tp.admin_id=${admin_id}
           
            
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteTeamsFromProject(team_ids, project_id, admin_id) {
        try {
            return await mySql.query(`
            DELETE FROM team_to_project WHERE team_id IN (${team_ids}) AND admin_id=${admin_id}  AND project_id=${project_id} `
            );
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getTeamByIds(team_ids) {
        try {
            return await mySql.query(`
            SELECT id ,name FROM  teams WHERE id IN (${team_ids})    
            `
            );
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    // async getTeamWithMembers (team_id, is_team_id, admin_id, is_manager, manager_id, organization_id, is_organization){

    // }
    async cheakUpdateName(name, team_id, admin_id) {
        try {
            return await mySql.query(`
        SELECT id ,name FROM teams WHERE id !=${team_id} AND name='${name}' AND  admin_id=${admin_id} 
        `
            );
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async teamMembers(project_id, admin_id) {
        try {
            return await mySql.query(`
        SELECT DISTINCT( tu.user_id),u.name AS user_name,  tp.project_id,u.department_id , d.name AS deapartment_name 
        FROM team_to_project tp
        LEFT JOIN users_to_teams tu ON tu.team_id=tp.team_id
        INNER JOIN users u ON u.id=tu.user_id
        INNER JOIN department d ON d.id=u.department_id
        WHERE tp.project_id=${project_id} AND u.admin_id=${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async projectMembers(project_id, admin_id, user_ids) {
        try {
            return await mySql.query(`
        SELECT DISTINCT(pu.user_id),u.name AS user_name , pu.project_id,u.department_id ,d.name AS department_name
        FROM  project_to_users pu
        INNER JOIN users u ON u.id=pu.user_id
        INNER JOIN department d ON d.id=u.department_id
        WHERE pu.project_id=${project_id} AND u.admin_id=${admin_id} AND  u.id NOT IN (${user_ids})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


}


module.exports = new TeamCURD;
