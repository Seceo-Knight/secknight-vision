const mySql = require(`${dbFolder}/MySqlConnection`).getInstance();

class SettingsModel {
    static async getPt({ organization_id, location_id }) {
        let query = "";
        query += `SELECT p.id, p.location_id, p.details, p.effective_date, l.name
                    FROM professional_tax p
                    JOIN organization_locations l ON l.id=p.location_id
                    WHERE p.organization_id = ?`;
        let params = [organization_id];
        if (location_id) {
            query += ` AND p.location_id = ?`;
            params.push(location_id);
        }

        return mySql.query(query, params);
    }

    static async updatePt({ organization_id, location_id, details, effective_date }) {
        const query = `UPDATE professional_tax
                    SET details = ? , effective_date = ?
                    WHERE location_id = ? AND organization_id = ? ;`;

        return mySql.query(query, [JSON.stringify({ details }), effective_date, location_id, organization_id]);
    }

    static async addPt({ organization_id, location_id, details, effective_date }) {
        const query = `INSERT INTO professional_tax (organization_id, location_id, details, effective_date)
                    VALUES (?, ?, ?, ?);`

        return mySql.query(query, [organization_id, location_id, JSON.stringify({ details }), effective_date]);
    }

    static async deletePt({ organization_id, location_ids }) {
        const query = `DELETE FROM professional_tax WHERE organization_id = ? AND location_id IN (?);`;

        return mySql.query(query, [organization_id, location_ids]);
    }

    static getEmployees({ skip, limit, order, sort, employee_id, search, organization_id, is_assigned_to, role_id, isCount = false }) {
        let params = [organization_id, 1];
        let query = '';
        if (is_assigned_to) {
            query = ` SELECT e.id, CONCAT(u.first_name, " ",u.last_name) full_name ,
            eps.settings,eps.details ,ol.name location, ol.id AS location_id, COUNT(e.id) totalCount,e.emp_code
            FROM assigned_employees ae
            INNER JOIN employees e ON ae.employee_id = e.id
            INNER JOIN organization_locations ol ON ol.id = e.location_id
            INNER JOIN users u ON u.id=e.user_id
            LEFT JOIN employee_payroll_settings eps ON eps.employee_id=e.id
            WHERE ae.to_assigned_id = ${is_assigned_to} AND ae.role_id = ${role_id} 
            AND e.organization_id=? AND u.status=?
            `
        } else {
            query = ` SELECT e.id, CONCAT(u.first_name, " ",u.last_name) full_name ,
            eps.settings,eps.details ,ol.name location, ol.id AS location_id, COUNT(e.id) totalCount,e.emp_code
            FROM employees e
            INNER JOIN organization_locations ol ON ol.id = e.location_id
            INNER JOIN users u ON u.id=e.user_id
            LEFT JOIN employee_payroll_settings eps ON eps.employee_id=e.id
            WHERE e.organization_id=? AND u.status=?
            `
        }
        if (employee_id) {
            query += ` AND e.id = ? `;
            params.push(employee_id);
        }
        if (search) {
            query += ` AND (CONCAT(u.first_name, " ",u.last_name) LIKE '%${search}%' OR ol.name LIKE '%${search}%')`
        }
        if (isCount) {
            query += ` GROUP BY e.organization_id  `
        }
        if (sort && !isCount) {
            sort = sort == 'employee' ? 'u.first_name' : 'ol.name';
            order = order == 'A' ? 'ASC' : 'DESC';
            query += ` GROUP BY e.id  ORDER BY ${sort} ${order}  `
        }
        if (limit && !isCount) {
            query += ` LIMIT ?,? `
            params.push(skip, limit)
        }

        return mySql.query(query, params);
    }

    static getSingleEmployeeData({ organization_id, employee_id }) {
        let params = [organization_id, employee_id];
        let query = ` SELECT e.id AS employee_id, eps.id, eps.settings
                      FROM employees e
                      LEFT JOIN employee_payroll_settings eps ON e.id=eps.employee_id
                      WHERE e.organization_id=? AND e.id=?`
        return mySql.query(query, params);
    }

    static addEmployeePayrollSettings({ organization_id, employee_id, settings }) {
        return mySql.query(`INSERT INTO employee_payroll_settings
                            (organization_id, employee_id, settings)
                            VALUES(?,?,?)`,
            [organization_id, employee_id, settings]
        )
    }

    static updateEmployeePayrollSettings({ organization_id, employee_id, settings }) {
        return mySql.query(`UPDATE employee_payroll_settings
                            SET  settings=?
                            WHERE  organization_id=? AND employee_id=? `,
            [settings, organization_id, employee_id])
    }

    static getLocation(organization_id, location_id) {
        return mySql.query(`SELECT id FROM organization_locations 
                            WHERE  organization_id=? AND id=? `,
            [organization_id, location_id])
    }
}

module.exports.SettingsModel = SettingsModel;