// Salary on Hold Models

const mySql = require('../../../../../../database/MySqlConnection').getInstance();


class SalaryOnHoldModel {


    getSalaryOnHoldData(organization_id, isCurrentMonthComplete = false) {

        const salary_hold = `JSON_UNQUOTE(JSON_EXTRACT(eps.salary_on_hold, '$.status'))`;

        let params = [organization_id,];
        let query = `SELECT e.id AS employee_id,
                     u.first_name AS first_name,
                     u.last_name AS last_name,
                     CONCAT(u.first_name, " ",u.last_name) AS full_name,
                     e.emp_code AS emp_code,
                     eps.salary_on_hold as salary_hold
                     FROM employee_payroll_settings AS eps
                     LEFT JOIN employees AS e ON e.id = eps.employee_id
                     LEFT JOIN users AS u ON u.id = e.user_id
                     WHERE eps.organization_id = ?
                     AND  `;

        if (isCurrentMonthComplete) {
            query += `${salary_hold} = ?`;
            params.push("hold");
        } else {
            query += `eps.salary_on_hold is not null`;
        }



        return mySql.query(query, params);
    }

    /**
   * getSalaryHoldDetails - function to get salary on hold employee details
   * 
   * @param {*} params 
   * @returns sucees or error json object
   * @author Mahesh D <maheshd@globussoft.in>
   */

    getSalaryHoldDetails(employee_id) {
        if (!employee_id) return null;
        let query = `select salary_on_hold from employee_payroll_settings where employee_id = ?`;
        return mySql.query(query, [employee_id]);
    }

    /**
   * updateSalaryHoldDetails - function to update salary on hold employee details
   * 
   * @param {*} params 
   * @returns sucees or error json object
   * @author Mahesh D <maheshd@globussoft.in>
   */
    updateSalaryHoldDetails(employee_id, salary_hold) {
        if (!employee_id) return null;
        let query = `UPDATE employee_payroll_settings SET salary_on_hold = ? where employee_id = ?`;
        return mySql.query(query, [salary_hold, employee_id]);
    }

    getMultipleSalaryHoldDetails(employeeIds) {
        if (!employeeIds) return null;
        let query = `select employee_id from employee_payroll_settings where employee_id IN (?)`;
        return mySql.query(query, [employeeIds]);
    }

    updateEmployeePayrollDetails({ employee_id, months, year }) {
        let query = `UPDATE employee_payroll 
                SET salary_hold = '${JSON.stringify({ isSalaryHold: true })}' 
                WHERE employee_id = ${employee_id} 
                AND month IN (${months}) 
                AND year = ${year}`;

        return mySql.query(query);
    }
}

module.exports = new SalaryOnHoldModel();