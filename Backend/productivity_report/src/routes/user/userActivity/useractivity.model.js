const mySql = require('../../../database/MySqlConnection').getInstance();
const Logger = require('../../../Logger').logger;

class UserActivityModel {
    async getEmployee(columns, condition) {
        let query = `SELECT ${columns}
                    FROM users
                    WHERE ${condition}`

        return mySql.query(query);
    }
    async getEmployee_new(columns, condition) {
        let query = `SELECT ${columns}
                    FROM employees
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async updateEmployee(values, condition) {
        let query = `UPDATE users
                    SET ${values}
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async updateEmployee_new(values, condition) {
        let query = `UPDATE employees
                    SET ${values}
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async getEmployeefullDetails_new(condition) {
        let query = `SELECT e.id AS employee_id,e.department_id,e.location_id,e.tracking_rule_type,
                    e.custom_tracking_rule,od.name AS department_name,u.first_name,u.last_name,u.email,u.contact_number,
                    u.date_join,u.status,ol.name AS location_name,e.timezone
                    FROM employees e
                    JOIN organization_departments od ON e.department_id=od.id
                    JOIN organization_locations ol ON e.location_id=ol.id
                    JOIN users_new u ON e.user_id=u.id
                    WHERE ${condition}`

        return mySql.query(query);
    }
    async getEmployeefullDetails(condition) {
        let query = `SELECT u.id AS employee_id,u.department_id,u.location_id,u.tracking_rule_type,
                    u.custom_tracking_rule,d.name AS department_name,u.name AS first_name,u.full_name AS last_name,u.email,u.phone AS contact_number,
                    u.date_join,u.status,l.name AS location_name,u.timezone
                    FROM users u
                    JOIN department d ON u.department_id=d.id
                    JOIN location l ON u.location_id=l.id
                    WHERE ${condition}`

        return mySql.query(query);
    }
    async getUser(columns, condition) {
        let query = `SELECT ${columns}
                    FROM users_new
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async userRegister(first_name, last_name, email, password, contact_number, date_join, address, photo_path, status) {
        let query = `INSERT INTO users_new (first_name, last_name, email, password, contact_number, date_join, address, photo_path, status)
                    VALUES ('${first_name}', '${last_name}', '${email}', '${password}', '${contact_number}', '${date_join}', '${address}', '${photo_path}', ${status})`

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

    async userList(admin_id, location_id, department_id, role_id, name) {
        let department_ids = department_id ? "'" + department_id.split(",").join("','") + "'" : 0;

        let query = `SELECT e.id As user_id,u.first_name,u.last_name,u.email,u.contact_number,u.date_join,u.address,u.photo_path,u.status, e.organization_id,e.location_id,ol.name AS location_name,e.department_id,e.emp_code,e.shift_id,e.timezone,e.tracking_mode,e.tracking_rule_type,
                    od.name AS department_name,ur.role_id,rn.name AS role_name,rn.type AS role_type, (COUNT( e.id ) OVER()) AS total_count,CONCAT(u.first_name, ' ', u.last_name) AS full_name
                    FROM employees e
                    INNER JOIN users_new u ON u.id=e.user_id
                    INNER JOIN organization_locations ol ON e.location_id=ol.id
                    INNER JOIN organization_departments od ON od.id=e.department_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    JOIN roles_new rn ON rn.id=ur.role_id
                    WHERE e.organization_id=${admin_id}`;

        if (location_id !== parseInt(0)) query += ` AND e.location_id = ${location_id}`;
        if (role_id !== parseInt(0)) query += ` AND ur.role_id= ${role_id}`;
        if (department_id) query += ` AND e.department_id  in(${department_ids})`;
        if (name) query += ` AND u.first_name LIKE '%${name}%'`;

        query += ` ORDER BY e.created_at DESC;`

        return mySql.query(query);
    }
}

module.exports = new UserActivityModel;