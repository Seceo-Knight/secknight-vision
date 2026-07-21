const mysql = require("../../../../../database/MySqlConnection").getInstance();

class DeclarationModel {
    constructor() {
        this.EMPLOYEE_DECLARATION_TABLE = 'employee_declaration';
        this.ORG_PAYROLL_SETTINGS_TABLE = 'organization_payroll_settings';
        this.USERS_TABLE = 'users';
        this.EMPLOYEES_TABLE = 'employees';
        this.EMP_PAYROLL_SETTINGS_TABLE = 'employee_payroll_settings';
        this.ORGANIZATION_LOCATIONS = 'organization_locations';
        this.TAX_SCHEMES = 'tax_schemes';
    }

    /**
     * getDeclaration - function to get declaration
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@gloubssoft.in>
     */
    getDeclaration({ id, organization_id, employee_id, financial_year, declaration_id, component_name }) {
        let selectStr = ` id, organization_id, employee_id, financial_year, declaration_component_id, documents, information, declared_amount, comments `;
        if (component_name) {
            selectStr = `
                id, organization_id, employee_id, financial_year, declaration_component_id, documents, information, declared_amount, comments,
                JSON_UNQUOTE(JSON_EXTRACT(information, "$.lta.component_name")) as component_name,
                JSON_UNQUOTE(JSON_EXTRACT(information, "$.lta.travel_date")) as travel_date
            `;
        }

        let query = `
            SELECT
                ${selectStr}
            FROM ${this.EMPLOYEE_DECLARATION_TABLE}
            WHERE
                organization_id = ? AND 
                employee_id = ? AND
                financial_year = ? AND
                declaration_component_id = ?
        `;
        let params = [organization_id, employee_id, financial_year, declaration_id];
        if (id) {
            query += ` AND id =? `
            params.push(id)
        }
        if (component_name) {
            query += ` 
                AND JSON_EXTRACT(information, "$.lta.component_name") = ?
            `;
            params.push(component_name);
        }

        return mysql.query(query, params);
    }
    /**
     * getDeclarationById - function to get declaration by ids
     * 
     * @param {*} employee_declaration_id
     * @returns 
     * @author Amit Verma <amitverma@gloubssoft.in>
     */
    getDeclarationById(employee_declaration_id) {
        const query = `
            SELECT
                ed.id, ed.organization_id, ed.employee_id, ed.financial_year,
                ed.declaration_component_id, ed.documents, ed.information, ed.declared_amount, ed.comments,
                e.user_id
            FROM ${this.EMPLOYEE_DECLARATION_TABLE} ed
            INNER JOIN ${this.EMPLOYEES_TABLE} e ON e.id = ed.employee_id
            WHERE
                ed.id = ?  
        `;

        return mysql.query(query, [employee_declaration_id]);
    }
    /**
     * createDeclaration - function to create declaration
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@gloubssoft.in>
     */
    createDeclaration({ organization_id, employee_id, financial_year, declaration_id, documents, declared_amount, comments, information }) {
        documents = documents ? JSON.stringify(documents) : null;
        const query = `
            INSERT INTO ${this.EMPLOYEE_DECLARATION_TABLE} SET ?
            `;
        return mysql.query(query, { documents, organization_id, employee_id, financial_year, declaration_component_id: declaration_id, declared_amount, comments, information: typeof information == 'string' ? information : JSON.stringify(information) });
    }

