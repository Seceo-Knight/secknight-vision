const mysql = require("../../../../../../database/MySqlConnection").getInstance();
const moment = require('moment');
class PayrollPreviewModel {
    constructor() {
        // getter of tables
        this.ORG_PAYROLL_POLICIES_TABLE = 'organization_payroll_policies';
        this.ORG_PAYROLL_SALARY_COMPONENT_TABLE = 'organization_payroll_salary_components';
        this.ORG_PAYROLL_POLICY_RULE_TABLE = 'organization_payroll_policy_rules';
        this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE = 'employee_payroll_settings';
        this.EMPLOYEEE_BANK_DETAILS_TABLE = 'bank_account_details';
        this.ORG_PAYROLL_SETTINGS_TABLE = 'organization_payroll_settings'
        this.PROFESSIONAL_TAX = 'professional_tax';
        this.USER_ROLE_TABLE = 'user_role';
        this.ROLES_TABLE = 'roles';
        this.ORG_LOCATIONS_TABLE = 'organization_locations';
        this.USERS_TABLE = 'users';
        this.EMPLOYEES_TABLE = 'employees';
        this.ORG_DEPARTMENTS_TABLE = 'organization_departments';
        this.EMPLOYEE_PAYROLL_TABLE = 'employee_payroll';
        this.EMPLOYEEE_DECLARATION_TABLE = 'employee_declaration'
        this.DECLARATION_COMPONENT_TABLE = "declaration_component";
        this.TAX_SCHEMES_TABLE = 'tax_schemes';
    }

    getPayrollPolicyData(organizationId) {
        let whereCondition = '';
        let whereQueryValueArr = [];
        whereCondition = ` WHERE opp.organization_id = ? `;
        whereQueryValueArr.push(organizationId);

        const query = `
            SELECT 
                opp.id as policy_id, opp.policy_name, opp.description, opp.organization_id,
                opsc.component_name, opsc.component_type,
                opr.salary_component_id, opr.rule
            FROM ${this.ORG_PAYROLL_POLICIES_TABLE} opp 
            INNER JOIN ${this.ORG_PAYROLL_POLICY_RULE_TABLE} opr ON opr.policy_id = opp.id
            INNER JOIN ${this.ORG_PAYROLL_SALARY_COMPONENT_TABLE} opsc ON opsc.id = opr.salary_component_id
            ${whereCondition};
        `;

        return mysql.query(query, whereQueryValueArr);
    }

