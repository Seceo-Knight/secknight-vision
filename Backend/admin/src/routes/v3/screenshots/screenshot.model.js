const mySql = require('../../../database/MySqlConnection').getInstance();
const Logger = require('../../../logger/Logger').logger;

class ScreenshotModel {
    async getEmployee(columns, condition) {
        let query = `SELECT ${columns}
                    FROM employees
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async updateEmployee(values, condition) {
        let query = `UPDATE employees
                    SET ${values}
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async getEmployeefullDetails(condition) {
        let query = `SELECT e.id ,e.department_id,e.location_id,e.tracking_rule_type,
                    e.custom_tracking_rule,od.name AS department_name,u.first_name,u.first_name as name,u.last_name,u.a_email as email,u.contact_number as phone,
                    u.date_join,u.status,ol.name AS location_name,e.timezone,u.password,e.emp_code,CONCAT(u.first_name, ' ',u.last_name) AS full_name,
                    ur.role_id,r.name as role_name,u.photo_path,u.address,e.software_version
                    FROM employees e
                    JOIN organization_departments od ON e.department_id=od.id
                    JOIN organization_locations ol ON e.location_id=ol.id
                    JOIN users u ON e.user_id=u.id
                    JOIN user_role ur ON ur.user_id=e.user_id
                    JOIN roles r ON ur.role_id=r.id
                    WHERE ${condition}`

        return mySql.query(query);
    }
    // async getEmployeefullDetails(condition) {
    //     let query = `SELECT u.id AS employee_id,u.department_id,u.location_id,u.tracking_rule_type,
    //                 u.custom_tracking_rule,d.name AS department_name,u.name AS first_name,u.full_name AS last_name,u.email,u.phone AS contact_number,
    //                 u.date_join,u.status,l.name AS location_name,u.timezone
    //                 FROM users u
    //                 JOIN department d ON u.department_id=d.id
    //                 JOIN location l ON u.location_id=l.id
    //                 WHERE ${condition}`

    //     return mySql.query(query);
    // }
    async getUser(columns, condition) {
        let query = `SELECT ${columns}
                    FROM users
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async userRegister(first_name, last_name, email, password, contact_number, date_join, address, photo_path, status) {
        let query = `INSERT INTO users (first_name, last_name, email, a_email, password, contact_number, date_join, address, photo_path, status)
                    VALUES ('${first_name}', '${last_name}', '${email}','${email}', '${password}', ${contact_number},${date_join}, ${address}, '${photo_path}', ${status})`

        return mySql.query(query);
    }

    getOrganizationSeeting(organisationId) {
        const query = `SELECT os.rules,o.timezone,o.id 
                        FROM organizations as o
                        JOIN organization_settings os ON os.organization_id = o.id
                        WHERE o.id = ${organisationId}`;
        return mySql.query(query);
    }

    async addUserToEmp(user_id, organization_id, department_id, location_id, emp_code, shift_id, timezone, tracking_mode, tracking_rule_type, custom_tracking_rule) {
        let query = `INSERT INTO employees (user_id, organization_id, department_id, location_id, emp_code, shift_id, timezone, tracking_mode, tracking_rule_type, custom_tracking_rule)
                    VALUES (${user_id}, ${organization_id}, ${department_id}, ${location_id}, '${emp_code}', ${shift_id}, '${timezone}', ${tracking_mode}, ${tracking_rule_type}, '${custom_tracking_rule}')`

        return mySql.query(query);
    }

    async addRoleToUser(user_id, role_id, created_by) {
        let query = `INSERT INTO user_role (user_id, role_id, created_by)
                    VALUES (${user_id}, ${role_id}, ${created_by})`

        return mySql.query(query);
    }

    async userList(admin_id, location_id, department_id, role_id, name, skip, limit, to_assigned_id) {
        let department_ids = department_id ? "'" + department_id.split(",").join("','") + "'" : 0;
        let query
        query = `SELECT e.id As id,u.first_name,u.first_name AS name,u.last_name,u.a_email as email,u.contact_number AS phone,u.date_join,u.address,u.photo_path,u.status, e.organization_id,
                    e.location_id,ol.name AS location,e.department_id,e.emp_code,e.shift_id,e.timezone,e.tracking_mode,e.tracking_rule_type,od.name AS department,ur.role_id, JSON_EXTRACT(os.rules,'$.ideal_time') as ideal_time,
                    rn.name AS role,rn.type AS role_type, (COUNT( e.id ) OVER()) AS total_count,CONCAT(u.first_name, ' ', u.last_name) AS full_name,u.password,JSON_EXTRACT(os.rules,'$.offline_time') as offline_time,e.software_version
                    FROM employees e
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN organization_locations ol ON e.location_id=ol.id
                    INNER JOIN organization_departments od ON od.id=e.department_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    JOIN roles rn ON rn.id=ur.role_id
                    JOIN organization_settings os ON e.organization_id=os.organization_id
                    WHERE e.organization_id=${admin_id}`;

        if (location_id !== parseInt(0)) query += ` AND e.location_id = ${location_id}`;
        if (role_id !== parseInt(0)) query += ` AND ur.role_id= ${role_id}`;
        if (department_id) query += ` AND e.department_id  in(${department_ids})`;
        if (name) query += ` AND u.first_name LIKE '%${name}%'`;

        query += ` ORDER BY e.created_at DESC`;
        query += ` LIMIT ${skip},${limit};`;

        if (to_assigned_id) {
            query = `SELECT e.id As user_id,a.to_assigned_id, u.first_name,u.first_name AS name,u.last_name,u.a_email as email,u.contact_number AS phone,u.date_join,u.address,u.photo_path,u.status, e.organization_id,
                    e.location_id,ol.name AS location,e.department_id,e.emp_code,e.shift_id,e.timezone,e.tracking_mode,e.tracking_rule_type,od.name AS department,ur.role_id,JSON_EXTRACT(os.rules,'$.ideal_time') as ideal_time,
                    rn.name AS role,rn.type AS role_type, (COUNT( e.id ) OVER()) AS total_count,CONCAT(u.first_name, ' ', u.last_name) AS full_name,JSON_EXTRACT(os.rules,'$.offline_time') as offline_time,e.software_version
                    FROM assigned_employees a
                    INNER JOIN employees e ON e.id=a.employee_id
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN organization_locations ol ON e.location_id=ol.id
                    INNER JOIN organization_departments od ON od.id=e.department_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    JOIN roles rn ON rn.id=ur.role_id
                    JOIN organization_settings os ON e.organization_id=os.organization_id
                    WHERE e.organization_id=${admin_id} AND a.to_assigned_id=${to_assigned_id}`;

            if (location_id !== parseInt(0)) query += ` AND e.location_id = ${location_id}`;
            if (department_id) query += ` AND e.department_id  in(${department_ids})`;
            if (name) query += ` AND u.first_name LIKE '%${name}%'`;

            query += ` ORDER BY e.created_at DESC`;
            query += ` LIMIT ${skip},${limit};`;
        }
        return mySql.query(query);
    }

    async users(admin_id, manager_id, location_id, role_id, department_id) {
        let department_ids = department_id ? "'" + department_id.split(",").join("','") + "'" : 0;

        let query = `SELECT
                    e.id, first_name, last_name, u.a_email as email
                    FROM employees e
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    JOIN roles rn ON rn.id=ur.role_id
                    WHERE e.organization_id=${admin_id}`;

        if (location_id !== parseInt(0)) query += ` AND e.location_id = ${location_id}`;
        if (role_id !== parseInt(0)) query += ` AND ur.role_id= ${role_id}`;
        if (department_id) query += ` AND e.department_id  in(${department_ids})`;

        query += ` ORDER BY e.created_at DESC;`

        if (manager_id) {
            query = `SELECT
                    e.id, first_name, last_name, u.a_email as email
                    FROM employees e
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    INNER JOIN assigned_employees a ON a.employee_id=e.id
                    JOIN roles rn ON rn.id=ur.role_id 
                    WHERE a.to_assigned_id=${manager_id}`;

            if (location_id !== parseInt(0)) query += ` AND e.location_id = ${location_id}`;
            if (role_id !== parseInt(0)) query += ` AND ur.role_id= ${role_id}`;
            if (department_id) query += ` AND e.department_id  in(${department_ids})`;

            query += ` ORDER BY e.created_at DESC;`
        }

        return mySql.query(query);
    }

    async userInformation(userId) {
        return mySql.query(`
                SELECT
                e.id ,e.emp_code,u.date_join,u.contact_number as phone,u.address ,u.last_name,u.last_name as full_name,u.first_name,u.first_name as name,
                u.a_email as email, e.location_id ,e.department_id,u.date_join,u.photo_path,ur.role_id,u.password,e.timezone,u.status,
                u.id as temp_user_id,r.name as role_name,r.type
                FROM users u
                JOIN employees e ON e.user_id=u.id
                JOIN user_role ur ON ur.user_id=e.user_id
                JOIN roles r ON ur.role_id=r.id
                WHERE e.id = ${userId}
            `); //status 1-active  ,0-revmoved employee ,2-suspend 
    }

    async updateProfileData(id, userId, first_name, email, address, location_id, department_id, emp_code, phone, joinDate, photo_path, last_name, password, timezone) {
        let userUpdate = `UPDATE users SET first_name='${first_name}',last_name='${last_name}',photo_path='${photo_path}',a_email='${email}',
                    address='${address}',date_join =${joinDate},contact_number ='${phone}' ,password='${password}'
                    WHERE id =${id}`
        let user = await mySql.query(userUpdate);

        let query = `UPDATE employees SET 	department_id=${department_id},location_id=${location_id},emp_code='${emp_code}',
                    timezone='${timezone}'
                    WHERE id =${userId}`;

        return await mySql.query(query);
    }

    async updateRole(id, role_id) {
        let query = `UPDATE user_role 
                    SET role_id=${role_id}
                    WHERE user_id =${id}`;

        return mySql.query(query);
    }

    async deleteUsers(user_ids) {
        let query = ` DELETE FROM users 
                WHERE id IN(${user_ids})`

        return mySql.query(query);
    }

    async updateUser(values, condition) {
        let query = `UPDATE users
                    SET ${values}
                    WHERE ${condition}`;

        return mySql.query(query);
    }

    async checkLoc(columns, condition) {
        let query = `SELECT ${columns} 
                    FROM organization_locations
                    WHERE ${condition}`;

        return mySql.query(query);
    }

    async addLoc(name, admin_id) {
        let query = `INSERT INTO organization_locations (name,organization_id)
                    VALUES ('${name}',${admin_id})`

        return mySql.query(query);
    }

    async checkDept(columns, condition) {
        let query = `SELECT ${columns} 
                    FROM organization_departments
                    WHERE ${condition}`;

        return mySql.query(query);
    }

    async createDept(admin_id, name, ) {
        let query = `INSERT INTO organization_departments (name,organization_id)
                    VALUES ('${name}',${admin_id})`

        return mySql.query(query);
    }

    async getSingleLocWithDept(location_id, department_id) {
        let query = `SELECT location_id,department_id
                    FROM organization_department_location_relation
                    WHERE location_id=${location_id} AND department_id=${department_id}`

        return mySql.query(query);
    }

    async addDeptToLoc(location_id, department_id) {
        let query = `INSERT INTO organization_department_location_relation (location_id,department_id)
                VALUES (${location_id},${department_id})`;

        return mySql.query(query);
    }

    async getRoles(organization_id) {
        let query = `SELECT id,name,organization_id,type
                    FROM roles
                    WHERE status=1 AND organization_id=${organization_id}`;

        return mySql.query(query);
    }
    getLocations(organization_id) {
        let query = `SELECT id,name FROM organization_locations WHERE organization_id=?`;

        return mySql.query(query, [organization_id]);
    }
    getDepartments(organization_id) {
        let query = `SELECT id,name FROM organization_departments WHERE organization_id=?`;

        return mySql.query(query, [organization_id]);
    }
    getMultipleEmployees(emp_codes) {
        const query = `
            SELECT id AS employee_id, user_id, emp_code
            FROM employees
            WHERE emp_code IN (${emp_codes.toString()})
        `;

        return mySql.query(query)
    }

    updateEmployeeData(emp_code, department_id, location_id, timezone) {
        let update = '';
        if (department_id) update += `department_id=${department_id}`;
        if (location_id) { update += update ? `, location_id=${location_id}` : `location_id=${location_id}`; }
        if (timezone) { update += update ? `, timezone="${timezone}"` : `timezone="${timezone}"`; }

        if (!update) {
            return Promise.resolve()
        }
        const query = `
            UPDATE employees
            SET ${update}
            WHERE emp_code="${emp_code}"
        `;

        return mySql.query(query)
    }
    updateUserData(user_id, first_name, last_name, email, password, contact_number, date_join, address) {
        let update = '';
        if (first_name) update += `first_name="${first_name}"`;
        if (last_name) { update += update ? `, last_name="${last_name}"` : `last_name="${last_name}"`; }
        if (password) { update += update ? `, password="${password}"` : `password="${password}"`; }
        if (email) { update += update ? `, a_email="${email}"` : `a_email="${email}"`; }
        if (contact_number) { update += update ? `, contact_number="${contact_number}"` : `contact_number="${contact_number}"`; }
        if (date_join) { update += update ? `, date_join="${date_join}"` : `date_join="${date_join}"`; }
        if (address) { update += update ? `, address="${address}"` : `address="${address}"`; }

        const query = `
            UPDATE users
            SET ${update}
            WHERE id=${user_id}
        `;

        return mySql.query(query)
    }
    updateRoleData(user_id, role_id) {
        const query = `
            UPDATE user_role
            SET role_id=${role_id}
            WHERE user_id=${user_id}
        `;

        return mySql.query(query)
    }

    async removeAlreadyAssigned(user_id, role_id) {
        let query = `DELETE from assigned_employees
                    WHERE employee_id=${user_id} AND role_id=${role_id}`;

        return mySql.query(query);
    }
    async updateRoleType(to_assigned_id, role_id) {
        let query = `UPDATE assigned_employees
                    SET role_id = '${role_id}'
                    WHERE to_assigned_id =${to_assigned_id}`

        return await mySql.query(query);
    }

    async deleteToAssigned(to_assigned_id) {
        let query = `DELETE from assigned_employees 
                    WHERE to_assigned_id=${to_assigned_id}`

        return mySql.query(query);
    }
    async assignUser(user_id, manager_id, role_id) {
        let query = `INSERT INTO assigned_employees (employee_id,to_assigned_id,role_id)
                    VALUES (${user_id},${manager_id},${role_id})`;

        return mySql.query(query);
    }

    async checkAssignedUser(user_id, to_assigned_id, role_id) {
        return await mySql.query(`
            SELECT e.id, u.first_name,u.last_name,e.id AS user_id,u.status
            FROM assigned_employees a
            INNER JOIN employees e ON e.id=a.employee_id
            INNER JOIN users u ON u.id=e.user_id
            WHERE employee_id IN (${user_id}) AND to_assigned_id =${to_assigned_id} AND role_id=${role_id}
        `);
    }

    async getAssignedDetailsByUserId(user_id, role_id) {

        let query = `
                SELECT ae.to_assigned_id as id,u.first_name ,u.last_name,CONCAT(u.first_name,' ',u.last_name) AS full_name
                FROM assigned_employees ae
                INNER JOIN employees e ON e.id=ae.to_assigned_id
                INNER JOIN users u ON u.id=e.user_id
                WHERE ae.employee_id=${user_id} AND role_id=${role_id}`;

        return mySql.query(query);
    }

    async checkEmployeeAssigened(to_assigned_id, role_id) {
        let query = `SELECT COUNT(id) AS tolal_count 
                FROM assigned_employees 
                WHERE to_assigned_id = ${to_assigned_id} AND role_id=${role_id}`;

        return mySql.query(query);
    }

    async getEmployeeeAssigined(organization_id, to_assigned_id, department, location_id, skip, limit, name, role_id) {
        let department_ids = department ? "'" + department.split(",").join("','") + "'" : 0;

        let query = `SELECT e.id, e.id As user_id,a.to_assigned_id, u.first_name,u.first_name AS name,u.last_name,u.a_email as email,u.contact_number AS phone,u.date_join,u.address,u.photo_path,u.status, e.organization_id,
                    e.location_id,ol.name AS location,e.department_id,e.emp_code,e.shift_id,e.timezone,e.tracking_mode,e.tracking_rule_type,od.name AS department,ur.role_id,os.rules,
                    rn.name AS role,rn.type AS role_type, (COUNT( e.id ) OVER()) AS total_count,CONCAT(u.first_name, ' ', u.last_name) AS full_name,e.software_version,u.password
                    FROM assigned_employees a
                    INNER JOIN employees e ON e.id=a.employee_id
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN organization_locations ol ON e.location_id=ol.id
                    INNER JOIN organization_departments od ON od.id=e.department_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    JOIN roles rn ON rn.id=ur.role_id
                    JOIN organization_settings os ON e.organization_id=os.organization_id
                    WHERE e.organization_id=${organization_id} AND a.to_assigned_id=${to_assigned_id}`;

        if (location_id !== parseInt(0)) query += ` AND e.location_id = ${location_id}`;
        if (department) query += ` AND e.department_id  in(${department_ids})`;
        if (role_id !== parseInt(0)) query += ` AND ur.role_id=${role_id}`;
        if (name) query += ` AND u.first_name LIKE '%${name}%'`;

        query += ` ORDER BY e.created_at DESC`;
        query += ` LIMIT ${skip},${limit};`;

        return mySql.query(query);
    }

    async orgEmpCount(organization_id) {
        let query = `SELECT COUNT(id) as org_emp_count FROM employees WHERE organization_id=${organization_id}`

        return mySql.query(query);
    }

    async unassignUser(user_ids, to_assigned_id) {
        let query = ` DELETE from assigned_employees
                    WHERE employee_id IN (${user_ids}) AND to_assigned_id=${to_assigned_id}`;

        return await mySql.query(query);
    }

    async user(userId) {
        let query = `SELECT  e.id ,e.emp_code,u.date_join,u.contact_number as phone,u.address ,u.last_name as full_name,u.first_name name,e.timezone,u.email, e.location_id  ,e.department_id,u.date_join,u.photo_path
                    FROM users u
                    INNER JOIN employees e ON u.id=e.user_id
                    WHERE e.id = ${userId}`;

        return mySql.query(query);
    }



    async getStorageDetail(organization_id) {
        let query = `SELECT
                    op.provider_id AS storage_type_id ,p.name,p.short_code ,opc.id AS storage_data_id,opc.creds,op.status
                    FROM organization_providers op 
                    INNER JOIN providers p ON p.id=op.provider_id
                    INNER JOIN organization_provider_credentials opc ON opc.org_provider_id =op.id
                    WHERE op.organization_id=${organization_id} AND op.status=1`;

        return mySql.query(query);
    }

    async checkAssigened(condition) {
        let query = `SELECT COUNT(id) AS tolal_count 
                FROM assigned_employees 
                WHERE ${condition}`;

        return mySql.query(query);
    }

    async employeeAssignedTo(employee_id, role_id) {
        let query = `SELECT
                    u.first_name,u.last_name,u.a_email as email,u.photo_path,e.id as user_id
                    FROM assigned_employees as ae
                    JOIN employees e ON e.id=ae.to_assigned_id
                    JOIN users u ON u.id=e.user_id
                    WHERE ae.employee_id=${employee_id} AND ae.role_id=${role_id}`

        return mySql.query(query);
    }
}

module.exports = new ScreenshotModel;