    /**
     * updateDeclaration - function to update declaration
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@gloubssoft.in>
     */
    updateDeclaration({ id, organization_id, employee_declaration_id, employee_id, financial_year, declaration_id, documents, declared_amount, comments, information, component_name }) {
        let setStr = '';
        let whereStr = '';
        let setStrArr = [];
        let whereStrArr = [];
        if (!employee_declaration_id && (!organization_id || !employee_id || !financial_year || !declaration_id)) {
            return null;
        }

        if (documents) {
            setStr += setStr ? ` , documents = ? ` : ` documents = ? `;
            setStrArr.push(JSON.stringify(documents));
        }
        if (declared_amount) {
            setStr += setStr ? ` , declared_amount = ? ` : ` declared_amount = ? `;
            setStrArr.push(declared_amount);
        }
        if (comments) {
            setStr += setStr ? ` , comments = ? ` : ` comments = ? `;
            setStrArr.push(comments);
        }
        if (information) {
            setStr += setStr ? ` , information = ? ` : ` information = ? `;
            setStrArr.push(typeof information == 'string' ? information : JSON.stringify(information));
        }

        if (!setStr) return null;

        if (employee_declaration_id) {
            whereStr = `
                id = ?
            `;
            whereStrArr = [employee_declaration_id];
        } else {
            whereStr = `
                organization_id = ? AND
                employee_id = ? AND
                financial_year = ? AND
                declaration_component_id = ?
            `;
            whereStrArr = [organization_id, employee_id, financial_year, declaration_id];
        }
        if (component_name) {
            whereStr += `
                AND JSON_EXTRACT(information, "$.lta.component_name") = ?
            `;
            whereStrArr.push(component_name);
        }

        if (id) {
            whereStr += ` AND id =? `
            whereStrArr.push(id);
        }

        const query = `
            UPDATE ${this.EMPLOYEE_DECLARATION_TABLE}
        SET ${setStr}
        WHERE ${whereStr}
        `;
        return mysql.query(query, [...setStrArr, ...whereStrArr]);
    }

    /**
    * Get employee tax scheme details
    * @function getEmployees
    * @param {Number} employeeId
    * @param {Number} skip
    * @param {Number} limit
    * @param {String} name
    * @param {Number} organizationId
    * @param {String} order
    * @param {String} sort
    * @returns {*} Success or Error 
    */
    getEmployeesTaxDetails({ employee_ids, employeeId, skip, limit, name, organizationId, order, sort, employee_type }) {
        let params = [organizationId],
            query = `SELECT e.id AS employee_id, CONCAT(u.first_name, " ", u.last_name) AS name, COUNT(e.id) OVER() AS total_count,
            l.name AS location, eps.admin_approved_scheme_id, t1.scheme AS admin_approved_scheme, eps.employee_approved_scheme_id,
            t2.scheme AS employee_approved_scheme, u.a_email AS email, JSON_EXTRACT(eps.settings, '$.schemeStatus') AS schemeStatus,
            e.emp_code, JSON_EXTRACT(eps.details, '$.type') AS type
                     FROM ${this.EMPLOYEES_TABLE} e
                     INNER JOIN ${this.USERS_TABLE} u ON u.id = e.user_id
                     INNER JOIN ${this.ORGANIZATION_LOCATIONS} l ON l.id = e.location_id
                     LEFT JOIN ${this.EMP_PAYROLL_SETTINGS_TABLE} eps ON eps.employee_id = e.id
                     LEFT JOIN ${this.TAX_SCHEMES} t1 ON t1.id = eps.admin_approved_scheme_id
                     LEFT JOIN ${this.TAX_SCHEMES} t2 ON t2.id = eps.employee_approved_scheme_id
                     WHERE e.organization_id = ? 
                     AND u.status = 1 `;
        if (name) {
            query += ` AND(CONCAT(u.first_name, " " , u.last_name) LIKE ? OR l.name LIKE ? OR t1.scheme LIKE ? OR t2.scheme LIKE ?)`;
            params.push(`%${name}%`, ` %${name}%`, `% ${name}%`, ` %${name}%`);
        }
        if (employeeId) {
            query += ` AND e.id = ? `;
            params.push(employeeId);
        }
        if (employee_ids.length > 0) {
            query += ` AND e.id IN( ? ) `;
            params.push(employee_ids);
        }
        if (employee_type) {
            query += ` AND JSON_EXTRACT(eps.details, '$.type') = ? `;
            params.push(employee_type);
        }
        if (sort) {
            query += `GROUP BY e.id ORDER BY ${sort} ${order} `;
        }

        query += `  LIMIT ?, ? `;
        params.push(skip, limit);

        return mysql.query(query, params)
    }

