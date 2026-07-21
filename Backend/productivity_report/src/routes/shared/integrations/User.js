const mySql = require('../../../database/MySqlConnection').getInstance();
const Logger = require('../../../Logger').logger;

class User {
    async userBymail(email) {
        try {
            return await mySql.query(`
                SELECT u.id 
                FROM users u  
                WHERE u.email='${email}'
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getLocationByName(name, admin_id) {
        try {
            return await mySql.query(`
                SELECT id,name
                FROM location
                WHERE name='${name}' AND admin_id=${admin_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async addLocation(name, admin_id) {
        try {
            return await mySql.query(`
                INSERT INTO location(name,admin_id)
                VALUES ('${name}',${admin_id})
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async getDepartmentByName(admin_id, name) {
        try {
            return await mySql.query(
                `SELECT * FROM department WHERE name='${name}' AND admin_id=${admin_id}`
            );
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
    async createDepartment(admin_id, name) {
        try {
            return await mySql.query(`
                INSERT INTO department (name, short_name,admin_id)
                VALUES ('${name}','${name}',${admin_id})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async registerUser(name, full_name, email, password, remember_token, phone, emp_code, location_id, department_id, photo_path, address, role_id, status, admin_id, user_type, ext_user_id) {
        try {
            return await mySql.query(`
                INSERT INTO users (name,full_name,email  ,password,remember_token,phone,emp_code,location_id ,department_id ,photo_path,address,role_id,status,admin_id,user_type,ext_user_id)
                VALUES ('${name}', '${full_name}', '${email}',  '${password}', ${remember_token},'${phone}','${emp_code}',${location_id},${department_id},'${photo_path}','${address}',${role_id},${status},${admin_id},${user_type},'${ext_user_id}')
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkPortalUser(user_id, admin_id) {
        try {
            return await mySql.query(`
                SELECT * 
                FROM portal_users
                WHERE user_id=${user_id} AND admin_id=${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async registerPortalUser(admin_id, user_id, ext_org_id, ext_user_id) {
        try {
            return await mySql.query(`
                INSERT INTO portal_users (admin_id,user_id,ext_org_id,ext_user_id)
                VALUES (${admin_id},${user_id},'${ext_org_id}','${ext_user_id}')
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getPortalUserByExtId(ext_user_id, admin_id) {
        try {
            return await mySql.query(`
                SELECT * 
                FROM portal_users
                WHERE ext_user_id='${ext_user_id}' AND admin_id=${admin_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async getUserByExtId(ext_user_id, admin_id, project_id) {
        try {
            return await mySql.query(`
                SELECT user_id 
                FROM project_to_users
                WHERE ext_user_id='${ext_user_id}' AND admin_id=${admin_id} AND project_id=${project_id}
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async portalUser(admin_id, ext_user_ids) {
        try {
            return await mySql.query(`
                SELECT * 
                FROM portal_users
                WHERE admin_id=${admin_id} AND ext_user_id IN(${ext_user_ids})
            `);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async checkUserExistsInProject(admin_id, user_id, project_id) {
        try {
            return await mySql.query(`
                SELECT id
                FROM project_to_users
                WHERE admin_id=${admin_id} AND user_id=${user_id} AND project_id=${project_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async addUserToProject(admin_id, user_id, project_id, ext_project_id, ext_user_id) {
        try {
            return await mySql.query(`
                INSERT INTO project_to_users(admin_id,user_id, project_id,ext_project_id,ext_user_id)
                VALUES(${admin_id},${user_id}, ${project_id},'${ext_project_id}','${ext_user_id}')
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async deleteUserFromProject(admin_id, user_id, project_id) {
        return await mySql.query(`
                DELETE FROM project_to_users
                WHERE admin_id=${admin_id} AND project_id=${project_id} AND user_id=${user_id}
            `);
    }

    async getUserByExtID(ext_user_id, project_id) {
        try {
            return await mySql.query(`
                SELECT *
                FROM project_to_users
                WHERE ext_user_id='${ext_user_id}' AND project_id=${project_id}
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    async taskToUser(user_id, project_todo_id, ext_project_todo_id, ext_user_id) {
        try {
            return await mySql.query(`
                    INSERT INTO project_todo_to_users (user_id, project_todo_id,ext_project_todo_id, ext_user_id)
                    VALUES (${user_id}, ${project_todo_id},'${ext_project_todo_id}', '${ext_user_id}')
                    ON DUPLICATE KEY UPDATE
                    id = LAST_INSERT_ID(id),
                    user_id = ${user_id},
                    project_todo_id = ${project_todo_id},
                    ext_project_todo_id = "${ext_project_todo_id}",
                    ext_user_id = "${ext_user_id}"
                `);
        } catch (err) {
            console.log('==============', err);
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }
}

module.exports = new User;