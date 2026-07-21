/** Employee Shifts Model */

/** Imports */
const mySql = require("../../../../database/MySqlConnection").getInstance();


/**
 * @class EmployeeShiftsModel
 * Queries for Employee Shifts Services
 */
class EmployeeShiftsModel {

    getOrganizationShiftsData({ organization_id, shift_id }) {
        let query = `SELECT  id AS shift_id, name AS shift_name
                FROM organization_shifts 
                WHERE organization_id = ? `;

        if (shift_id) query += ` AND id = ${shift_id} ;`;

        return mySql.query(query, [organization_id]);
    };

    checkEmployeeIds({ organization_id, employee_ids }) {
        const query = `SELECT id 
                FROM employees 
                WHERE organization_id = ? 
                AND id IN (?) ;`;

        return mySql.query(query, [organization_id, employee_ids]);
    };


    employeeShifts({ organization_id, employee_ids, shift_id }) {
        let query = `SELECT employee_id, shift_id 
                FROM hrms_employee_shifts
                WHERE organization_id = ${organization_id}
                AND shift_id = ${shift_id}
                AND employee_id IN (${employee_ids}) ;`;

        return mySql.query(query);
    };


    updateEmployeeShifts({ updateData: employee_ids, shift_id, start_date, end_date, organization_id, user_id }) {
        const query = `UPDATE hrms_employee_shifts
                SET start_date = ?, 
                end_date = ?,
                updated_by = ?
                WHERE organization_id = ?
                AND shift_id = ? 
                AND employee_id IN (?) ;`

        return mySql.query(query, [start_date, end_date, user_id, organization_id, shift_id, employee_ids]);
    };


    insertEmployeeShifts(insertData) {
        const query = `INSERT INTO hrms_employee_shifts 
                (employee_id, organization_id, shift_id, start_date,
                end_date, created_by, updated_by)
                VALUES ? ;`;

        return mySql.query(query, [insertData]);
    };


    checkEmpShiftTiming({ organization_id, employee_ids, shift_id, start_date, end_date }) {
        const query = `SELECT id 
                FROM hrms_employee_shifts
                WHERE organization_id = ? 
                AND shift_id != ? 
                AND employee_id IN (?) 
                AND (
                    ? BETWEEN start_date AND end_date
                    OR
                    ? BETWEEN start_date AND end_date
                    OR start_date BETWEEN ? and ?
                    OR end_date BETWEEN ? and ?
                )`;

        return mySql.query(query, [organization_id, shift_id, employee_ids,
            start_date, end_date, start_date, end_date, start_date, end_date]);
    }


    getEmployeesData({ name, skip, limit, organization_id,
        employee_id, to_assigned_id, role_id }) {

        /** Query for which data to get */
        let selectQuery = `SELECT e.id AS employee_id, e.shift_id, os.name AS shift_name,
                CONCAT(u.first_name, ' ', u.last_name) AS name, e.emp_code, u.date_join,
                (COUNT( e.id ) OVER()) AS total_count `;


        /** Tables for getting data */
        let tables = '';
        if (to_assigned_id) {
            tables = `FROM employees AS e
            LEFT JOIN assigned_employees ae ON ae.employee_id = e.id 
            LEFT JOIN users u ON e.user_id = u.id 
            LEFT JOIN organization_shifts AS os ON e.shift_id = os.id `;
        } else {
            tables = `FROM employees AS e
            LEFT JOIN users u ON e.user_id = u.id 
            LEFT JOIN organization_shifts AS os ON e.shift_id = os.id `;
        }


        /** Where Statements for each conditions */
        let whereStatement = ` WHERE e.organization_id = ${organization_id} AND u.status = 1 `;
        if (to_assigned_id) whereStatement += ` AND ae.to_assigned_id = ${to_assigned_id} AND ae.role_id = ${role_id}`;
        if (employee_id) whereStatement += ` AND e.id = ${employee_id}`;
        if (name) whereStatement += ` AND CONCAT(u.first_name, ' ', u.last_name) LIKE '%${name}%' ;`;
        if (!employee_id && !name && (limit || skip)) whereStatement += skip ? ` LIMIT ${skip}, ${limit} ;` : ` LIMIT ${limit}`;

        /** Making query */
        const query = `${selectQuery} ${tables} ${whereStatement}`;

        return mySql.query(query);
    };


    getEmployeesShifts({ organization_id, employee_ids }) {
        const query = `SELECT es.employee_id, es.start_date, es.end_date,
                os.name AS shift_name, es.shift_id
                FROM hrms_employee_shifts AS es
                LEFT JOIN organization_shifts AS os ON es.shift_id = os.id
                WHERE es.organization_id = ? 
                AND es.employee_id IN (?) ;`;

        return mySql.query(query, [organization_id, employee_ids]);
    }


    deleteEmployeeShifts({ organization_id, employee_id, shift_id }) {
        const query = `DELETE FROM hrms_employee_shifts 
                WHERE organization_id = ? 
                AND employee_id = ? 
                AND shift_id = ? ;`;

        return mySql.query(query, [organization_id, employee_id, shift_id]);
    }
}


/** Exports */
module.exports = new EmployeeShiftsModel;