    /**
    * Get scheme list.
    * @function listScheme
    * @returns {*} Success or Error
    */
    listScheme(employee_type) {
        let query = `SELECT id AS scheme_id, scheme, details,employee_type FROM tax_schemes WHERE status = 1 `;
        if (employee_type) {
            query += `AND employee_type = ?`
            return mysql.query(query, [employee_type]);
        }
        return mysql.query(query);
    }

    /**
    * Check settings exists.
    * @function getEmployees
    * @param {Number} employeeId
    * @param {Number} organizationId
    * @returns {*} Success or Error
    */
    checkExists({ employeeId, organizationId }) {
        const query = `SELECT * FROM employee_payroll_settings  WHERE employee_id = ? AND organization_id = ? `;

        return mysql.query(query, [employeeId, organizationId]);
    }

    /**
    * Add tax scheme data
    * @function addTaxSchemeData
    * @param {Number} organizationId
    * @param {Number} employeeId
    * @param {Number} adminApprovedBchemeId
    * @param {Number} employeeApprovedSchemeId
    * @returns {*} Success or Error
    */
    addTaxSchemeData({ organizationId, employeeId, adminApprovedBchemeId }) {
        const query = `INSERT INTO employee_payroll_settings(organization_id, employee_id, admin_approved_scheme_id)
        VALUES(?, ?, ?); `;

        return mysql.query(query, [organizationId, employeeId, adminApprovedBchemeId]);
    }

    /**
    * Update tax scheme settings.
    * @function updateTaxScheme
    * @param {Number} organizationId
    * @param {Number} employeeId
    * @param {Number} adminApprovedBchemeId
    * @param {Number} employeeApprovedSchemeId
    * @returns {*} Success or Error
    */
    updateTaxScheme({ organizationId, employeeId, adminApprovedBchemeId }) {
        // let set = `settings= ? `;
        let set = '';
        let values = [];
        if (adminApprovedBchemeId) {
            set += set ? ` , admin_approved_scheme_id = ? ` : ` admin_approved_scheme_id = ? `;
            values.push(adminApprovedBchemeId);
        }
        // if (employee && employeeApprovedSchemeId) {
        //     set += set ? `, employee_approved_scheme_id = ? ` : ` employee_approved_scheme_id = ? `;
        //     values.push(employeeApprovedSchemeId);
        // }
        if (!set) return resolve();

        values.push(organizationId, employeeId);
        const query = `UPDATE employee_payroll_settings
        SET ${set}
        WHERE organization_id = ? AND employee_id = ?; `;
        return mysql.query(query, values);
    }

    /**
     * checkEmployeeData - function to check employee id is valid or not
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    checkEmployeeData({ organization_id, employee_id }) {
        const query = `
        select
        id
        FROM ${this.EMPLOYEES_TABLE}
        WHERE
        organization_id = ? AND
                id = ?
            `;
        return mysql.query(query, [organization_id, employee_id]);
    }

    /**
   * Get default scheme.
   * @function getDefaultScheme
   * @returns {*} Success or Error
   */
    getDefaultScheme() {
        const query = `SELECT id AS scheme_id, scheme, details FROM tax_schemes WHERE status = 1 AND scheme='Old Tax Scheme'`;

        return mysql.query(query);
    }

    getEmployeeAssignedToManager(manager_id, role_id) {
        const query = `
            SELECT employee_id
            FROM assigned_employees
            WHERE to_assigned_id=? AND role_id=?
        `;

        return mysql.query(query, [manager_id, role_id])
    }


