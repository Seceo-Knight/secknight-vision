// Salary in Hand Model

// Imports 
const mySql = require("../../../../../../database/MySqlConnection").getInstance();


/**
 * @class EmployeeShiftsModel
 * Queries for Salary in Hand Services
 */
class SalaryInHandModel {

    getSalaryInHandEmployeesData({ name, skip, limit,
        organization_id, to_assigned_id, role_id }) {

        const selectQuery = `SELECT CONCAT(u.first_name, ' ',u.last_name) as name, 
                e.id as employee_id, e.emp_code `;

        let tables;
        if (to_assigned_id) {
            tables = `FROM employees e
                    INNER JOIN assigned_employees ae ON ae.to_assigned_id = e.id
                    INNER JOIN users u ON u.id = e.user_id
                    INNER JOIN employee_payroll_settings eps ON eps.employee_id = e.id
                    WHERE e.organization_id = ${organization_id}
                    AND ae.to_assigned_id = ${to_assigned_id} 
                    AND ae.role_id = ${role_id} `
        }
        else {
            tables = `FROM employees e
                    INNER JOIN users u ON u.id = e.user_id
                    INNER JOIN employee_payroll_settings eps ON eps.employee_id = e.id
                    WHERE e.organization_id = ${organization_id} `
        }

        let whereCondition = ` AND eps.salary_in_hand = 1 `;
        if (name) whereCondition += ` AND CONCAT(u.first_name, ' ',u.last_name) LIKE '%${name}%' `
        else whereCondition += skip ? ` LIMIT ${skip}, ${limit} ;` : ` LIMIT ${limit} ;`;

        const query = selectQuery + tables + whereCondition;

        return mySql.query(query);
    }


    checkSalaryInHand({ organization_id, employee_ids }) {
        const query = `SELECT eps.employee_id, e.id
                FROM employees e
                LEFT JOIN employee_payroll_settings eps ON e.id = eps.employee_id 
                WHERE e.organization_id = ?
                AND e.id IN (?) `;

        return mySql.query(query, [organization_id, employee_ids]);
    }


    updateSalaryInHand({ updateData, organization_id }) {
        const query = `UPDATE employee_payroll_settings 
            SET salary_in_hand = 1
            WHERE employee_id IN (?)
            AND organization_id = ? ;`;

        return mySql.query(query, [updateData, organization_id]);
    }


    disableSalaryInHand({ organization_id, employee_id }) {
        const query = `UPDATE employee_payroll_settings 
            SET salary_in_hand = 0
            WHERE employee_id = ? 
            AND organization_id = ? ;`;

        return mySql.query(query, [employee_id, organization_id]);
    }
}


// Exports
module.exports = new SalaryInHandModel;