"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class ProjectCURD {


    async createProject(name, description, admin_id, start_date, end_date) {
        try {
            return await mySql.query(`
            INSERT INTO project (name,description,admin_id,start_date,end_date,status,actual_start_date,
                actual_end_date,progress)
            VALUES ('${name}','${description}',${admin_id},'${start_date}','${end_date}',1,'${start_date}',
                 '${end_date}',0) `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async getProjectByName(name, admin_id) {
        try {
            return await mySql.query(`
                SELECT p.* FROM project p 
                WHERE p.admin_id =${admin_id} AND p.name='${name}'
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }


    async getAllProjects(admin_id) {
        try {
            return await mySql.query(`
                 SELECT * FROM project WHERE admin_id =${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getAllProjectsManager(admin_id, manager_id) {
        try {
            return await mySql.query(`
                SELECT * FROM project WHERE admin_id =${admin_id} AND manager_id=${manager_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getAllProjectsProjectId(admin_id, project_id) {
        try {
            return await mySql.query(`
                SELECT * FROM project WHERE admin_id =${admin_id} AND id=${project_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getSingleProjects(admin_id, project_id, is_project_id, status, is_status) {
        try {
            return await mySql.query(`
                    SELECT p.id AS project_id , p.name AS project_name ,p.admin_id,p.manager_id,
                    p.start_date,p.end_date,p.actual_start_date,p.actual_end_date,p.status , p.progress,
                    p.description
                    FROM project p
                    WHERE  
                    (if (${is_project_id},(p.id=${project_id}),(p.id in (SELECT id FROM project WHERE admin_id =${admin_id} ))))
                    AND  (IF (${is_status},(p.status=${status}),(p.id in (SELECT id FROM project WHERE admin_id =${admin_id}))))
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteProject(admin_id, project_id) {
        try {
            return await mySql.query(`
                  DELETE FROM project  WHERE id =${project_id} AND admin_id =${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }

    }

    async updateProject(project_id, name, description, manager_id, start_date, end_date, status, progress, admin_id) {
        try {
            return await mySql.query(`
                UPDATE project SET name = '${name}', status = ${status} ,description='${description}',
                manager_id=${manager_id},start_date='${start_date}',end_date='${end_date}',progress=${progress}
                WHERE id =${project_id} AND admin_id =${admin_id}
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkModule(name, project_id) {
        try {
            return await mySql.query(`
                SELECT * FROM project_list 
                WHERE name ='${name}' AND project_id =${project_id}
         `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async createProjectModule(project_id, name, start_date, end_date) {
        try {
            return await mySql.query(`
                 INSERT INTO project_list (name,project_id, type,start_date,end_date)
                 VALUES('${name}',${project_id},3,'${start_date}','${end_date}')
     `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async getProjectIdsForModules(project_id, admin_id, is_project, manager_id, is_manager) {
        try {
            return await mySql.query(`
                 SELECT p.id AS project_id 
                 FROM project p 
                 WHERE (if (${is_project} ,(p.id=${project_id} AND p.admin_id =${admin_id}),(p.id IN (SELECT id FROM project WHERE admin_id=${admin_id}))) )
                 AND (if (${is_manager} ,(p.manager_id=${manager_id} AND p.admin_id =${admin_id}),(p.id IN (SELECT id FROM project WHERE admin_id=${admin_id}))) )
         `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        } ``
    }

    async getProjectModule(module_id, is_module, project_id, is_project, is_manager, manager_id, admin_id, status, is_status) {
        try {
            return await mySql.query(`
                SELECT  pl.project_id, p.name AS project_name , p.admin_id, p.manager_id ,pl.created_at,
                pl.id AS module_id,pl.name AS module_name,pl.status,pl.closed,pl.start_date,pl.end_date 
                FROM project p
                LEFT JOIN project_list pl ON pl.project_id=p.id
                WHERE p.admin_id=${admin_id} AND (IF (${is_project} , (p.id=${project_id}) ,
                 ( p.id IN (SELECT id FROM project WHERE admin_id =${admin_id}))))
                AND (IF (${is_module}  ,(pl.id=${module_id}),
                (pl.id IN (SELECT id FROM project_list WHERE (IF (${is_project} , (p.id=${project_id}) , 
                ( p.id IN (SELECT id FROM project WHERE  admin_id=${admin_id})))) )) ))
                AND (if (${is_manager} , (p.manager_id=${manager_id}),(p.id IN (SELECT id FROM project WHERE admin_id =${admin_id}))))
                AND (if(${is_status},(pl.status=${status}),  ( p.id IN (SELECT id FROM project WHERE admin_id =${admin_id}))))
                     `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async updateProjectModule(module_id, name, status, start_date, end_date) {
        try {
            return await mySql.query(`
                UPDATE project_list SET name ='${name}' ,status =${status} , start_date ='${start_date}', end_date ='${end_date}'
                WHERE  id = ${module_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getSingleModule(module_id, admim_id) {
        try {
            return await mySql.query(`
                SELECT pl.project_id,p.name AS project_name ,p.admin_id,p.manager_id,pl.id AS module_id,p.start_date AS project_start_date,p.end_date AS project_end_date,
                pl.name AS module_name,pl.created_at,
                pl.status,pl.closed,pl.start_date,pl.end_date
                FROM project_list pl
                INNER JOIN project p ON p.id =pl.project_id
            
                WHERE p.admin_id  =${admim_id} AND pl.id = ${module_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteProjectModule(module_ids) {
        try {
            return await mySql.query(`
                 DELETE FROM project_list 
                 WHERE  id IN (${module_ids})
        `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkProjectName(name, admin_id, project_id) {
        try {
            return await mySql.query(`
           SELECT * FROM project  WHERE name ='${name}' AND id !=${project_id} AND  admin_id=${admin_id}
      `)
        } catch (err) {
            return null;
        }
    }


    async addMembersToProject(members_list) {
        try {
            return await mySql.query(`
           INSERT INTO project_to_users (admin_id,user_id, project_id)
           VALUES ?`, [members_list]);

        } catch (err) {
            return null;
        }
    }

    async getMembersToProject(user_ids) {
        try {
            return await mySql.query(`
            SELECT id ,name  FROM users WHERE id IN (${user_ids})
          `);

        } catch (err) {
            return null;
        }
    }


    async getProjctTeams(is_project, project_id, admin_id) {

        try {
            return await mySql.query(`
              SELECT tp.id,tp.team_id,tp.project_id,t.name
              FROM team_to_project tp
              INNER JOIN teams t ON t.id=tp.team_id
              INNER JOIN  project p ON p.id=tp.project_id
              WHERE (IF (${is_project},(p.id=${project_id}),(p.id IN (SELECT id FROM project WHERE admin_id=${admin_id})))) 
             
              `)

        } catch (err) {
            return null;
        }
    }

    async getProjctMembers(is_project, project_id, admin_id) {
        try {
            return await mySql.query(`
        SELECT ps.id,ps.project_id,ps.user_id,u.name AS user_name,ps.role_id
        FROM project_to_users ps
        INNER JOIN users u ON  u.id =ps.user_id
        INNER JOIN  project p ON p.id=ps.project_id
        WHERE (IF (${is_project},(p.id=${project_id}),(p.id IN (SELECT id FROM project WHERE admin_id=${admin_id})))) 
        `)

        } catch (err) {
            return null;
        }
    }

    async getProjectModuleById(module_id) {
        try {
            return await mySql.query(`
            SELECT  pl.project_id, p.name AS project_name , p.admin_id, p.manager_id ,p.integration_org_id AS organization_id ,
            pl.id AS module_id,pl.name AS module_name,pl.status,pl.closed,pl.start_date,pl.end_date ,pl.created_at
            FROM project p
            LEFT JOIN project_list pl ON pl.project_id=p.id
            WHERE  pl.id=${module_id}
                `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async addManagerToProject(manager_list) {
        try {
            return await mySql.query(`   
        INSERT INTO project_to_users (admin_id,user_id, project_id,role_id)
        VALUES ?`, [manager_list]);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkModuleName(module_id, name, project_id) {
        try {
            return await mySql.query(`   
        SELECT * FROM project_list WHERE name ='${name}' AND id !=${module_id} AND project_id= ${project_id} 
    `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getMembersByUser(member_ids, project_id) {
        try {
            return await mySql.query(`   
        SELECT ps.id,ps.project_id,ps.user_id,u.name AS user_name,ps.role_id
        FROM project_to_users ps
        INNER JOIN users u ON  u.id =ps.user_id
        INNER JOIN  project p ON p.id=ps.project_id
        WHERE  p.id=${project_id} AND user_id IN (${member_ids})
    `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteProjectMember(member_ids, project_id, admin_id) {
        try {
            return await mySql.query(`   
        DELETE FROM project_to_users
        WHERE project_id=${project_id} AND user_id IN (${member_ids}) AND admin_id=${admin_id}
    `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async updateProjectMember(admin_id, project_id, member_id, role_id) {
        try {
            return await mySql.query(`   
        UPDATE project_to_users  SET role_id=${role_id}
        WHERE project_id=${project_id} AND user_id =${member_id} AND admin_id=${admin_id}
    `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

}
module.exports = new ProjectCURD;


