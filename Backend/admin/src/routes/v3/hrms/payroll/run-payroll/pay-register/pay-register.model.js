const mysql = require("../../../../../../database/MySqlConnection").getInstance();
const moment = require('moment');

class RunPayrollPayRegisterModel {
    get EMPLOYEE_PAYROLL_SETTINGS_TABLE() {
        return 'employee_payroll_settings';
    }
    get USER_ROLE_TABLE() {
        return 'user_role';
    }
    get EMPLOYEEE_BANK_DETAILS_TABLE() {
        return 'bank_account_details';
    }
    get ROLES_TABLE() {
        return 'roles';
    }
    get ORG_LOCATIONS_TABLE() {
        return 'organization_locations';
    }
    get USERS_TABLE() {
        return 'users';
    }
    get EMPLOYEES_TABLE() {
        return 'employees';
    }
    get ORG_DEPARTMENTS_TABLE() {
        return 'organization_departments';
    }
    get EMPLOYEE_PAYROLL_TABLE() {
        return 'employee_payroll';
    }
    get ORG_PAYROLL_SETTINGS_TABLE() {
        return 'organization_payroll_settings'
    }

    getComponents(component) {
        switch (component) {
            /** PF employee filter */
            case 1:
                return ` AND eps.pf_applicable = 1 `;
            /** ESI employee filter */
            case 2:
                return ` AND eps.esi_applicable = 1 `;
            /** TDS employee filter */
            case 3:
                return ` AND JSON_UNQUOTE(JSON_EXTRACT(ep.details,'$.tds')) > 0 `;
            /** Salary in hand employee filter */
            case 4:
                return ` AND JSON_EXTRACT(ep.details,'$.isSalaryInHand') = true `;
            /** Default nothing added */
            default:
                return '';
        }
    }


    async getPayRegister({ skip, limit, isCount, organization_id, date, employee_type, components, to_assigned_id, role_id }) {
        const month = moment(date).month() + 1;
        const year = moment(date).year();
        let whereArr = [];
        let whereStr = ' WHERE ep.organization_id = ? AND ep.year = ? AND ep.month = ?';
        whereArr.push(organization_id, year, month);

        //default condition to discard not processed payroll
        whereStr += ' AND ep.details IS NOT NULL ';
        if (employee_type && employee_type != 0) whereStr += ` AND JSON_EXTRACT(eps.details, '$.type') = ${employee_type}`;
        if (components) whereStr += this.getComponents(components);

        let limitStr = '';
        let selectStr = `
            eps.employee_id, ep.total_days, ep.present_days, ep.lop, ep.gross, ep.netpay, ep.details,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.ctc')) AS ctc,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.pf_number')) AS pf_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.esi_number')) AS esi_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.uan_number')) AS uan_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.eps_number')) AS eps_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.pan_number')) AS pan_number,
            JSON_UNQUOTE(JSON_EXTRACT(eps.salary_on_hold, '$.status')) as salry_hold,eps.salary_on_hold,
            ebd.bank_name, ebd.account_number, ebd.ifsc_code, ebd.address,
            u.first_name, u.last_name,
            e.location_id, CONCAT(u.first_name,' ', u.last_name) AS full_name, u.username,
            ol.name AS location, e.department_id, e.emp_code, od.name AS department_name,
            GROUP_CONCAT(ur.role_id) AS role_id, GROUP_CONCAT(r.name) AS role
        `;

        if (isCount) selectStr = ` count(1) AS totalCount `;
        if (!isCount && skip != null && limit != null) {
            if (skip) limitStr += ` LIMIT ${skip} `;
            if (limit) limitStr += limitStr ? `, ${limit} ` : ` LIMIT ${limit} `;
        }

        let query;
        if (to_assigned_id) {
            query = `
                SELECT
                    ${selectStr}
                FROM assigned_employees ae
                LEFT JOIN ${this.EMPLOYEE_PAYROLL_TABLE} ep ON ep.employee_id=ae.employee_id
                INNER JOIN ${this.EMPLOYEES_TABLE} e ON ep.employee_id = e.id
                INNER JOIN ${this.USERS_TABLE} u ON u.id = e.user_id
                LEFT JOIN ${this.EMPLOYEE_PAYROLL_SETTINGS_TABLE} eps ON eps.employee_id = ep.employee_id
                LEFT JOIN ${this.ORG_LOCATIONS_TABLE} ol ON ol.id = e.location_id
                LEFT JOIN ${this.USER_ROLE_TABLE} ur ON ur.user_id = u.id
                LEFT JOIN ${this.EMPLOYEEE_BANK_DETAILS_TABLE} ebd on ebd.employee_id = eps.employee_id
                LEFT JOIN ${this.ROLES_TABLE} r ON r.id = ur.role_id
                LEFT JOIN ${this.ORG_DEPARTMENTS_TABLE} od ON e.department_id = od.id
                ${whereStr} AND ae.to_assigned_id=${to_assigned_id} AND ae.role_id=${role_id}
                GROUP BY e.id 
                ${limitStr}
            `;
        }
        else {
            query = `
                SELECT
                    ${selectStr}
                FROM   ${this.EMPLOYEE_PAYROLL_TABLE} ep
                INNER JOIN ${this.EMPLOYEES_TABLE} e ON ep.employee_id = e.id
                INNER JOIN ${this.USERS_TABLE} u ON u.id = e.user_id
                LEFT JOIN ${this.EMPLOYEE_PAYROLL_SETTINGS_TABLE} eps ON eps.employee_id = ep.employee_id
                LEFT JOIN ${this.ORG_LOCATIONS_TABLE} ol ON ol.id = e.location_id
                LEFT JOIN ${this.USER_ROLE_TABLE} ur ON ur.user_id = u.id
                LEFT JOIN ${this.EMPLOYEEE_BANK_DETAILS_TABLE} ebd on ebd.employee_id = eps.employee_id
                LEFT JOIN ${this.ROLES_TABLE} r ON r.id = ur.role_id
                LEFT JOIN ${this.ORG_DEPARTMENTS_TABLE} od ON e.department_id = od.id
                ${whereStr}
                GROUP BY e.id 
                ${limitStr}
            `;
        }

        return mysql.query(query, whereArr)
    }

    /**
     * getOrgSettings - function to get org components
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getOrgSettings({ organization_id }) {
        let query = `
            SELECT 
                components, settings
            FROM ${this.ORG_PAYROLL_SETTINGS_TABLE}
            WHERE
                organization_id = ?
        `;

        return mysql.query(query, [organization_id]);
    }
}

module.exports = new RunPayrollPayRegisterModel;