    getEmployeeWithPayrollPolicy({ organizationId, payrollPolicyIds, limit, skip, employeeId, isCount, date, isCustomSalary = false }) {
        let whereCondition = '';
        let limitStr = '';

        if (organizationId) {
            whereCondition += whereCondition ? ` AND eps.organization_id = '${organizationId}' ` : ` WHERE eps.organization_id = '${organizationId}' `;
        }
        if (payrollPolicyIds && payrollPolicyIds.length) {
            whereCondition += whereCondition ? ` AND eps.payroll_policy_id IN (${payrollPolicyIds.toString()}) ` : ` WHERE eps.payroll_policy_id IN (${payrollPolicyIds.toString()}) `;
        }
        if (employeeId) {
            whereCondition += whereCondition ? ` AND eps.employee_id = '${employeeId}' ` : ` WHERE eps.employee_id = '${employeeId}' `;
        }

        whereCondition += whereCondition ? ` AND u.status = '1' ` : ` WHERE eps.employee_id = '${employeeId}' `;

        if (isCustomSalary) {
            whereCondition += whereCondition ? ` AND eps.salary_components IS NOT NULL ` : `  WHERE eps.salary_components IS NOT NULL `;
        }

        if (date) {
            const endOfMonth = moment(date).endOf('month').format('YYYY-MM-DD HH:mm:ss');
            whereCondition += whereCondition ? ` AND e.created_at <= '${endOfMonth}' ` : ` WHERE e.created_at <= '${endOfMonth}'  `;
        }
        if (!isCount && (limit || skip)) {
            if (skip) limitStr += ` LIMIT ${skip} `;
            if (limit) limitStr += limitStr ? `, ${limit} ` : ` LIMIT ${limit} `;
        }

        let selectStr = `
            eps.employee_id, eps.payroll_policy_id, 
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.ctc')) as ctc, JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.pf_number')) as pf_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.gross')) as gross,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.esi_number')) as esi_number, JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.uan_number')) as uan_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.eps_number')) as eps_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.pan_number')) as pan_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.eligible_pt')) as eligible_pt,
            eps.salary_on_hold,ebd.bank_name, ebd.account_number, ebd.ifsc_code, ebd.address, eps.settings,
            u.first_name, u.last_name,JSON_EXTRACT(eps.details, '$.type') AS type,
            e.location_id, CONCAT(u.first_name,' ', u.last_name) AS full_name, u.username,
            ol.name AS location, e.department_id, e.emp_code, od.name as department_name,
            GROUP_CONCAT(DISTINCT(ur.role_id)) AS role_id, GROUP_CONCAT(DISTINCT(r.name)) AS role, ts.id AS scheme_id, 
            ts.scheme, ts.details,ts.deduction_allowed, ts.standard_deduction,eps.pf_applicable,eps.esi_applicable,ts.employee_type,
            ops.contract_scheme_id, eps.salary_in_hand
        `;
        if (isCount) {
            whereCondition += whereCondition ? `AND (eps.salary_on_hold is null OR JSON_UNQUOTE(JSON_EXTRACT(eps.salary_on_hold, '$.status')) != "hold" )` : ` WHERE (eps.salary_on_hold is null OR JSON_UNQUOTE(JSON_EXTRACT(eps.salary_on_hold, '$.status')) != "hold" )`;
            selectStr = `
                count(1) AS totalCount
            `;
        }

        whereCondition += whereCondition ?
            ` AND (eps.salary_in_hand = 1 || (ebd.account_number IS NOT NULL AND LENGTH(ebd.account_number) > 0 AND ebd.ifsc_code IS NOT NULL AND LENGTH(ebd.ifsc_code) > 0)) ` :
            ` WHERE (eps.salary_in_hand = 1 || (ebd.account_number IS NOT NULL AND LENGTH(ebd.account_number) > 0 AND ebd.ifsc_code IS NOT NULL AND LENGTH(ebd.ifsc_code) > 0)) `;

        if (!isCount && isCustomSalary) {
            selectStr += ', eps.salary_components, eps.additional_components, eps.deduction_components ';
        }

        // condition to discard employee having false value in all mandatory fields
        if (isCustomSalary) {
            const discardCustomQuery = `
                (
                    CAST( JSON_EXTRACT(eps.salary_components, '$.annual_ctc') AS UNSIGNED )  OR
                    CAST( JSON_EXTRACT(eps.salary_components, '$.monthly_ctc') AS UNSIGNED ) OR
                    CAST( JSON_EXTRACT(eps.salary_components, '$.gross_salary') AS UNSIGNED ) OR
                    CAST( JSON_EXTRACT(eps.salary_components, '$.basic_allowance') AS UNSIGNED )
                )
            `;
            whereCondition += whereCondition ? ` AND ${discardCustomQuery} ` : `  WHERE ${discardCustomQuery} `;
        }

        const query = `
            SELECT
                ${selectStr}
            FROM   ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} eps
            INNER JOIN ${this.EMPLOYEES_TABLE} e on eps.employee_id = e.id
            INNER JOIN ${this.USERS_TABLE} u on u.id = e.user_id
            INNER JOIN ${this.EMPLOYEEE_BANK_DETAILS_TABLE} ebd on ebd.employee_id = eps.employee_id
            LEFT JOIN ${this.ORG_LOCATIONS_TABLE} ol ON ol.id = e.location_id
            LEFT JOIN ${this.USER_ROLE_TABLE} ur ON ur.user_id = u.id
            LEFT JOIN ${this.ROLES_TABLE} r ON r.id = ur.role_id
            LEFT JOIN ${this.ORG_DEPARTMENTS_TABLE} od ON e.department_id = od.id
            LEFT JOIN ${this.TAX_SCHEMES_TABLE} ts ON eps.admin_approved_scheme_id = ts.id
            LEFT JOIN ${this.ORG_PAYROLL_SETTINGS_TABLE} ops ON eps.organization_id = ops.organization_id
            ${whereCondition}
            GROUP BY e.id 
            ${limitStr}
        `;
        return mysql.query(query);
    }