    getEmployeesDetails({ skip, limit, name, employee_id, employee_type, organization_id, to_assigned_id, role_id }) {
        let query = to_assigned_id ?
            `SELECT 
                CONCAT(u.first_name, ' ', u.last_name) AS name,
                e.id AS employee_id, e.emp_code
            FROM employees AS e
            INNER JOIN assigned_employees AS ae ON ae.to_assigned_id = e.id
            LEFT JOIN employee_payroll_settings AS eps ON eps.employee_id = e.id
            INNER JOIN users AS u ON u.id = e.user_id 
            WHERE ae.to_assigned_id = ${to_assigned_id}
            AND ae.role_id = ${role_id} 
            AND e.organization_id = ${organization_id} `
            :
            `SELECT 
                CONCAT(u.first_name, ' ', u.last_name) AS name,
                e.id AS employee_id, e.emp_code
            FROM employees AS e
            LEFT JOIN employee_payroll_settings AS eps ON eps.employee_id = e.id
            LEFT JOIN employee_payroll AS ep ON ep.employee_id = e.id
            INNER JOIN users AS u ON u.id = e.user_id 
            WHERE e.organization_id = ${organization_id} `;

        if (employee_id) query += ` AND e.id = ${employee_id} `;
        else if (name) query += ` AND CONCAT(u.first_name, " " , u.last_name) LIKE '%${name}%' `;
        else if (employee_type) query += ` AND JSON_EXTRACT(eps.details, '$.type') = ${employee_type} `;

        query += `  GROUP BY e.id
                    HAVING SUM(JSON_EXTRACT(ep.details, '$.tds')) > 0 
                    ORDER BY e.id `;

        if (!employee_id && !name && (skip || limit)) query += skip ? ` LIMIT ${skip}, ${limit} ;` : ` LIMIT ${limit} ;`;

        return mysql.query(query);
    }


    getEmployeeTDSData({ organization_id, employee_id, first_year, second_year }) {
        let query = `SELECT 
                            id AS employee_payroll_id,
                            CAST(month AS SIGNED) AS month,
                            CAST(year AS SIGNED) AS year,
                            CAST(
                                IF(details IS NOT NULL, JSON_EXTRACT(details, '$.tds'), 0) 
                            AS SIGNED)  AS tds_paid,
                            CAST(non_lop_gross AS SIGNED) AS gross
                    FROM employee_payroll
                    WHERE
                        organization_id = ? AND
                        employee_id = ? AND
                        CAST(
                            CONCAT(year, LPAD(month, 2, 0))
                        AS SIGNED) BETWEEN ? AND ? `;

        return mysql.query(query, [organization_id, employee_id, first_year, second_year]);
    }


    getAllEmployeeTDSData({ organization_id, first_year, second_year, empIds }) {
        let query = `SELECT 
                            employee_id,
                            SUM(non_lop_gross) AS total_gross,
                            SUM(gross) AS gross_paid,
                            SUM(JSON_EXTRACT(details, '$.tds')) AS total_tds_paid
                    FROM employee_payroll
                    WHERE
                        organization_id = ? AND
                        employee_id IN (?) AND
                        CAST(
                            CONCAT(year, LPAD(month, 2, 0))
                        AS SIGNED) BETWEEN ? AND ? 
                        GROUP BY employee_id`;

        return mysql.query(query, [organization_id, empIds, first_year, second_year]);
    }


    updatePayrollData({ payroll_id, gross, tds }) {
        let query = `UPDATE employee_payroll `;

        let updateQuery = '';
        if (gross) updateQuery = ` SET non_lop_gross = ${gross} `;
        if (tds) updateQuery += updateQuery ? `, details = JSON_SET(details, '$.tds', ${tds}) ` : ` SET details = JSON_SET(details, '$.tds', ${tds}) `;

        query += updateQuery + ` WHERE id = ${payroll_id} ;`;

        return mysql.query(query);
    }

    createPayrollData({ employee_id, organization_id, month, year, gross, tds }) {
        let query = `INSERT INTO employee_payroll 
                                (employee_id, organization_id, month, year `;

        query += gross ? `, non_lop_gross ` : '';
        query += tds ? `, details ) VALUES (?)` : ') VALUES (?)';

        let valuesToAdd = [employee_id, organization_id, month, year];
        if (gross) valuesToAdd.push(gross);
        if (tds) valuesToAdd.push(JSON.stringify({ tds }));

        return mysql.query(query, [valuesToAdd]);
    }
}

module.exports = new DeclarationModel;