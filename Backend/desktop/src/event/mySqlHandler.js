const mysql = require('mysql2');
const mySql = require('../database/MySqlConnection').getInstance();

exports.getAttendanceId = ({ employee_id, organization_id, date }) => {
    const query = `
        SELECT id
        FROM employee_attendance
        WHERE
        employee_id = ? AND
        organization_id = ? AND
        date = ?
    `;

    const values = [employee_id, organization_id, date];

    if (process.env.MYSQL_TIMEOUT === 'true') {
        return mySql.query({ sql: query, values, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
    }

    return mySql.query(query, values);
}

exports.getKeyStrokeId = (attendance_id) => {
    const query = `
        SELECT id
        FROM employee_keystrokes
        WHERE attendance_id = ?
    `;

    const values = [attendance_id];

    if (process.env.MYSQL_TIMEOUT === 'true') {
        return mySql.query({ sql: query, values, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
    }

    return mySql.query(query, values);
}

exports.appendKeyStrokes = ({ keystroke_id, keystrokes }) => {
    const query = `
        UPDATE employee_keystrokes
        SET keystrokes = concat(ifnull(keystrokes, ""), ?)
        WHERE id = ?
    `;

    const values = [keystrokes, keystroke_id];

    if (process.env.MYSQL_TIMEOUT === 'true') {
        return mySql.query({ sql: query, values, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
    }

    return mySql.query(query, values);
}

/**
 * @description
 * To inset keystrokes.
 *
 * @param {Object} dataObj
 * @param {Number} dataObj.attendance_id
 * @param {String} dataObj.keystrokes
 */
exports.insertKeyStrokes = (dataObj) => {
    const query = mysql.format(`INSERT INTO employee_keystrokes SET ?;`, { ...dataObj });

    if (process.env.MYSQL_TIMEOUT === 'true') {
        return mySql.query({ sql: query, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
    }

    return mySql.query(query);
};

// ! Have To Create Unique Index First
exports.insertEmpAttendance = (dataObj) => {
    const query = `
      INSERT INTO employee_attendance (employee_id, organization_id, date, start_time, end_time)
      VALUES ?
        
      ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id),
        employee_id = VALUES(employee_id),
        organization_id = VALUES(organization_id),
        date = VALUES(date),
        start_time = VALUES(start_time),
        end_time = VALUES(end_time);
    `;

    return mySql.query(query, [dataObj]);
};
//For assign employee
exports.getRoleWithDeptAndLoc = ({ where }) => {
    const query = `SELECT *
                    FROM roles_location_department
                    WHERE ${where}`;

    return mySql.query(query);
};

exports.getRoleUser = (role_id, organization_id) => {
    const query = `SELECT e.id,u.first_name
                        FROM employees e
                        INNER JOIN users u ON u.id=e.user_id
                        INNER JOIN user_role ur ON ur.user_id=u.id
                        WHERE ur.role_id=${role_id} AND organization_id=${organization_id}`;

    return mySql.query(query);
};
exports.getAssignedEmployee = (to_assigned_id, employees, role_id) => {
    let query = `SELECT a.employee_id,a.to_assigned_id
                FROM assigned_employees a
                WHERE a.to_assigned_id=${to_assigned_id} AND a.employee_id IN(${employees})`;

    if (role_id) query += ` AND role_id=${role_id};`

    return mySql.query(query);
};

exports.bulkAssign = (data) => {
    return mySql.query(`
            INSERT INTO assigned_employees (employee_id,to_assigned_id,role_id)
            VALUES ?`, [data]);
};
exports.employees = ({ select, where }) => {
    const query = `SELECT ${select}
                    FROM employees
                    WHERE ${where};`;

    return mySql.query(query);
}

exports.unassignBulk = (employee_ids, to_assigned_id, role_id) => {
    let query = `DELETE FROM assigned_employees 
                    WHERE to_assigned_id=${to_assigned_id} AND employee_id IN(${employee_ids})`;

    if (role_id) query += ` AND role_id=${role_id}`

    return mySql.query(query);
}

exports.alertList = (organization_id) => {
    const query = `SELECT id, include_employees 
                FROM notification_rules 
                WHERE organization_id = ? AND 
                (JSON_EXTRACT(include_employees,'$.all_employees')=1
                    OR JSON_EXTRACT(include_employees,'$.all_locations')=1 
                    OR JSON_EXTRACT(include_employees,'$.all_departments')=1);
                `;

    return mySql.query(query, [organization_id]);
}

exports.updateRule = async (rule_id, include_employees) => {
    const query = `UPDATE notification_rules
                SET include_employees = '${JSON.stringify(include_employees)}'
                WHERE id = ${rule_id};`;

    return mySql.query(query);
}