    getOrgSettings(organizationId) {
        const query = `SELECT * FROM ?? WHERE organization_id = ? ;`;

        return mysql.query(query, [this.ORG_PAYROLL_SETTINGS_TABLE, organizationId]);
    }

    getPTSetting(organizationId) {
        const query = `SELECT * FROM ?? WHERE organization_id = ?`;

        return mysql.query(query, [this.PROFESSIONAL_TAX, organizationId]);
    }

    getEmployeeLop({ organization_id, employeeId, employeeIdArr, date, calcType }) {
        let whereArr = [];
        let whereStr = ' WHERE organization_id = ? ';
        whereArr.push(organization_id);

        if (employeeId || employeeIdArr) {
            if (employeeIdArr && employeeIdArr.length) {
                whereStr += ` AND employee_id IN ( ? ) `;
                whereArr.push(employeeIdArr);
            } else if (employeeId) {
                whereStr += ` AND employee_id = ? `;
                whereArr.push([employeeId]);
            }
        }

        if (calcType != 'M') {
            whereStr += ` AND year = ? `;
            whereArr.push(moment(date).year());
        } else {
            whereStr += ` AND month = ? `;
            whereArr.push(moment(date).month() + 1);
        }
        const query = `
            SELECT 
                employee_id, lop, present_days, working_days, lop, payout_status
            FROM ${this.EMPLOYEE_PAYROLL_TABLE}
            ${whereStr}
            GROUP BY employee_id
        `;

        return mysql.query(query, whereArr);
    }
    getEmployeeInPayrollData({ organization_id, month, year }) {
        const query = `
            SELECT  
                employee_id
            FROM ${this.EMPLOYEE_PAYROLL_TABLE}
            WHERE 
                organization_id = ? AND 
                month = ? AND
                year = ?
        `;
        return mysql.query(query, [organization_id, month, year]);
    }

    insertEmployeePayrollData({ gross, netpay, details, organization_id, month, year, employee_id, salary_hold, non_lop_gross = null }) {
        let insertBodyObj = { employee_id, year, month, organization_id };
        if (gross) insertBodyObj.gross = gross;
        if (netpay) insertBodyObj.netpay = netpay;
        if (details) insertBodyObj.details = JSON.stringify(details);
        if (salary_hold) insertBodyObj.salary_hold = JSON.stringify(salary_hold);
        if (non_lop_gross) insertBodyObj.non_lop_gross = non_lop_gross;

        const query = `
            INSERT INTO ${this.EMPLOYEE_PAYROLL_TABLE} SET ?
        `;
        return mysql.query(query, insertBodyObj);
    }

    updateEmployeePayrollData({ organization_id, year, month, employee_id }, updateBody) {
        if (
            !organization_id ||
            !year ||
            !month ||
            !employee_id
        ) return null;

        let setStr = '';
        let updateArr = [];
        if (updateBody.gross) {
            setStr += setStr ? ` , ` : setStr;
            setStr += ` gross = ? `;
            updateArr.push(updateBody.gross)
        }
        if (updateBody.netpay) {
            setStr += setStr ? ` , ` : setStr;
            setStr += ` netpay = ? `;
            updateArr.push(updateBody.netpay)
        }
        if (updateBody.details) {
            setStr += setStr ? ` , ` : setStr;
            setStr += ` details = ? `;
            updateArr.push(JSON.stringify(updateBody.details))
        }

        if (updateBody.salary_hold) {
            setStr += setStr ? ` , ` : setStr;
            setStr += ` salary_hold = ? `;
            updateArr.push(JSON.stringify(updateBody.salary_hold))
        }

        if (updateBody.non_lop_gross) {
            setStr += setStr ? ` , ` : setStr;
            setStr += ` non_lop_gross = ? `;
            updateArr.push(updateBody.non_lop_gross)
        }

        if (!setStr) return null;

        const query = `
            UPDATE 
                ${this.EMPLOYEE_PAYROLL_TABLE}
            SET
                ${setStr}
            WHERE 
                organization_id = ${organization_id} AND 
                year = ${year} AND 
                month = ${month} AND
                employee_id = ${employee_id}
        `;
        return mysql.query(query, updateArr);

    }

