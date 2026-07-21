const mySql = require('../../../../database/MySqlConnection').getInstance();
const { isString, arrayify } = require('./commonBulk.helper');

class CommonBulkModel {
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

        return mySql.query(query, whereArr);
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

        return mySql.query(query, { salary_components, employee_id, organization_id, additional_components, deduction_components })
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

        return mySql.query(query, [salary_components, additional_components, deduction_components, employee_id])
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
            SELECT 
                id, employee_id, salary_components, additional_components, deduction_components
            FROM ${this.EMP_PAYROLL_SETTINGS_TABLE}
            WHERE
                employee_id  IN (?)
        `;
        return mySql.query(query, [arrayify(employeeIds)]);
    }

    getBasicInfoByEmpCode({ organization_id, emp_mails }) {
        let query = `
            SELECT
                eps.id,eps.employee_id, eps.details, e.emp_code, u.email AS employee_unique_id
            FROM ${this.EMP_PAYROLL_SETTINGS_TABLE} eps 
            INNER JOIN ${this.EMPLOYEES_TABLE} e ON e.id =eps.employee_id
            INNER JOIN ${this.USERS_TABLE} u ON u.id=e.user_id
            WHERE 
                e.organization_id = ? AND
                u.email IN (?) 
        `;
        return mySql.query(query, [organization_id, emp_mails])
    }

    getEmployeesByEmpUniqueId({ organization_id, employee_unique_ids }) {
        let query = `
            SELECT
                e.id AS employeeId, e.emp_code, u.email AS employee_unique_id
            FROM ${this.EMPLOYEES_TABLE} e
            INNER JOIN ${this.USERS_TABLE} u ON u.id=e.user_id
            WHERE
                e. organization_id = ? AND
                u.email IN (?)
        `;
        return mySql.query(query, [organization_id, employee_unique_ids]);
    }

    /**
    * Add Employee basic details
    *
    * @function addBasicInfo
    * @memberof  InformationModel
    * @param {Number} organization_id
    * @param {Number} employee_id
    * @param {*} details
    * @returns {8} -  return promise.
    */
    addBasicInfo(organization_id, employee_id, details, settings, eligible_esi, eligible_pf) {
        let query = `
            INSERT INTO ${this.EMP_PAYROLL_SETTINGS_TABLE}
                (employee_id, organization_id, details, settings, esi_applicable, pf_applicable)
            VALUES(?, ?, ?, ?, ?, ?)
        `;
        return mySql.query(query, [employee_id, organization_id, details, settings, eligible_esi, eligible_pf])
    }

    /**
    * Update Employee basic details
    *
    * @function updateBasicInfo
    * @memberof  InformationModel
    * @param {Number} organization_id
    * @param {Number} employee_id
    * @param {*} details
    * @returns {Array} -  return promise.
    */
    updateBasicInfo(organization_id, employee_id, details, settings, eligible_esi, eligible_pf) {
        let query = `
            UPDATE ${this.EMP_PAYROLL_SETTINGS_TABLE}
            SET
                details = ?, settings = ?,
                esi_applicable = ? ,pf_applicable = ? 
            WHERE
                employee_id = ? AND organization_id = ?
        `;
        return mySql.query(query, [details, settings, eligible_esi, eligible_pf, employee_id, organization_id]);
    }


    getBasicDetailsByEmpIds({ ids, organization_id }) {
        let query = `
            SELECT
                e.id, e.user_id, eps.details, u.address, eps.employee_id,
                u.contact_number AS phone, u.a_email as email, u.email AS employee_unique_id
            FROM ${this.EMPLOYEES_TABLE} e
            INNER JOIN ${this.USERS_TABLE} u ON u.id = e.user_id
            LEFT JOIN ${this.EMP_PAYROLL_SETTINGS_TABLE} eps ON e.id = eps.employee_id
            WHERE
                e.id IN (?) AND 
                e.organization_id = ?
        `;
        return mySql.query(query, [ids, organization_id]);
    }

    updateUsers(id, a_email, contact_number) {
        let query = `UPDATE ${this.USERS_TABLE} SET `;
        let params = [];
        let queryArr = [];
        if (a_email) {
            queryArr.push(` a_email= ?`);
            params.push(a_email);
        }
        if (contact_number) {
            queryArr.push(` contact_number= ?`);
            params.push(contact_number);
        }
        if (params.length !== 0 && queryArr.length !== 0) {
            query += queryArr
            params.push(id)
            query += ` WHERE id=?`
            return mySql.query(query, params);
        }
        return;
    }

    bulkInsertBasicDetails(params) {
        let query = `INSERT INTO ${this.EMP_PAYROLL_SETTINGS_TABLE} (employee_id, organization_id,details) VALUES ?`;
        return mySql.query(query, [params]);
    }

    /**
    * Update Employee basic details
    *
    * @function bulkUpdateBasicInfo
    * @memberof  InformationModel
    * @param {Number} organization_id
    * @param {Number} employee_id
    * @param {*} details
    * @returns {Array} -  return promise.
    */
    bulkUpdateBasicInfo(organization_id, employee_id, details) {
        let query = `UPDATE employee_payroll_settings
                     SET details=?
                     WHERE employee_id=?  AND organization_id=?`
        return mySql.query(query, [details, employee_id, organization_id]);
    }

    bulkUpdateBankDetails(employee_id, bank_name, account_number, ifsc_code, address, organization_id) {
        let params = [];
        let query = ` UPDATE bank_account_details SET  `;
        let queryArray = [];

        if (bank_name) {
            queryArray.push(` bank_name = ? `);
            params.push(bank_name)
        }

        if (account_number) {
            queryArray.push(` account_number = ? `);
            params.push(account_number)
        }

        if (ifsc_code) {
            queryArray.push(` ifsc_code = ? `);
            params.push(ifsc_code)
        }

        if (address) {
            queryArray.push(` address= ? `);
            params.push(address)
        }

        if (queryArray.length != 0 && params.length != 0) {
            query += queryArray;

            query += `  WHERE employee_id = ? AND organization_id = ? `
            params.push(employee_id, organization_id);

            return mySql.query(query, params);
        }

        return null;

    }

    bulkInsertBankDetails(params) {
        let query = 'INSERT INTO `bank_account_details` (`employee_id`, `bank_name`, `account_number`, `ifsc_code`, `address`, `organization_id`) VALUES ?';
        return mySql.query(query, [params]);

    }

    getBankDetailsByEmpUniqueIds({ employee_unique_ids, organization_id }) {
        let query = `
            SELECT 
                b.employee_id, b.bank_name, b.account_number, b.ifsc_code, b.address
            FROM bank_account_details b
            INNER JOIN employees e ON e.id=b.employee_id
            INNER JOIN users u ON u.id=e.user_id
            WHERE 
                u.email IN (?) AND
                e.organization_id = ?
        `;

        return mySql.query(query, [employee_unique_ids, organization_id]);
    }
}
module.exports = new CommonBulkModel;