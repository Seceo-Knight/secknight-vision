const { log } = require('mathjs')
const moment = require('moment');

const mysql = require('../../../../../../database/MySqlConnection').getInstance()

class OverviewModel {
    static async getEmpSettings({ organization_id }) {
        return mysql.query(`SELECT id,pf_override,esi_override,pf_applicable,esi_applicable, employee_id,payroll_policy_id, settings, details
                    FROM employee_payroll_settings
                    WHERE organization_id=?`, [organization_id])
    }

    static getEmpLeaves({ organization_id, startDate, endDate }) {
        let query = `SELECT el.employee_id,el.day_type,el.start_date,el.end_date, el.number_of_days,el.status
                     FROM employee_leaves el
                     WHERE el.organization_id=?  AND
                     el.start_date>=? AND 
                     el.end_date<=? AND el.status =?
                    `
        // el.status =?
        return mysql.query(query, [organization_id, startDate, endDate, 1])
    }

    static getOrgAttendanceHours({ organization_id }) {
        let query = `SELECT id,value ,name FROM organization_hrms_settings
                     WHERE organization_id =?
                     AND name = ?`
        return mysql.query(query, [organization_id, 'attendance_hours'])
    }

    static getOrgHolidays({ organization_id, startDate, endDate }) {
        let query = `SELECT COUNT(h.id) holidays
                     FROM holidays h
                     WHERE h.organization_id=? AND
                     h.holiday_date>=? AND
                     h.holiday_date<=?
                     GROUP BY h.organization_id`
        return mysql.query(query, [organization_id, startDate, endDate])
    }

    static getPayrollPolicy({ organization_id, policyIds }) {
        let query = `SELECT opp.id,opsc.component_name AS componentName ,opsc.component_type,oppr.rule
                     FROM organization_payroll_policies opp
                     INNER JOIN organization_payroll_policy_rules oppr ON oppr.policy_id=opp.id
                     INNER JOIN organization_payroll_salary_components opsc ON opsc.id=oppr.salary_component_id
                     WHERE opp.organization_id =? AND opp.id IN (?) `
        return mysql.query(query, [organization_id, policyIds])
    }
    static getOrganizationEmployeesCount({ date, organization_id }) {
        date = moment(date).clone().endOf('month').format('YYYY-MM-DD HH:mm:ss');

        let query = `SELECT COUNT(e.id) AS total
                     FROM employees e 
                     INNER JOIN  users u ON u.id =e.user_id
                     WHERE e.organization_id=? AND u.status=?  AND e.created_at <= ?
                     GROUP BY e.organization_id `
        return mysql.query(query, [organization_id, 1, date])
    }

