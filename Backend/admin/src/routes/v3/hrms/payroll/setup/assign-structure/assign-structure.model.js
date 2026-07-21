const mysql = require("../../../../../../database/MySqlConnection").getInstance();

class PayrollAssignStructureModel {

    // getter of tables
    constructor() {
        this.ORG_PAYROLL_POLICIES_TABLE = 'organization_payroll_policies';
        this.ORG_PAYROLL_SALARY_COMPONENT_TABLE = 'organization_payroll_salary_components';
        this.ORG_PAYROLL_POLICY_RULE_TABLE = 'organization_payroll_policy_rules';
        this.USERS_TABLE = 'users';
        this.EMPLOYEES_TABLE = 'employees';
        this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE = 'employee_payroll_settings';
        this.USER_ROLE_TABLE = 'user_role';
        this.ROLES_TABLE = 'roles';
        this.ORG_LOCATIONS_TABLE = 'organization_locations';
        this.ORG_PAYROLL_SETTINGS_TABLE = 'organization_payroll_settings';
    }

    /**
     * checkPayrollPolicyExists - function to chech payroll policy exists or not
     * @param {*} policyName 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    checkPayrollPolicyExists(id, organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT *
                FROM ${this.ORG_PAYROLL_POLICIES_TABLE}
                WHERE id = ? AND organization_id = ?
            ) as has_payroll_policy;
         `;
        return mysql.query(query, [id, organizationId]);
    }

    /**
     * checkEmployeeExists - function to check employee exist or not
     * @param {s} employeeId 
     * @param {*} organizationId 
     * @returns 
     */
    checkEmployeeExists(employeeId, organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT *
                FROM ${this.EMPLOYEES_TABLE}
                WHERE id = ? AND organization_id = ?
            ) as has_employee;
        `;
        return mysql.query(query, [employeeId, organizationId]);
    }

    /**
     * checkEmployeePayrollSettingExists - function to check employee payroll setting exist or not
     * @param {s} employeeId 
     * @param {*} organizationId 
     * @returns 
     */
    checkEmployeePayrollSettingExists(employeeId, organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT id
                FROM ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE}
                WHERE employee_id = ? AND organization_id = ?
            ) as has_employee_payroll_setting;
        `;
        return mysql.query(query, [employeeId, organizationId]);
    }

    /**
     * checkPayrollPolicyExistsById - function to chech payroll policy exists or not
     * @param {*} policyName 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    checkPayrollPolicyExistById(id) {
        const query = `
            SELECT EXISTS (
                SELECT *
                FROM ${this.ORG_PAYROLL_POLICIES_TABLE}
                WHERE id = ?
            ) as has_payroll_policy;
         `;
        return mysql.query(query, [id]);
    }

    /**
     * createOrganizationPayrollPolicy - function to create the payroll policy
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    createOrganizationPayrollPolicy({ policyName, description, organizationId }) {
        const insertObj = {
            policy_name: policyName,
            description: description,
            organization_id: organizationId
        };
        const query = `
            INSERT INTO ${this.ORG_PAYROLL_POLICIES_TABLE}  SET ?
        `;
        return mysql.query(query, insertObj);
    }

    /**
     * checkSalaryComponentExists - function to check the salary component exists or not
     * @param {*} componentName 
     * @param {*} organizationId 
     * @returns 
     */
    checkSalaryComponentExists(componentName, organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT *
                FROM ${this.ORG_PAYROLL_SALARY_COMPONENT_TABLE}
                WHERE component_name = ? AND organization_id = ?
            ) as has_component;
        `;
        return mysql.query(query, [componentName, organizationId]);
    }

    /**
     * getPayrollPolicy - function to get the id and policy_name of the policy
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getPayrollPolicy(organizationId) {
        const query = `
            SELECT id, policy_name
            FROM ${this.ORG_PAYROLL_POLICIES_TABLE}
            WHERE organization_id = ?
        `;

        return mysql.query(query, [organizationId]);
    }

    /**
     * getAssignStructureData - function to get assign structure data
     * @param {*} queryObj 
     * @param {*} organizationId 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getAssignStructureData(queryObj, organizationId) {
        let whereCondition = '';
        let limitStr = '';
        let whereQueryValueArr = [];
        let sortColumn = 'e.created_at';
        let sortOrder = 'DESC';

        whereCondition = ` WHERE e.organization_id = ? `;
        whereQueryValueArr.push(organizationId);

        if (queryObj) {
            if (queryObj.employeeId) {
                whereCondition += whereCondition ? ` AND e.id = ? ` : ` WHERE e.id = ? `;
                whereQueryValueArr.push(queryObj.employeeId);
            }
            if (queryObj.roleId) {
                whereCondition += whereCondition ? ` AND r.id = ? ` : ` WHERE r.id = ? `;
                whereQueryValueArr.push(queryObj.roleId);
            }
            if (queryObj.locationId) {
                whereCondition += whereCondition ? ` AND ol.id = ? ` : ` WHERE ol.id = ? `;
                whereQueryValueArr.push(queryObj.locationId);
            }
            if (queryObj.payrollPolicyId) {
                whereCondition += whereCondition ? ` AND opp.id = ? ` : ` WHERE opp.id = ? `;
                whereQueryValueArr.push(queryObj.payrollPolicyId);
            }
            if (queryObj.search) {
                whereCondition += whereCondition ? ` AND  (
                    CONCAT(u.first_name,' ', u.last_name) LIKE '%${queryObj.search}%' OR 
                    ol.name LIKE '%${queryObj.search}%' OR 
                    r.name LIKE '%${queryObj.search}%' OR 
                    opp.policy_name LIKE '%${queryObj.search}%' OR  
                    (JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.ctc')) LIKE '%${queryObj.search}%' OR JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.gross')) LIKE '%${queryObj.search}%') OR
                    (JSON_UNQUOTE(JSON_EXTRACT(eps.salary_components,'$.monthly_ctc')) LIKE '%${queryObj.search}%' OR JSON_UNQUOTE(JSON_EXTRACT(eps.salary_components,'$.gross_salary')) LIKE '%${queryObj.search}%')
                ) ` : ` WHERE (
                    CONCAT(u.first_name,' ', u.last_name) LIKE '%${queryObj.search}%' OR 
                    ol.name LIKE '%${queryObj.search}%' OR 
                    r.name LIKE '%${queryObj.search}%' OR 
                    opp.policy_name LIKE '%${queryObj.search}%' OR  
                    (JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.ctc')) LIKE '%${queryObj.search}%' OR JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.gross')) LIKE '%${queryObj.search}%') OR
                    (JSON_UNQUOTE(JSON_EXTRACT(eps.salary_components,'$.monthly_ctc')) LIKE '%${queryObj.search}%' OR JSON_UNQUOTE(JSON_EXTRACT(eps.salary_components,'$.gross_salary')) LIKE '%${queryObj.search}%')
                ) `;
            }
            if (queryObj.employee_type && queryObj.employee_type != 0) whereCondition += ` AND JSON_EXTRACT(eps.details, '$.type') = ${queryObj.employee_type}`;
            if (queryObj.skip || queryObj.limit) {
                if (queryObj.skip) limitStr += ` LIMIT ${queryObj.skip}`;
                if (queryObj.limit) limitStr += limitStr ? ` , ${queryObj.limit}` : ` LIMIT ${queryObj.limit}`;
            }
            if (queryObj.sortColumn) {
                switch (queryObj.sortColumn) {
                    case 'fullName':
                        sortColumn = 'full_name';
                        break;
                    case 'email':
                        sortColumn = 'u.a_email';
                        break;
                    case 'location':
                        sortColumn = `ol.name`
                        break;
                    case 'role':
                        sortColumn = `r.name`
                        break;
                    case 'policyName':
                        sortColumn = 'opp.policy_name';
                        break;
                    case 'ctc':
                        sortColumn = 'ctc';
                        break;
                    case 'gross':
                        sortColumn = 'gross';
                        break;
                    default:
                        sortColumn = 'e.created_at';
                }
            }
            if (queryObj.sortOrder && queryObj.sortOrder.toUpperCase() == 'A') {
                sortOrder = 'ASC';
            }
        }

        let query;
        if (queryObj.to_assigned_id) {
            query = `
                    SELECT 
                    e.id As e_id,
                    u.id AS u_id, u.first_name, u.first_name, u.last_name, u.a_email as email, u.status, e.organization_id,e.location_id, CONCAT(u.first_name,' ', u.last_name) AS full_name, u.username,
                    ol.name AS location, e.department_id, e.emp_code,
                    GROUP_CONCAT(ur.role_id) AS role_id, GROUP_CONCAT(r.name) AS role,
                    opp.id as payroll_policy_id, opp.policy_name, JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.ctc')) as ctc,
                    JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.gross')) as gross,
                    JSON_UNQUOTE(JSON_EXTRACT(eps.salary_components,'$.monthly_ctc')) as monthly_ctc,
                    JSON_UNQUOTE(JSON_EXTRACT(eps.salary_components,'$.gross_salary')) as gross_salary,
                    JSON_EXTRACT(eps.details,'$.type') as type
                    FROM assigned_employees ae
                    LEFT JOIN ${this.EMPLOYEES_TABLE} e ON e.id=ae.employee_id
                    INNER JOIN ${this.USERS_TABLE} u on u.id = e.user_id
                    LEFT JOIN ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} eps ON  eps.employee_id = e.id
                    LEFT JOIN ${this.ORG_LOCATIONS_TABLE} ol ON ol.id = e.location_id
                    LEFT JOIN ${this.USER_ROLE_TABLE} ur ON ur.user_id = u.id
                    LEFT JOIN ${this.ROLES_TABLE} r ON r.id = ur.role_id
                    LEFT JOIN ${this.ORG_PAYROLL_POLICIES_TABLE} opp ON  opp.id = eps.payroll_policy_id
                    ${whereCondition} AND ae.to_assigned_id = ${queryObj.to_assigned_id} AND ae.role_id = ${queryObj.role_id}
                    AND u.status = 1 
                    GROUP BY e.id ORDER BY ${sortColumn} ${sortOrder} ${limitStr};
                    `;
        }
        else {
            query = `
                    SELECT 
                    e.id As e_id,
                    u.id AS u_id, u.first_name, u.first_name, u.last_name, u.a_email as email, u.status, e.organization_id,e.location_id, CONCAT(u.first_name,' ', u.last_name) AS full_name, u.username,
                    ol.name AS location, e.department_id, e.emp_code,
                    GROUP_CONCAT(ur.role_id) AS role_id, GROUP_CONCAT(r.name) AS role,
                    opp.id as payroll_policy_id, opp.policy_name, JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.ctc')) as ctc,
                    JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.gross')) as gross,
                    JSON_UNQUOTE(JSON_EXTRACT(eps.salary_components,'$.monthly_ctc')) as monthly_ctc,
                    JSON_UNQUOTE(JSON_EXTRACT(eps.salary_components,'$.gross_salary')) as gross_salary,
                    JSON_EXTRACT(eps.details,'$.type') as type
                    FROM ${this.EMPLOYEES_TABLE} e
                    INNER JOIN ${this.USERS_TABLE} u on u.id = e.user_id
                    LEFT JOIN ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} eps ON  eps.employee_id = e.id
                    LEFT JOIN ${this.ORG_LOCATIONS_TABLE} ol ON ol.id = e.location_id
                    LEFT JOIN ${this.USER_ROLE_TABLE} ur ON ur.user_id = u.id
                    LEFT JOIN ${this.ROLES_TABLE} r ON r.id = ur.role_id
                    LEFT JOIN ${this.ORG_PAYROLL_POLICIES_TABLE} opp ON  opp.id = eps.payroll_policy_id
                    ${whereCondition} 
                    AND u.status = 1 
                    GROUP BY e.id ORDER BY ${sortColumn} ${sortOrder} ${limitStr};
                    `;
        }
        return mysql.query(query, whereQueryValueArr);
    }

    /**
     * countPayrollAssignStructure - function to get count of assign structure data
     * @param {*} queryObj 
     * @param {*} organizationId 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    countPayrollAssignStructure(queryObj, organizationId) {

        let whereCondition = '';
        let limitStr = '';
        let whereQueryValueArr = [];
        whereCondition = ` WHERE e.organization_id = ? `;
        whereQueryValueArr.push(organizationId);

        if (queryObj) {
            if (queryObj.employeeId) {
                whereCondition += whereCondition ? ` AND e.id = ? ` : ` WHERE e.id = ? `;
                whereQueryValueArr.push(queryObj.employeeId);
            }
            if (queryObj.roleId) {
                whereCondition += whereCondition ? ` AND r.id = ? ` : ` WHERE r.id = ? `;
                whereQueryValueArr.push(queryObj.roleId);
            }
            if (queryObj.locationId) {
                whereCondition += whereCondition ? ` AND ol.id = ? ` : ` WHERE ol.id = ? `;
                whereQueryValueArr.push(queryObj.locationId);
            }
            if (queryObj.search) {
                whereCondition += whereCondition ? ` AND  (
                    CONCAT(u.first_name,' ', u.last_name) LIKE '%${queryObj.search}%' OR 
                    ol.name LIKE '%${queryObj.search}%' OR 
                    r.name LIKE '%${queryObj.search}%' OR 
                    opp.policy_name LIKE '%${queryObj.search}%' OR  
                    JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.ctc')) LIKE '%${queryObj.search}%'
                ) ` : ` WHERE (
                    CONCAT(u.first_name,' ', u.last_name) LIKE '%${queryObj.search}%' OR 
                    ol.name LIKE '%${queryObj.search}%' OR 
                    r.name LIKE '%${queryObj.search}%' OR 
                    opp.policy_name LIKE '%${queryObj.search}%' OR  
                    JSON_UNQUOTE(JSON_EXTRACT(eps.details,'$.ctc')) LIKE '%${queryObj.search}%'
                ) `;
            }
            if (queryObj.payrollPolicyId) {
                whereCondition += whereCondition ? ` AND opp.id = ? ` : ` WHERE opp.id = ? `;
                whereQueryValueArr.push(queryObj.payrollPolicyId);
            }
            if (queryObj.employee_type != 0) whereCondition += ` AND JSON_EXTRACT(eps.details, '$.type') = ${queryObj.employee_type}`;
        }

        let query;
        if (queryObj.to_assigned_id) {
            query = `
                    select 
                    COUNT(1) as cnt FROM (
                        SELECT 
                        COUNT(1)
                        FROM assigned_employees ae
                        LEFT JOIN ${this.EMPLOYEES_TABLE} e ON e.id=ae.employee_id
                        INNER JOIN ${this.USERS_TABLE} u on u.id = e.user_id
                        LEFT JOIN ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} eps ON  eps.employee_id = e.id
                        LEFT JOIN ${this.ORG_LOCATIONS_TABLE} ol ON ol.id = e.location_id
                        LEFT JOIN ${this.USER_ROLE_TABLE} ur ON ur.user_id = u.id
                        LEFT JOIN ${this.ROLES_TABLE} r ON r.id = ur.role_id
                        LEFT JOIN ${this.ORG_PAYROLL_POLICIES_TABLE} opp ON  opp.id = eps.payroll_policy_id
                        ${whereCondition} AND ae.to_assigned_id = ${queryObj.to_assigned_id} AND ae.role_id=${queryObj.role_id}
                        AND u.status = 1 
                        GROUP BY e.id
                    ) temp_table
                    `;
        }
        else {
            query = `
                    select 
                    COUNT(1) as cnt FROM (
                        SELECT 
                        COUNT(1)
                        FROM ${this.EMPLOYEES_TABLE} e
                        INNER JOIN ${this.USERS_TABLE} u on u.id = e.user_id
                        LEFT JOIN ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} eps ON  eps.employee_id = e.id
                        LEFT JOIN ${this.ORG_LOCATIONS_TABLE} ol ON ol.id = e.location_id
                        LEFT JOIN ${this.USER_ROLE_TABLE} ur ON ur.user_id = u.id
                        LEFT JOIN ${this.ROLES_TABLE} r ON r.id = ur.role_id
                        LEFT JOIN ${this.ORG_PAYROLL_POLICIES_TABLE} opp ON  opp.id = eps.payroll_policy_id
                        ${whereCondition} 
                        AND u.status = 1 
                        GROUP BY e.id
                    ) temp_table
                    `;
        }
        return mysql.query(query, whereQueryValueArr);
    }

    /**
     * getEmpPayrollDetails - function to get payroll setting data
     * 
     * @param {*} employeeId 
     * @returns
     * @author Amit verma <amitverma@globussoft.in> 
     */
    getEmpPayrollDetails(employeeId) {
        const query = `
            SELECT id, organization_id, employee_id, payroll_policy_id, details, settings,
            pf_override, esi_override, pf_applicable, created_at, updated_at
            FROM ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE}
            WHERE employee_id = ?
        `;
        return mysql.query(query, [employeeId]);
    }

    /**
     * updateEmpPayrollSettings - function to update payroll details
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    updateEmpPayrollSettings({ employeeId, organizationId, payrollPolicyId, empPayrollDetailsJson }) {
        const whereConditionStr = ` employee_id = ${employeeId} AND organization_id = ${organizationId}`;
        let updateStr = '';
        let updateValueArr = [];

        if (payrollPolicyId) {
            updateStr += updateStr ? ` , payroll_policy_id = ? ` : ` payroll_policy_id = ? `;
            updateValueArr.push(payrollPolicyId);
        }
        if (empPayrollDetailsJson) {
            updateStr += updateStr ? ` , details = ? ` : ` details = ? `;
            updateValueArr.push(JSON.stringify(empPayrollDetailsJson));
        }

        const query = `
            UPDATE ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} 
            SET ${updateStr}
            WHERE ${whereConditionStr}
        `;
        return mysql.query(query, updateValueArr);
    }

    /**
     * createEmployeePayrollSetting - function to create employee payroll settings
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    createEmployeePayrollSetting({ employeeId, organizationId }) {
        const query = `
            INSERT INTO ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} ( organization_id, employee_id )
            VALUES ( '${organizationId}', '${employeeId}')
        `;

        return mysql.query(query);
    }

    /**
     * createEmployeePayrollSettingDefaultDetails - function to create employee payroll settings with default details settings
     * @param {*} param0 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    createEmployeePayrollSettingDefaultDetails({ employeeId, organizationId, defaultPayrollDetailsJson, payrollPolicyId }) {
        const insertObj = {
            organization_id: organizationId,
            employee_id: employeeId,
            details: JSON.stringify(defaultPayrollDetailsJson)
        };

        if (payrollPolicyId) {
            insertObj.payroll_policy_id = payrollPolicyId;
        }

        const query = `
            INSERT INTO ${this.EMPLOYEEE_PAYROLL_SETTINGS_TABLE} SET ?
        `;
        return mysql.query(query, insertObj);
    }

    /**
     * getEmployeeIdInSystem - function to get all the employee ids from system
     * @param {*} organizationId
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getEmployeeIdInSystem(organizationId) {
        const query = `
            SELECT 
                id 
            FROM ${this.EMPLOYEES_TABLE} 
            WHERE
                organization_id = ?
        `;
        return mysql.query(query, [organizationId]);
    }


    getOrgSettings(organizationId) {
        const query = `SELECT * FROM ?? WHERE organization_id = ? ;`;

        return mysql.query(query, [this.ORG_PAYROLL_SETTINGS_TABLE, organizationId]);
    }
}

module.exports = new PayrollAssignStructureModel;