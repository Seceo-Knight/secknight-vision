const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;

class DepartmentCRUD {


    /**
     * Add departments details 
     *
     * @function createDepartment
     * @memberof DepartmentCURD
     * @param {string} name
     * @param {string} short_name
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async createDepartment(admin_id, name, short_name, cb) {
        try {
            let department = await mySql.query(
                `INSERT INTO department (name, short_name,admin_id)
                   VALUES ('${name}','${short_name}',${admin_id})`
            );
            cb(null, department);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get department by name
     *
     * @function getDepartmentByName
     * @memberof DepartmentCURD
     * @param {string} name
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async getDepartmentByName(admin_id, name, cb) {
        try {
            let department = await mySql.query(
                `SELECT * FROM department WHERE name='${name}' AND admin_id=${admin_id}`
            );
            cb(null, department);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     * Get department details
     *
     * @function retrieveDepartment
     * @memberof DepartmentCURD
     * @param {number} skip
     * @param {number} limit
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async retrieveDepartment(skip, limit, admin_id, cb) {
        try {
            let department = await mySql.query(
                `SELECT id,name,short_name FROM department 
                WHERE admin_id=${admin_id}
                LIMIT ${skip}, ${limit}`
            );
            cb(null, department);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *  Get department by name
     *
     * @function get_department_by_name
     * @memberof DepartmentCURD
     * @param {string} name
     * @param {number} department_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async get_department_by_name(name, department_id, admin_id, cb) {
        try {
            let department = await mySql.query(`
                    SELECT name FROM department WHERE name='${name}' AND id !='${department_id}'  AND admin_id=${admin_id}
                `);
            cb(null, department);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *  Update department details *
     *
     * @function updateDepartment
     * @memberof DepartmentCURD
     * @param {string} name
     *  @param {string} short_name
     * @param {number} department_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async updateDepartment(name, short_name, department_id, cb) {
        try {
            let department = await mySql.query(
                `UPDATE department
                SET name = '${name}', short_name= '${short_name}'
                WHERE id = ${department_id}`
            );
            cb(null, department);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    /**
     *  Delete department already exists 
     *
     * @function deleteDepartment
     * @memberof DepartmentCURD
     * @param {number} department_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async deleteDepartment(department_id, admin_id, cb) {
        try {
            let department = await mySql.query(`
                DELETE FROM department 
                WHERE id=${department_id} AND admin_id=${admin_id}
            `);
            cb(null, department);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }
    /**
     *  Check user department  
     *
     * @function checkDeptaptmetUser
     * @memberof DepartmentCURD
     * @param {number} department_id
     * @param {*} cb
     * @returns {Object} - Data or Error.
     */
    async checkDeptaptmetUser(department_id, admin_id, cb) {
        try {
            let user = await mySql.query(`
                SELECT u.id 
                FROM users u
                INNER JOIN department d ON d.id =u.department_id
                WHERE d.id=${department_id} AND u.admin_id=${admin_id}
                `);
            cb(null, user);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            cb(err, null);
        }
    }

    async createDept(admin_id, name, short_name) {
        return await mySql.query(`
            INSERT INTO department (name, short_name,admin_id)
            VALUES ('${name}','${short_name}',${admin_id})
        `);
    }

}

module.exports = new DepartmentCRUD;