    static getPayout({ to_assigned_id, role_id, sortColumn, sortOrder, month, year, search, skip, limit, employeeId, organization_id, isCount = false }) {
        let params = [organization_id, month, year, "hold"];
        const salary_hold = `JSON_UNQUOTE(JSON_EXTRACT(eps.salary_on_hold, '$.status'))`;

        let query;
        if (to_assigned_id) {
            query = `SELECT ep.id,ep.employee_id , CONCAT(u.first_name," ",u.last_name) AS name, e.emp_code,
                    od.name AS department , ol.name AS location,ep.netpay,ep.payout_status, eps.details, 
                    bad.bank_name ,bad.ifsc_code,bad.account_number,COUNT(ep.id) AS totalCount
                    FROM assigned_employees ae
                    LEFT JOIN  employee_payroll ep ON ae.employee_id=ep.employee_id
                    INNER join employees e ON e.id=ep.employee_id
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN organization_locations ol ON ol.id=e.location_id
                    INNER JOIN organization_departments od ON od.id=e.department_id
                    INNER JOIN employee_payroll_settings eps ON eps.employee_id=e.id
                    LEFT JOIN bank_account_details bad ON bad.employee_id=e.id
                    WHERE e.organization_id=? AND ep.month=? AND ep.year=? AND (eps.salary_on_hold is null OR ${salary_hold} != ?)
                    AND ae.to_assigned_id=${to_assigned_id} AND ae.role_id=${role_id}`;
        }
        else {
            query = `SELECT ep.id,ep.employee_id , CONCAT(u.first_name," ",u.last_name) AS name, e.emp_code,
                     od.name AS department , ol.name AS location,ep.netpay,ep.payout_status, eps.details, 
                     bad.bank_name ,bad.ifsc_code,bad.account_number,COUNT(ep.id) AS totalCount
                     FROM employee_payroll ep
                     INNER join employees e ON e.id=ep.employee_id
                     INNER JOIN users u ON u.id=e.user_id
                     INNER JOIN organization_locations ol ON ol.id=e.location_id
                     INNER JOIN organization_departments od ON od.id=e.department_id
                     INNER JOIN employee_payroll_settings eps ON eps.employee_id=e.id
                     LEFT JOIN bank_account_details bad ON bad.employee_id=e.id
                     WHERE e.organization_id=? AND ep.month=? AND ep.year=? AND (eps.salary_on_hold is null OR ${salary_hold} != ?)`;
        }
        if (search) query += ` AND (CONCAT(u.first_name," ",u.last_name) LIKE '%${search}%' OR od.name LIKE '%${search}%' OR ol.name LIKE '%${search}%' OR ep.netpay LIKE  '%${search}%' ) `

        // condition to discard 
        query += ` AND ep.details IS NOT NULL `;

        if (employeeId) {
            query += ` AND  e.id=?`;
            params.push(employeeId);
        }

        let sort;
        let order = sortOrder == "A" ? "ASC" : "DESC";

        if (!isCount) {
            switch (sortColumn) {
                case "employee":
                    sort = "u.first_name";
                    break;
                case "location":
                    sort = "ol.name";
                    break;
                case "department":
                    sort = "od.name";
                    break;
                case "netpay":
                    sort = "ep.netpay";
                    break;
                case "emp_code":
                    sort = "e.emp_code";
                    break;
                default:
                    sort = "ep.id";
                    break;
            }
        }

        if (!isCount) {
            query += ` GROUP BY e.id  ORDER BY ${sort} ${order}   LIMIT ?, ?`;
            params.push(skip, limit);
        } else {
            query += ` GROUP BY e.organization_id`
        }

        return mysql.query(query, params)

    }

    static getPayrollOverview({ organization_id, month, year }) {
        return mysql.query(`SELECT id ,organization_id FROM
        organization_payroll_overview WHERE  organization_id=? AND month=? AND year=?`,
            [organization_id, month, year])
    }

    static addPayrollOverview({
        total_employees, pt, ctc, gross,
        netpay, employee_esi, processed_employees,
        employer_esi, employee_pf, employer_pf,
        month, year, organization_id, tax
    }) {
        return mysql.query(`INSERT INTO organization_payroll_overview (total_employees, pt, ctc, gross,
                            netpay, employee_esi, processed_employees,
                            employer_esi, employee_pf, employer_pf,
                            month, year, organization_id ,tax)
         
                            VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,

            [total_employees, pt, ctc, gross,
                netpay, employee_esi, processed_employees,
                employer_esi, employee_pf, employer_pf,
                month, year, organization_id, tax]);
    }

    static getPreviousOverview({ month, year, organization_id }) {
        return mysql.query(`SELECT total_employees, pt, ctc, gross,
                            netpay, employee_esi, processed_employees,
                            employer_esi, employee_pf, employer_pf,
                            month, year, organization_id ,tax
                            FROM  organization_payroll_overview 
                            WHERE organization_id=? AND month=? AND year=? `,
            [organization_id, month, year]
        )
    }

    static getOverviewMonths({ year, organization_id }) {
        return mysql.query(`SELECT  month , year ,1 AS status
                            FROM organization_payroll_overview
                            WHERE  organization_id=? AND year=? `, [organization_id, year])
    }


    static getOrganizationSettings = organization_id => {
        return mysql.query(`SELECT JSON_EXTRACT(settings, "$.paycycle.to") AS payCycleEnd,
                            JSON_EXTRACT(settings, "$.payoutDate") AS payoutDate
                            FROM organization_payroll_settings
                            WHERE organization_id=?`, [organization_id])
    }


    static getPayOutDate(organization_id) {
        const query = `SELECT settings FROM organization_payroll_settings ` +
            `WHERE organization_id = ?`;

        return mysql.query(query, [organization_id]);
    }
}
module.exports = OverviewModel;
