const mysql = require("../../../../../../database/MySqlConnection").getInstance();
const moment = require('moment');

class RunPayrollSalaryRevisionModel {
    get EMPLOYEEE_PAYROLL_SETTINGS_TABLE() {
        return 'employee_payroll_settings';
    }

    async getSalaryRevision({ skip, limit, isCount, organization_id, date, is_assigned_to, role_id }) {
        const startOfMonth = moment(date).startOf('month').format("YYYY-MM-DD");
        const endOfMonth = moment(date).endOf('month').format("YYYY-MM-DD");
        let limitStr = '';
        let selectStr = `
            eps.employee_id, 
            u.first_name, u.last_name, CONCAT(u.first_name,' ', u.last_name) AS full_name,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details, "$.ctc")) as new_ctc,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details, "$.salaryRevision.oldCtc")) as old_ctc,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details, "$.salaryRevision.effectiveDate")) as effective_date,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details, "$.salaryRevision.comment")) as comment
        `;

        if (isCount) selectStr = ` count(1) AS totalCount `;
        if (!isCount) {
            if (skip) limitStr += ` LIMIT ${skip} `;
            if (limit) limitStr += limitStr ? `, ${limit} ` : ` LIMIT ${limit} `;
        }

        let tables = is_assigned_to ?
            ` FROM assigned_employees ae 
            INNER JOIN employee_payroll_settings eps ON ae.employee_id = eps.employee_id
            INNER JOIN employees e ON eps.employee_id = e.id
            INNER JOIN users u ON u.id = e.user_id 
            WHERE eps.organization_id = ? AND 
            ae.to_assigned_id = ${is_assigned_to} 
            AND ae.role_id = ${role_id} ` :
            ` FROM employee_payroll_settings eps
            INNER JOIN employees e ON eps.employee_id = e.id
            INNER JOIN users u ON u.id = e.user_id 
            WHERE eps.organization_id = ? `;

        const query = `
            SELECT
               ${selectStr}
               ${tables}
             AND
                JSON_UNQUOTE(JSON_EXTRACT(eps.details, "$.salaryRevision.effectiveDate")) BETWEEN ? AND ? 
            ${limitStr}
        `;

        return mysql.query(query, [organization_id, startOfMonth, endOfMonth])
    }
}

module.exports = new RunPayrollSalaryRevisionModel;