'use strict';

const mySql = require('../../../database/MySqlConnection').getInstance();
const moment = require('moment-timezone');
const { AnnouncemntsModel } = require('../../../models/announcements.schema');

class AuthModel {
    constructor() {
        this.userTable = 'users';
        this.employeeTable = 'employees';
        this.organizationLocationTable = 'organization_locations';
        this.organizationDepartmentTable = 'organization_departments';
        this.rolesTable = 'roles';
        this.userRoleMappingTable = 'user_role';
        this.organizationSettingTable = 'organization_settings';
        this.organizationTable = 'organizations';
        this.organizationShiftTable = 'organization_shifts';
    }

    getUserDetails(userData) {
        const { email, noAlterEmailCheck = false } = userData;

        let query = `
        SELECT
        u.id as user_id, u.first_name, u.last_name, u.email, u.password, u.status, u.a_email,e.system_type, u.username,
        e.id as id, e.id as employee_id, e.timezone, e.custom_tracking_rule, e.location_id, e.organization_id, e.organization_id as admin_id,
        JSON_EXTRACT(os.rules,'$.logoutOptions') as logoutOptions,s.data AS shift,JSON_EXTRACT(os.rules,'$.pack') as pack,
        ol.name as location_name, e.department_id, od.name as department_name,r.name as role, ur.role_id,o.language,o.weekday_start,
        JSON_EXTRACT(os.rules,'$.productiveHours') as productive_hours,u.photo_path, u.active_directory_meta, e.software_version,
        JSON_EXTRACT(os.rules,'$.productivityCategory') as productivityCategory,
        e.room_id, o.logo
        FROM ${this.userTable} as u
        LEFT JOIN ${this.employeeTable} as e ON e.user_id = u.id
        LEFT JOIN ${this.organizationLocationTable} as ol ON ol.id = e.location_id
        LEFT JOIN ${this.organizationDepartmentTable} as od ON od.id = e.department_id
        JOIN ${this.userRoleMappingTable} as ur ON ur.user_id = e.user_id
        JOIN ${this.rolesTable} as r ON r.id = ur.role_id
        LEFT JOIN ${this.organizationSettingTable} AS os ON os.organization_id = e.organization_id
        JOIN ${this.organizationTable} as o ON o.id =e.organization_id
        LEFT JOIN ${this.organizationShiftTable} as s ON s.id =e.shift_id
        `;

        if(noAlterEmailCheck) query += `
            WHERE (u.email = ?)
            AND e.is_mobile = 0;
        `;
        else query += `
            WHERE (u.a_email = ? OR u.email = ?)
            AND e.is_mobile = 0;
        `;

        if (process.env.MYSQL_TIMEOUT === 'true' && noAlterEmailCheck) {
            return mySql.query({ sql: query, values: [email], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }
        else if (process.env.MYSQL_TIMEOUT === 'true' && noAlterEmailCheck == false) {
            return mySql.query({ sql: query, values: [email, email], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }
        else if(noAlterEmailCheck) {
            return mySql.query(query, [email, email]);
        }
        return mySql.query(query, [email, email]);

    }

    getUserDetailsFromUsers(userData) {
        const { email, noAlterEmailCheck = false } = userData;
        let query = `
            SELECT u.first_name, u.last_name, u.email
            FROM users u 
            WHERE u.email = ? 
        `;
        if(!noAlterEmailCheck) query += `OR u.a_email = ?;`

        if(noAlterEmailCheck) {
            if (process.env.MYSQL_TIMEOUT === 'true') {
                return mySql.query({ sql: query, values: [email], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
            }
            return mySql.query(query, [email]);
        }

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, values: [email, email], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }
        return mySql.query(query, [email, email]);
    }

    deleteUserDetailsFromUsers(userData) {
        const { email } = userData;
        const query = `
            DELETE FROM users u
            WHERE u.a_email = ? OR u.email = ?;
        `;
        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, values: [email, email], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }
        return mySql.query(query, [email, email]);
    }

    deletedUserDetails (userData) {
        const { email } = userData;
        const query = `
            SELECT * FROM removed_users ru
            WHERE ru.email = ?;
        `;
        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, values: [email], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }
        return mySql.query(query, [email]);
    }


    getUserDetailsById(id) {
        const query = `
            SELECT
                u.id as user_id, u.first_name, u.last_name, u.email, u.password, u.status, u.a_email,e.system_type,
                e.id as id, e.id as employee_id, e.timezone, e.custom_tracking_rule, e.location_id, e.organization_id, e.organization_id as admin_id,
                JSON_EXTRACT(os.rules,'$.logoutOptions') as logoutOptions,s.data AS shift,JSON_EXTRACT(os.rules,'$.pack') as pack,
                ol.name as location_name, e.department_id, od.name as department_name,r.name as role, ur.role_id,o.language,o.weekday_start,
                JSON_EXTRACT(os.rules,'$.productiveHours') as productive_hours,u.photo_path, u.active_directory_meta, e.software_version,
                JSON_EXTRACT(os.rules,'$.productivityCategory') as productivityCategory,
                e.room_id, o.logo
            FROM ${this.userTable} as u
            LEFT JOIN ${this.employeeTable} as e ON e.user_id = u.id
            LEFT JOIN ${this.organizationLocationTable} as ol ON ol.id = e.location_id
            LEFT JOIN ${this.organizationDepartmentTable} as od ON od.id = e.department_id
            JOIN ${this.userRoleMappingTable} as ur ON ur.user_id = e.user_id
            JOIN ${this.rolesTable} as r ON r.id = ur.role_id
            LEFT JOIN ${this.organizationSettingTable} AS os ON os.organization_id = e.organization_id
            JOIN ${this.organizationTable} as o ON o.id =e.organization_id
            LEFT JOIN ${this.organizationShiftTable} as s ON s.id =e.shift_id
            WHERE u.id = ?;
        `;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, values: [id], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return mySql.query(query, [id]);
    }

    /**
     * Registers the user 
     *
     * @function insertUserDetails
     * @memberof AuthModel
     * @param {object} userData
     * @return {Promise<Object>} with inserted data columns or Error.
     */
    insertUserDetails(userData) {
        userData.domain = userData.domain ? userData.domain : null
        userData.a_email = userData.a_email ? userData.a_email : null
        userData.activeDirectoryMeta = userData.activeDirectoryMeta ? JSON.stringify(userData.activeDirectoryMeta) : null
        let values = [
            userData.first_name,
            userData.last_name,
            userData.email, null,
            userData.contact_number,
            userData.date_join,
            userData.address,
            '/default/profilePic/user.png',
            userData.isActiveDirectory,
            userData.domain,
            userData.username,
            userData.computerName,
            userData.a_email,
            userData.activeDirectoryMeta,
            userData.macId
        ]
        const query = `INSERT INTO ${this.userTable} (first_name,last_name,email,password,contact_number,date_join,address,photo_path,is_active_directory,domain,username,computer_name,a_email,active_directory_meta,mac_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        if (process.env.MYSQL_TIMEOUT === 'true') return mySql.query({ sql: query, values, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });

        return mySql.query(query, values);
    }

    getEmployeeRole(role, organisationId) {
        const query = `SELECT id FROM ${this.rolesTable} WHERE name = '${role}' AND organization_id = ${organisationId};`;
        return mySql.query(query);
    }

    createEmployeeRole(organisationId) {
        const query = `INSERT INTO ${this.rolesTable} (name, organization_id, type) VALUES ('employee',${organisationId},0);`;
        return mySql.query(query);
    }

    createEmploye(userId, organisationId, location_id, department_id, rules, timezone, username) {
        const query = `INSERT INTO ${this.employeeTable} (user_id,organization_id,emp_code,timezone,custom_tracking_rule,department_id,location_id,system_type) VALUES 
            (?,?,?,?,?,?,?,?);`
        return mySql.query(query, [userId, organisationId, username ? username : '', timezone, rules, department_id, location_id, '0']);
    }

    createUserRoleMapping(userId, roleId, organisationId) {
        const query = `INSERT INTO ${this.userRoleMappingTable} (user_id, role_id, created_by) VALUES (?,?,?);`;
        return mySql.query(query, [userId, roleId, organisationId]);
    }
    getDefaultLocationAndDepartment(organisationId) {
        // const query = `SELECT o.user_id as organization_user_id, ol.id as location_id,od.id as department_id,os.rules,o.timezone  FROM organization_locations as ol 
        // JOIN organization_departments as od ON ol.organization_id = od.organization_id
        // JOIN organization_settings as os ON os.organization_id = od.organization_id
        // JOIN organizations as o ON o.id = ol.organization_id
        // WHERE od.organization_id = ${organisationId} ORDER BY ol.created_at LIMIT 1`;
        const query = `
        SELECT 
            o.user_id as organization_user_id,odlr.location_id, odlr.department_id, 
            os.rules, o.timezone,o.total_allowed_user_count, o.current_user_count AS current_total_count
        FROM organization_department_location_relation as odlr
        JOIN organization_departments AS od ON od.id = odlr.department_id
        JOIN organization_locations AS ol ON ol.id = odlr.location_id
        JOIN organizations AS o ON o.id = ?
        JOIN organization_settings as os ON os.organization_id = ?
        WHERE od.organization_id = ? LIMIT 1`;
        return mySql.query(query, [organisationId, organisationId, organisationId]);
    }

    employeeCount(organization_id) {
        const query = `SELECT count(e.id) as count
                    FROM employees e
                    WHERE e.organization_id = ?;`;

        return mySql.query(query), [organization_id];
    }

    userPermission(role_id, organization_id) {
        const query = `
        SELECT p.id as permission_id, p.name as permission, p.type  
            FROM permission_role pr
            JOIN permissions p ON p.id = pr.permission_id
            WHERE pr.role_id = ? AND organization_id =? ;
        `;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, values: [role_id, organization_id], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return mySql.query(query, [role_id, organization_id]);
    }
    async getLocation(location, organisationId) {
        try {
            const query = `SELECT id,name
                        FROM organization_locations
                        WHERE name = ? AND organization_id = ?`;

            const [locationData] = await mySql.query(query, [location, organisationId]);
            if (locationData) return locationData.id;

            const createQuery = `INSERT INTO organization_locations (name,organization_id)
                                VALUES (?,?)`

            const locationCreated = await mySql.query(createQuery, [location, organisationId]);
            return locationCreated.insertId;
        } catch (err) {
            throw err;
        }
    }

    async getDepartment(department, organisationId) {
        try {
            const query = `SELECT id,name
                    FROM organization_departments
                     WHERE name= ? AND organization_id = ? `;

            const [departmentData] = await mySql.query(query, [department, organisationId]);

            if (departmentData) return departmentData.id;

            const createQuery = `INSERT INTO organization_departments (name,organization_id)
                                VALUES ( ? , ? )`

            const deptCreated = await mySql.query(createQuery, [department, organisationId]);
            return deptCreated.insertId;
        } catch (err) {
            throw err;
        }
    }

    async locationToDeptRelation(location_id, department_id) {
        const query = `SELECT location_id,department_id
                    FROM organization_department_location_relation
                    WHERE location_id=? AND department_id=?`

        const [locationWithDept] = await mySql.query(query, [location_id, department_id]);
        if (locationWithDept) return;

        const createQuery = `INSERT INTO organization_department_location_relation (location_id,department_id)
                            VALUES (?,?)`;

        return mySql.query(createQuery, [location_id, department_id]);
    }
    updateEmployeeData(employee_id, department_id, location_id, room_id) {
        let update = '';
        let values = [];
        if (department_id) {
            update += `department_id = ?`;
            values.push(department_id);
        }
        if (location_id) {
            update += update ? `, location_id=?` : `location_id=?`;
            values.push(location_id);
        }
        if (room_id) {
            update += update ? `, room_id=?` : `room_id=?`;
            values.push(room_id);
        }

        if (!update) {
            return Promise.resolve()
        }
        values.push(employee_id)
        const query = `
            UPDATE employees
            SET ${update}
            WHERE id = ?
        `;

        return mySql.query(query, values);
    }

    updateUserData({ user_id, first_name, last_name, address, contact_number, activeDirectoryMeta, computer_name }) {
        let update = '';
        let values = [];
        if (activeDirectoryMeta) {
            update += 'active_directory_meta = ?';
            values.push(JSON.stringify(activeDirectoryMeta))
        }
        if (first_name) {
            update += update ? `, first_name = ?` : `first_name = ?`;
            values.push(first_name);
        }
        if (last_name) {
            update += update ? `, last_name= ? ` : `last_name = ?`;
            values.push(last_name);
        }
        if (address) {
            update += update ? `, address= ? ` : `address= ? `;
            values.push(address.replace(/'/g, "''").replace(/"/g, '""'));
        }
        if (contact_number) {
            update += update ? `, contact_number = ? ` : `contact_number = ? `;
            values.push(contact_number);
        }
        if (computer_name) {
            update += update ? `, computer_name = ? ` : `computer_name = ? `;
            values.push(computer_name);
        }
        if (!update) {
            return Promise.resolve()
        }
        const query = `UPDATE users 
                    SET ${update}
                    WHERE id =${user_id}`;
        return mySql.query(query, values);
    }

    employeeWithEmpCode({ empCode, organizationId, computerName, username }) {
        let condition = `e.organization_id = ?`;
        let values = [organizationId,];
        if (empCode) {
            condition += ` AND e.emp_code= ? `;
            values.push(empCode);
        }
        if (username) {
            condition += ` AND u.username= ? `;
            values.push(username);
        }
        if (computerName) {
            condition += ` AND u.computer_name=?`;
            values.push(computerName);

        }

        const query = `
                    SELECT e.id as employee_id, u.id as user_id, u.computer_name, u.email, e.emp_code, u.username, u.active_directory_meta
                    FROM employees e
                    JOIN users u ON u.id=e.user_id
                    WHERE ${condition}
                    ORDER BY e.id;
        `;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, values: values, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return mySql.query(query, values);
    }

    updateaAdminProperties({ organization_id, current_user_count }) {
        let update = '';
        let values = [];
        if (current_user_count) {
            update += update ? `, current_user_count=?}` : `current_user_count=?`;
            values.push(current_user_count);
        }
        values.push(organization_id);
        if (!update) {
            return Promise.resolve()
        }
        const query = `
                    UPDATE ${this.organizationTable}
                    SET ${update}
                    WHERE id = ?;`;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, values: values, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }
        return mySql.query(query, values);
    }

    /**
     * Get user details by name.
     *
     * @function getUserByFullName
     * @memberof AuthModel
     * @param {string} name
     * @param {number} organisationId
     * @returns {array} -  promise.
     **/
    getUserByFullName({ name, organizationId }) {
        const query = `SELECT u.id AS user_id, e.id AS employee_id, r.name, r.id AS role_id,e.organization_id
                    FROM users u
                    JOIN employees e ON e.user_id=u.id
                    JOIN user_role ur ON ur.user_id=u.id
                    JOIN roles r ON r.id = ur.role_id  
                    WHERE CONCAT(u.first_name, ' ', u.last_name) = ? AND r.name = 'Manager' AND e.organization_id = ?
                    LIMIT 1`;

        return mySql.query(query, [name, organizationId]);
    }

    /**
    * Get user details by name.
    *
    * @function assignUser
    * @memberof AuthModel
    * @param {number} employeeId
    * @param {number} managerId
    * @param {number} roleId
    * @returns {array} -  promise.
    **/
    assignUser({ employeeId, managerId, roleId }) {
        let query = `INSERT INTO assigned_employees (employee_id,to_assigned_id,role_id)
                    VALUES ( ? , ? , ?)`;

        return mySql.query(query, [employeeId, managerId, roleId]);
    }

    checkAssignedUser({ employeeId, managerId, roleId }) {
        const query = `
                    SELECT e.id, u.first_name,u.last_name,e.id AS user_id,u.status
                    FROM assigned_employees a
                    INNER JOIN employees e ON e.id=a.employee_id
                    INNER JOIN users u ON u.id=e.user_id
                    WHERE employee_id IN (?) AND to_assigned_id =? AND role_id=?
                     `;
        return mySql.query(query, [employeeId, managerId, roleId]);
    }

    unassignUser({ employeeId, managerId, roleId }) {
        const query = ` DELETE from assigned_employees
                    WHERE employee_id = ? AND to_assigned_id = ? AND role_id = ? `;

        return mySql.query(query, [employeeId, managerId, roleId]);
    }

    getUserIdWithEmail(email) {
        let query = `SELECT id, email FROM users WHERE email = "${email}" OR a_email = "${email}";`;
        return mySql.query(query);
    }

    updateUserStatus (user_id) {
        const query = ` UPDATE users SET status = ? WHERE id = ?`;
        return mySql.query(query, [1, user_id]);
    }

    updateAlterEmail(email, id) {
        let query = `UPDATE users SET a_email = ? WHERE id = ?`;
        return mySql.query(query, [email, id]);
    }


    storageDetails(organizationId) {
        let query = `SELECT opc.creds, p.short_code FROM organization_providers op
            JOIN providers p ON p.id = op.provider_id
            JOIN organization_provider_credentials opc ON op.id = opc.org_provider_id
            WHERE op.organization_id = ? AND opc.status =1
        `;
        return mySql.query(query, [organizationId]);
    }


    async getUserByMacIdOrganization({ macId, organizationId }) {
        const query = `
            SELECT u.id as user_id, e.id as employee_id, u.email, u.a_email as a_email, u.first_name, u.last_name, u.username
            FROM users u
            JOIN employees e ON e.user_id = u.id
            WHERE u.email LIKE '%${macId}%' AND e.organization_id = ${organizationId};
        `;
        return mySql.query(query, [organizationId]);
    }
    
}

module.exports = new AuthModel;