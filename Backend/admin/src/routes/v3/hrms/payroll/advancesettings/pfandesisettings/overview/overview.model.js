const mysql = require(`${dbFolder}/MySqlConnection`).getInstance();
class OverviewModel {
    /**
     * A function for get organization pf settings
     * @function getEmployees
     * @param {Number} organization_id
     * @returns {*} Success or Error 
     */
    static getEmployees({ employee_id, skip, limit, name, organization_id, order, sort, countQuery = false, to_assigned_id, role_id }) {
        let params = [organization_id], query;

        if (to_assigned_id) {
            query = `SELECT e.id AS employee_id,CONCAT(u.first_name," ",u.last_name) AS name, COUNT(e.id)totalCount,
                eps.settings , eps.details , eps.salary_components,eps.pf_override ,eps.esi_override,
                eps.pf_applicable ,eps.esi_applicable,e.emp_code
                FROM assigned_employees ae
                LEFT JOIN employees e ON e.id=ae.employee_id
                INNER JOIN users u ON u.id=e.user_id
                LEFT JOIN employee_payroll_settings eps ON eps.employee_id =e.id
                WHERE e.organization_id=? AND ae.to_assigned_id=${to_assigned_id} AND ae.role_id=${role_id}
                AND u.status = 1 `;
        }
        else {
            query = `SELECT e.id AS employee_id,CONCAT(u.first_name," ",u.last_name) AS name, COUNT(e.id)totalCount,
                eps.settings , eps.details , eps.salary_components,eps.pf_override ,eps.esi_override,
                eps.pf_applicable ,eps.esi_applicable,e.emp_code
                FROM employees e
                INNER JOIN users u ON u.id=e.user_id
                LEFT JOIN employee_payroll_settings eps ON eps.employee_id =e.id
                WHERE e.organization_id=?
                AND u.status = 1 `;
        }

        if (name) {
            query += ` AND CONCAT(u.first_name," ",u.last_name) LIKE '%${name}%'`;
        }
        if (employee_id) {
            query += ` AND e.id=?`;
            params.push(employee_id);
        }

        if (!countQuery) {
            if (sort) {
                sort = sort == 'employee' ? 'u.first_name' : "e.id";
                order = order == 'A' ? 'ASC' : 'DESC';
                query += ` GROUP BY e.id  ORDER BY ${sort} ${order} `;
            } else {
                query += ` GROUP BY e.id`
            }

            query += `  LIMIT ?, ?`;
            params.push(skip, limit);
        } else {
            query += ` GROUP BY e.organization_id`
        }


        // console.log(query, '-------', params)
        return mysql.query(query, params)
    }
    /**
     *  A function for to get employee
     * @function getUser
     * @param {Number} employee_id
     * @param {Number} organization_id
     * @returns {*} UserData or Error
     */
    static getUser = (employee_id, organization_id) => mysql.query('SELECT id FROM employees WHERE organization_id=? AND id=?', [organization_id, employee_id])

    /**
     *  A function for to get employee payroll settings
     * @function getPayrollSettings
     * @param {Number} employee_id
     * @param {Number} organization_id
     * @returns {*} settings or Error
     */
    static getPayrollSettings = (employee_id, organization_id) => mysql.query('SELECT id ,details FROM employee_payroll_settings WHERE organization_id=? AND employee_id=?', [organization_id, employee_id])

    /**
     * A function for add new employee settings
     * @function addSettings
     * @param {*} param0 
     * @returns {*} Success or error
     */
    static addSettings({ settings, details, employee_id, pf_override,
        esi_override, pf_applicable, esi_applicable, organization_id }) {
        let query = `INSERT INTO  employee_payroll_settings
                    ( settings, details, employee_id, pf_override, esi_override,
                     pf_applicable, esi_applicable, organization_id)
                     values(?,?,?,?,?,?,?,?)`

        return mysql.query(query,
            [settings, details, employee_id,
                pf_override, esi_override, pf_applicable,
                esi_applicable, organization_id])
    }

    /**
     * A function for update employee payroll settings
     * @function updateSettings
     * @param {*} param0 
     * @returns {*} Success or error
     */
    static updateSettings({ settings, details, employee_id, pf_override, esi_override,
        pf_applicable, esi_applicable, organization_id }) {

        let query = `UPDATE employee_payroll_settings SET `
        let params = [];

        if (settings) {
            query += ` settings = ?`;
            params.push(settings);
        }
        if (details) {
            query += ` , details = ?`;
            params.push(details);
        }
        if (pf_override == 0 || pf_override) {
            query += ` , pf_override = ?`;
            params.push(pf_override);
        }
        if (esi_override == 0 || esi_override) {
            query += ` , esi_override=?`;
            params.push(esi_override);
        }

        if (pf_applicable == 0 || pf_applicable) {
            query += ` , pf_applicable = ? `;
            params.push(pf_applicable);
        }
        if (esi_applicable == 0 || esi_applicable) {
            query += ` , esi_applicable = ?`;
            params.push(esi_applicable);
        }

        query += ` WHERE organization_id = ? AND employee_id = ?`;
        params.push(organization_id, employee_id);
        return mysql.query(query, params);
    }
}
module.exports = { OverviewModel };