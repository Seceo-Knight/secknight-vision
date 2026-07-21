const mysql = require("../../../../../database/MySqlConnection").getInstance();
const { arrayify, isString } = require("./custom-salary.helper");

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
     * getEmployees - get employee
     * 
     * @param {*} param0
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getEmployees({ organization_id, mail_id, employee_id }) {

        let whereStr = '';
        let whereArr = [];

        if (organization_id) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} e.organization_id = ? `;
            whereArr.push(organization_id);
        }

        if (employee_id) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} e.id = ? `;
            whereArr.push(employee_id);
        }

        if (mail_id) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} u.email IN (?) `;
            whereArr.push(arrayify(mail_id));
        }

        let query = `
            SELECT e.id AS employee_id,u.email AS mail_id
            FROM ${this.EMPLOYEES_TABLE} e
            INNER JOIN ${this.USERS_TABLE} u ON u.id=e.user_id
            ${whereStr}
        `;

        return mysql.query(query, whereArr);
    }

    /**
     * getOrganizationPayrollSettings - get organization payroll settings
     * 
     * @param {*} param0
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getOrganizationPayrollSettings(organization_id) {
        let query = `
            SELECT * 
            FROM ${this.ORG_PAYROLL_SETTINGS_TABLE}
            WHERE   
                organization_id=?
        `;
        return mysql.query(query, [organization_id]);
    }

    /**
     * getEmployeePayrollSettings - get employee payroll settings
     * 
     * @param {*} param0
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getEmployeePayrollSettings(employeeIds) {
        let query = `
            SELECT id, employee_id, salary_components,
            additional_components,deduction_components
            FROM ${this.EMP_PAYROLL_SETTINGS_TABLE}
            WHERE
                employee_id  IN (?)
        `;
        return mysql.query(query, [arrayify(employeeIds)]);
    }

    /**
     * createEmployeeSalaryComponents - create employee salary components
     * 
     * @param {*} param0
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    createEmployeeSalaryComponents({ salary_components, employee_id, organization_id, additional_components = [], deduction_components = [] }) {
        salary_components = isString(salary_components) ? salary_components : JSON.stringify(salary_components);
        additional_components = isString(additional_components) ? additional_components : JSON.stringify(additional_components);
        deduction_components = isString(deduction_components) ? deduction_components : JSON.stringify(deduction_components);
        let query = `
            INSERT INTO ${this.EMP_PAYROLL_SETTINGS_TABLE} SET ?  
        `;

        return mysql.query(query, { salary_components, employee_id, organization_id, additional_components, deduction_components })
    }

    /**
     * updateEmployeeSalaryComponents - update employee salary components
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    updateEmployeeSalaryComponents({ salary_components, employee_id, additional_components = [], deduction_components = [] }) {
        salary_components = isString(salary_components) ? salary_components : JSON.stringify(salary_components);
        additional_components = isString(additional_components) ? additional_components : JSON.stringify(additional_components);
        deduction_components = isString(deduction_components) ? deduction_components : JSON.stringify(deduction_components);

        let query = `
            UPDATE ${this.EMP_PAYROLL_SETTINGS_TABLE}
            SET
                salary_components = ?, additional_components = ?,
                deduction_components = ?
            WHERE
                employee_id = ?
        `;

        return mysql.query(query, [salary_components, additional_components, deduction_components, employee_id])
    }


    getEmployeeCustomSalary({ skip = 0, limit, name, organization_id, employee_type, employee_id, order, sort, countQuery = false, isSalaryComponentNeeded = false, employee_ids = [] }) {
        let params = [organization_id]
        let query = "";

        if (countQuery) {
            query += `
                SELECT
                    count(e.id) as totalCount
                FROM employees e
                LEFT JOIN employee_payroll_settings eps ON e.id=eps.employee_id
                INNER JOIN users u on u.id = e.user_id
                where 
                    e.organization_id = ? 
                    AND u.status = 1 
            `;
        } else {
            query += `
                SELECT
                    e.id as employee_id,eps.salary_components,e.organization_id,CONCAT(u.first_name," ",u.last_name) AS name,
                    e.emp_code,u.email as mail_id, u.a_email as email,eps.additional_components, eps.deduction_components
                FROM employees e
                LEFT JOIN employee_payroll_settings eps ON e.id=eps.employee_id
                INNER JOIN users u on u.id = e.user_id
                where
                    e.organization_id = ? 
                    AND u.status = 1
            `;
        }
        if (employee_type && employee_type != 0) query += ` AND JSON_EXTRACT(eps.details, '$.type') = ${employee_type}`;

        if (name) {
            query += `
                AND (
                    CONCAT(u.first_name," ",u.last_name) LIKE '%${name}%' OR
                    e.emp_code LIKE '%${name}%' OR
                    u.email LIKE '%${name}%' OR
                    u.a_email LIKE '%${name}%'
                )
            `;
        }

        if (isSalaryComponentNeeded) {
            query += ` AND eps.salary_components IS NOT NULL `;
        }

        if (employee_id) {
            query += ` AND e.id = ${employee_id} `;
        }

        if (employee_ids.length) {
            query += ` AND e.id IN ( ? ) `;
            params.push(employee_ids);
        }

        if (limit && !countQuery) {
            query += ` GROUP BY e.id LIMIT ?, ?`;
            params.push(skip, limit);
        }

        return mysql.query(query, params);

    }

    /**
     * updateOrgPayrollSetting - function to update the org settings
     * 
     * @param {*} components 
     * @param {*} organization_id 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    updateOrgPayrollSettings(components, organization_id) {
        let query = `
            UPDATE ${this.ORG_PAYROLL_SETTINGS_TABLE}
            SET components = ?
            WHERE organization_id = ?
        `;
        return mysql.query(query, [components.toString(), organization_id]);
    }

    // /**
    //  * removeEmployeeSalaryComponents- function to remove a salary components
    //  * 
    //  * @param {*} organization_id 
    //  * @param {*} remove_components 
    //  * @returns 
    //  * @author Amit Verma <amitverma@globussoft.in>
    //  */
    // removeEmployeeSalaryComponents(organization_id, remove_components) {
    //     if (!organization_id) return null;
    //     if (!remove_components.length) return null;
    //     let removeSalaryComponents = remove_components.map(rc => `'$.${rc}'`);
    //     let query = `
    //         UPDATE ${this.EMP_PAYROLL_SETTINGS_TABLE}
    //         SET salary_components = JSON_REMOVE(salary_components, ${removeSalaryComponents.toString()})
    //         WHERE 
    //             organization_id = ?
    //     `;
    //     return mysql.query(query, [organization_id])
    // }

    /**
     * getRemoveComponentsExistsStatus - function to get components used status
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getRemoveComponentsExistsStatus({ organization_id, remove_components }) {
        if (!organization_id) return null;
        if (!remove_components.length) return null;
        let removeSalaryComponents = remove_components.map(rc => `MAX(!ISNULL(JSON_EXTRACT(salary_components, '$.${rc}'))) AS \`${rc}\` `);
        let query = `
            SELECT 
                ${removeSalaryComponents}           
            FROM ${this.EMP_PAYROLL_SETTINGS_TABLE}
            where
                salary_components is not null AND
                organization_id = ?
            GROUP BY organization_id
        `;
        return mysql.query(query, [organization_id]);
    }

    removeComponentsFromEmployee({ organization_id, employee_id, salary_components }) {

        if (!organization_id) return null;
        if (!Object.keys(salary_components).length) return null;
        let query = `UPDATE ${this.EMP_PAYROLL_SETTINGS_TABLE} SET salary_components = ?
         where organization_id = ? and employee_id = ?
        `;
        return mysql.query(query, [salary_components, organization_id, employee_id]);
    }

    getEmployeeAssignedToManager(manager_id, role_id) {
        const query = `
            SELECT 
                employee_id
            FROM assigned_employees
            WHERE 
                to_assigned_id = ? AND role_id = ?
        `;
        return mysql.query(query, [manager_id, role_id])
    }
}

module.exports = new DeclarationModel;