    getemployeeDeclarations({ employee_id, financial_year, organization_id }) {
        let whereStr = '';
        let whereArr = [];

        if (employee_id) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} ed.employee_id = ? `;
            whereArr.push(employee_id);
        }

        if (financial_year) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} ed.financial_year = ? `;
            whereArr.push(financial_year);
        }

        if (organization_id) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} ed.organization_id = ? `;
            whereArr.push(organization_id);
        }

        // DEFAULT CONDITION, take old tax schema is not present
        // discard the row for the employee which don't have deduction allowed
        const seperator = whereStr ? ` AND  ` : ` WHERE `;
        whereStr += ` AND (
            ts.id IS NULL OR (
                ts.id IS NOT NULL AND
                ts.deduction_allowed = 1
            ) OR
            eps.id IS NULL
        ) `;

        const query = `
            SELECT 
                ed.id as declaration_id, ed.financial_year, ed.declared_amount, ed.employee_id,
                ed.status as approved_status, ed.comments, ed.information, ed.declaration_component_id, ed.approved_amount,
                dc.deduction_name, dc.section, dc.amount_limit, dc.section_limit, dc.status, dc.is_other_income
            FROM ${this.EMPLOYEEE_DECLARATION_TABLE} ed
            INNER JOIN ${this.DECLARATION_COMPONENT_TABLE} dc ON ed.declaration_component_id = dc.id
            LEFT JOIN ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} eps ON eps.employee_id = ed.employee_id
            LEFT JOIN ${this.TAX_SCHEMES_TABLE} ts ON ts.id = eps.admin_approved_scheme_id
            ${whereStr}
        `;
        return mysql.query(query, whereArr);
    }

    getSectionDeclarationLimit() {
        const query = `
            SELECT 
                section, section_limit, amount_limit
            FROM ${this.DECLARATION_COMPONENT_TABLE}
        `;
        return mysql.query(query);
    }

    /**
   * Get scheme list.
   * @function listScheme
   * @returns {*} Success or Error
   */
    getDefaultScheme() {
        const query = `SELECT id AS scheme_id, scheme, details,	deduction_allowed,standard_deduction,employee_type
                       FROM tax_schemes 
                       WHERE status = 1`;

        return mysql.query(query);
    }
    checkPreviewDataExists({ year, month, organization_id }) {
        const query = `
         SELECT EXISTS (
            SELECT
                id
            FROM ${this.EMPLOYEE_PAYROLL_TABLE}
            WHERE
                year = ? AND
                month = ? AND
                organization_id = ? AND
                details IS NOT NULL
         ) AS has_preview_data
        `;
        return mysql.query(query, [year, month, organization_id]);
    }
    getExistingPreviewData({ organization_id, limit, skip, employeeId, isCount, year, month }) {
        let limitStr = '';
        let whereStr = '';
        let whereArr = [];
        if (!isCount && (limit || skip)) {
            if (skip) limitStr += ` LIMIT ${skip} `;
            if (limit) limitStr += limitStr ? `, ${limit} ` : ` LIMIT ${limit} `;
        }

        let selectColStr = ` details,salary_hold `;
        if (isCount) {
            selectColStr = ` count(1) AS totalCount `;
        }
        if (employeeId) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} employee_id = ? `;
            whereArr.push(employeeId);
        }

        if (organization_id) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} organization_id = ? `;
            whereArr.push(organization_id);
        }

        if (year) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} year = ? `;
            whereArr.push(year);
        }

        if (month) {
            const seperator = whereStr ? ` AND  ` : ` WHERE `;
            whereStr += ` ${seperator} month = ? `;
            whereArr.push(month);
        }
        // DEFAULT CONDITION,
        const seperator = whereStr ? ` AND  ` : ` WHERE `;
        whereStr += `
            ${seperator}
            details IS NOT NULL
        `;
        let query = `
            SELECT
                ${selectColStr}
            FROM ${this.EMPLOYEE_PAYROLL_TABLE}
            ${whereStr}
            ${limitStr}
        `;

        return mysql.query(query, whereArr);
    }

    /**
     * getEmployeeExistStatus - function to check the status
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getEmployeeExistStatus({ organization_id, employee_id }) {
        let query = `
            SELECT
                id
            FROM ${this.EMPLOYEES_TABLE} 
            WHERE
                organization_id = ? AND
                id = ?
        `;
        return mysql.query(query, [organization_id, employee_id]);
    }
    // getEmployeeWithCustomSalary({ organizationId, limit, skip, employeeId, isCount, date }) {
    //     let whereCondition = '';
    //     let limitStr = '';

    //     if (organizationId) {
    //         whereCondition += whereCondition ? ` AND eps.organization_id = '${organizationId}' ` : ` WHERE eps.organization_id = '${organizationId}' `;
    //     }

    //     if (employeeId) {
    //         whereCondition += whereCondition ? ` AND eps.employee_id = '${employeeId}' ` : ` WHERE eps.employee_id = '${employeeId}' `;
    //     }
    //     if (date) {
    //         const endOfMonth = moment(date).endOf('month').format('YYYY-MM-DD HH:mm:ss');
    //         whereCondition += whereCondition ? ` AND e.created_at <= '${endOfMonth}' ` : ` WHERE e.created_at <= '${endOfMonth}'  `;
    //     }
    //     whereCondition += whereCondition ? ` AND eps.salary_components IS NOT NULL ` : `  WHERE eps.salary_components IS NOT NULL `;
    //     if (!isCount && (limit || skip)) {
    //         if (skip) limitStr += ` LIMIT ${skip} `;
    //         if (limit) limitStr += limitStr ? `, ${limit} ` : ` LIMIT ${limit} `;
    //     }

    //     let selectStr = `
    //         eps.employee_id, eps.salary_components, 
    //         JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.pf_number')) as pf_number,
    //         JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.esi_number')) as esi_number, JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.uan_number')) as uan_number,
    //         JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.eps_number')) as eps_number,
    //         JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.pan_number')) as pan_number,
    //         ebd.bank_name, ebd.account_number, ebd.ifsc_code, ebd.address, eps.settings,
    //         u.first_name, u.last_name,eps.admin_approved_scheme_id AS scheme_id,
    //         e.location_id, CONCAT(u.first_name,' ', u.last_name) AS full_name, u.username,
    //         ol.name AS location, e.department_id, e.emp_code, od.name as department_name,
    //         GROUP_CONCAT(DISTINCT(ur.role_id)) AS role_id, GROUP_CONCAT(DISTINCT(r.name)) AS role, eps.pf_applicable,eps.esi_applicable,
    //         JSON_EXTRACT(eps.details, '$.type') AS type
    //     `;
    //     if (isCount) {
    //         selectStr = `
    //             count(1) AS totalCount
    //         `;
    //     }

    //     const query = `
    //         SELECT
    //             ${selectStr}
    //         FROM   ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} eps
    //         INNER JOIN ${this.EMPLOYEES_TABLE} e on eps.employee_id = e.id
    //         INNER JOIN ${this.USERS_TABLE} u on u.id = e.user_id
    //         LEFT JOIN ${this.EMPLOYEEE_BANK_DETAILS_TABLE} ebd on ebd.employee_id = eps.employee_id
    //         LEFT JOIN ${this.ORG_LOCATIONS_TABLE} ol ON ol.id = e.location_id
    //         LEFT JOIN ${this.USER_ROLE_TABLE} ur ON ur.user_id = u.id
    //         LEFT JOIN ${this.ROLES_TABLE} r ON r.id = ur.role_id
    //         LEFT JOIN ${this.ORG_DEPARTMENTS_TABLE} od ON e.department_id = od.id
    //         ${whereCondition}
    //         GROUP BY e.id 
    //         ${limitStr}
    //     `;
    //     return mysql.query(query);
    // }

    /**
     * getEmployeePreviousPayments - get employee previous payements
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    getEmployeePreviousPayments({ organization_id, employee_id, date, financial_year }) {
        const year = moment(date).format('YYYY');
        const datePrevMonth = moment(date).subtract(1, 'months').format('MM');
        const [fyStartYear, fyEndYear] = financial_year.split('-').map(y => +y);
        const fyStartMonth = 4; //April
        const fyStart_YYYYMM = Number(String(fyStartYear) + String(fyStartMonth).padStart(2, 0));
        const fyEnd_YYYYMM = Number(String(year == fyStartYear || datePrevMonth >= fyStartMonth ? fyStartYear : fyEndYear) + String(datePrevMonth).padStart(2, 0));
        const queryParamArr = [organization_id, fyStart_YYYYMM, fyEnd_YYYYMM];

        let query = `
            SELECT 
                employee_id, SUM(non_lop_gross) AS gross_paid, 
                SUM(json_extract(details, '$.tds')) AS tds_paid
            FROM ${this.EMPLOYEE_PAYROLL_TABLE}
            WHERE
                details is not null AND
                organization_id = ? AND
                CAST(
                    CONCAT(year, LPAD(month, 2, 0))
                AS SIGNED) BETWEEN ? AND ?
        `;

        if (employee_id) {
            query += ' AND employee_id = ? ';
            queryParamArr.push(employee_id);
        }

        query += ' GROUP BY employee_id ';

        return mysql.query(query, queryParamArr);
    }

    /**
     * getEmployeeIncomeFromPreviousEmployer - get employee previous earning from employer
     *
     * @param {*} param0
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getEmployeeIncomeFromPreviousEmployer({ organization_id, employee_id, financial_year }) {
        const INCOME_FROM_PREVIOUS_EMPLOYER = 'Income From Previous Employer';

        const queryParamArr = [INCOME_FROM_PREVIOUS_EMPLOYER, organization_id, financial_year];

        let query = `
            SELECT
                ed.employee_id, SUM(JSON_EXTRACT(ed.information, "$.incomeFromPreviousEmployer.income")) as earnings,
                SUM(JSON_EXTRACT(ed.information, "$.incomeFromPreviousEmployer.taxDeduction")) AS tds
            FROM ${this.EMPLOYEEE_DECLARATION_TABLE} ed
            INNER JOIN ${this.DECLARATION_COMPONENT_TABLE} dc ON dc.id = ed.declaration_component_id
            where
                ed.status = 1 AND
                dc.deduction_name = ? AND
                ed.organization_id  = ? AND
                ed.financial_year = ?
        `;
        if (employee_id) {
            query += ' AND employee_id = ? ';
            queryParamArr.push(employee_id);
        }
        query += ' GROUP BY employee_id ';

        return mysql.query(query, queryParamArr);
    }

    /**
     * getEmployeeSalaryHoldData - function to fetch salary hold details
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns return data from mysql or error
     * @author Mahesh D <maheshd@globussoft.in>
     */
    getEmployeeSalaryHoldData({ employee_id, startMonth, endMonth, year, salaryStructure }) {
        const query = `
            SELECT  
            SUM(${salaryStructure}) as totalAmount
            FROM ${this.EMPLOYEE_PAYROLL_TABLE}
            WHERE 
                employee_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(salary_hold, '$.isSalaryHold')) = ? AND (month BETWEEN ? AND ?) AND year = ?
        `;

        return mysql.query(query, [employee_id, 'true', startMonth, endMonth, year]);

    }

    /**
     * getTdsScheme - function to get all the permenent employee TDS scheme
     * 
     * @author Amit Verma <amitverma@globussoft.in>
     * @returns
     */
    getTdsScheme() {
        const query = `
            SELECT    
                ts.id AS scheme_id, ts.scheme, 
                ts.details, ts.deduction_allowed,
                ts.standard_deduction, ts.employee_type
            FROM ${this.TAX_SCHEMES_TABLE} ts 
            WHERE ts.employee_type = 2
        `;

        return mysql.query(query);
    }

}
module.exports = new PayrollPreviewModel;