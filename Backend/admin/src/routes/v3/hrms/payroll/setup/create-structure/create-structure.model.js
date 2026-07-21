const mysql = require("../../../../../../database/MySqlConnection").getInstance();

class PayrollCreateStructureModel {

    constructor() {
        // getter of tables
        this.ORG_PAYROLL_POLICIES_TABLE = 'organization_payroll_policies';
        this.ORG_PAYROLL_SALARY_COMPONENT_TABLE = 'organization_payroll_salary_components';
        this.ORG_PAYROLL_POLICY_RULE_TABLE = 'organization_payroll_policy_rules';
        this.ORG_PAYROLL_SETTINGS_TABLE = 'organization_payroll_settings';
    }

    /**
     * checkPayrollPolicyExists - function to chech payroll policy exists or not
     * @param {*} policyName 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    checkPayrollPolicyExists(policyName, organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT *
                FROM ${this.ORG_PAYROLL_POLICIES_TABLE}
                WHERE policy_name = ? AND organization_id = ?
            ) as has_payroll_policy;
         `;
        return mysql.query(query, [policyName, organizationId]);
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
        const query = `
            INSERT INTO ${this.ORG_PAYROLL_POLICIES_TABLE} ( policy_name, description, organization_id )
            values (?, ?, ?);
        `;
        return mysql.query(query, [policyName, description, organizationId]);
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
     * getSalaryComponent - function to get the salary component
     * @param {*} queryObj 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getSalaryComponent(queryObj) {
        let whereCondition = '';
        let whereQueryValueArr = [];

        if (queryObj) {
            if (queryObj.id) {
                whereCondition += whereCondition ? ` AND id = ? ` : ` WHERE id = ? `;
                whereQueryValueArr.push(queryObj.id);
            }
            if (queryObj.component_name) {
                whereCondition += whereCondition ? ` AND component_name = ? ` : ` WHERE component_name = ? `;
                whereQueryValueArr.push(queryObj.component_name);
            }
            if (queryObj.organization_id) {
                whereCondition += whereCondition ? ` AND organization_id = ? ` : ` WHERE organization_id = ? `;
                whereQueryValueArr.push(queryObj.organization_id);
            }
        }

        const query = `
            SELECT *
            FROM ${this.ORG_PAYROLL_SALARY_COMPONENT_TABLE}
            ${whereCondition}
        `;
        if (whereQueryValueArr.length) return mysql.query(query, whereQueryValueArr);
        return mysql.query(query);
    }

    /**
     * createSalaryComponent - function to create salary component
     * @param {*} componentName 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    createSalaryComponent(componentName, organizationId, componentType = 1, componentIsSysRule = 0) {
        const query = `
            INSERT INTO ${this.ORG_PAYROLL_SALARY_COMPONENT_TABLE} ( component_name, organization_id, component_type, is_sys_calc)
            values (?, ?, ?, ?);
        `;
        return mysql.query(query, [componentName, organizationId, componentType, componentIsSysRule]);
    }

    /**
     * checkPayrollPolicyRuleExists - function to check payroll rules exists or not
     * @param {*} policyId 
     * @param {*} salaryComponentId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    checkPayrollPolicyRuleExists(policyId, salaryComponentId) {
        const query = `
        SELECT EXISTS (
            SELECT *
            FROM ${this.ORG_PAYROLL_POLICY_RULE_TABLE}
            WHERE policy_id = ? AND salary_component_id = ?
        ) as has_payroll_policy_rule;
    `;
        return mysql.query(query, [policyId, salaryComponentId]);
    }

    /**
     * createPayrollPolicyRule - function to create payroll policy rule
     * @param {*} policyId 
     * @param {*} salaryComponentId 
     * @param {*} rule 
     * @returns 
     * @autor Amit Verma <amitverma@globussoft.in>
     */
    createPayrollPolicyRule(policyId, salaryComponentId, rule) {
        const query = `
            INSERT INTO ${this.ORG_PAYROLL_POLICY_RULE_TABLE} ( policy_id, salary_component_id, rule )
            values (?, ?, ?);
        `;
        return mysql.query(query, [policyId, salaryComponentId, rule]);
    }

    /**
     * updatePayrollPolicyRule - function to update payroll policy rules
     * @param {*} updateQuery 
     * @param {*} rule 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    updatePayrollPolicyRule(updateQuery, rule) {
        let whereCondition = '';
        let whereQueryValueArr = [];

        if (updateQuery) {
            if (updateQuery.id) {
                whereCondition += whereCondition ? ` AND id = ? ` : ` WHERE id = ? `;
                whereQueryValueArr.push(updateQuery.id);
            }
            if (updateQuery.policy_id) {
                whereCondition += whereCondition ? ` AND policy_id = ? ` : ` WHERE policy_id = ? `;
                whereQueryValueArr.push(updateQuery.policy_id);
            }
            if (updateQuery.salary_component_id) {
                whereCondition += whereCondition ? ` AND salary_component_id = ? ` : ` WHERE salary_component_id = ? `;
                whereQueryValueArr.push(updateQuery.salary_component_id);
            }
        }

        const query = `
            UPDATE ${this.ORG_PAYROLL_POLICY_RULE_TABLE}
            SET rule = '${rule}'
            ${whereCondition}
        `;
        if (whereQueryValueArr.length) return mysql.query(query, whereQueryValueArr);
        return mysql.query(query);
    }

    /**
     * getPayrollPolicyRule - function to get payroll rules
     * @param {*} queryObj 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getPayrollPolicyRule(queryObj) {
        let whereCondition = '';
        let whereQueryValueArr = [];

        if (queryObj) {
            if (queryObj.id) {
                whereCondition += whereCondition ? ` AND id = ? ` : ` WHERE id = ? `;
                whereQueryValueArr.push(queryObj.id);
            }
            if (queryObj.policy_id) {
                whereCondition += whereCondition ? ` AND policy_id = ? ` : ` WHERE policy_id = ? `;
                whereQueryValueArr.push(queryObj.policy_id);
            }
            if (queryObj.salary_component_id) {
                whereCondition += whereCondition ? ` AND salary_component_id = ? ` : ` WHERE salary_component_id = ? `;
                whereQueryValueArr.push(queryObj.salary_component_id);
            }
        }

        const query = `
            SELECT * 
            FROM  ${this.ORG_PAYROLL_POLICY_RULE_TABLE}
            ${whereCondition}
        `;
        if (whereQueryValueArr.length) return mysql.query(query, whereQueryValueArr);
        return mysql.query(query);
    }

    getPayrollPolicyData(queryObj, organizationId) {
        let whereCondition = '';
        let whereQueryValueArr = [];
        whereCondition = ` WHERE opp.organization_id = ? `;
        whereQueryValueArr.push(organizationId);

        if (queryObj) {
            if (queryObj.id) {
                whereCondition += whereCondition ? ` AND opp.id = ? ` : ` WHERE opp.id = ? `;
                whereQueryValueArr.push(queryObj.id);
            }
        }

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

    /**
     * updatePayrollPolicy - function to update the payroll policy details
     * @param {*} updateBody 
     * @param {*} id 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    updatePayrollPolicy(updateBody, id) {
        let updateStr = '';
        let updateBodyArr = [];

        if (updateBody) {
            if (updateBody.policy_name) {
                updateStr += updateStr ? ` , policy_name = ? ` : ` SET policy_name = ? `;
                updateBodyArr.push(updateBody.policy_name);
            }
            if (updateBody.description) {
                updateStr += updateStr ? ` , description = ? ` : ` SET description = ? `;
                updateBodyArr.push(updateBody.description);
            }
        }

        if (!updateStr) return null;

        const query = `
            UPDATE ${this.ORG_PAYROLL_POLICIES_TABLE}
            ${updateStr}
            WHERE id = '${id}'
        `;
        if (updateBodyArr.length) return mysql.query(query, updateBodyArr);
    }

    /**
     * getSalaryComponents - function get salary components
     * 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getSalaryComponents(organizationId) {
        const query = `
            SELECT 
                id, component_name, component_type, is_sys_calc
            FROM ${this.ORG_PAYROLL_SALARY_COMPONENT_TABLE}
            WHERE organization_id = ?
        `;
        return mysql.query(query, [organizationId]);
    }


    /**
     * getSalaryComponentForPolicy - function get salary components for policy
     * 
     * @param {*} policyId
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getSalaryComponentForPolicy(policyId) {
        const query = `
            SELECT 
                ops.id AS component_id, ops.component_name,
                opr.id AS policy_rule_id
            FROM ${this.ORG_PAYROLL_SALARY_COMPONENT_TABLE} ops 
            INNER JOIN ${this.ORG_PAYROLL_POLICY_RULE_TABLE} opr ON opr.salary_component_id = ops.id
            WHERE opr.policy_id = ?
        `;
        return mysql.query(query, [policyId]);

    }

    /**
     * deleteSalaryComponentRuleForPolicy - function to delete  salary components rule for policy
     * 
     * @param { Number } policyId
     * @param { Array } ruleIds
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    deleteSalaryComponentRuleForPolicy(policyId, ruleIds = []) {
        const query = `
            DELETE opr 
            FROM ${this.ORG_PAYROLL_POLICY_RULE_TABLE} opr 
            WHERE opr.policy_id = ? AND opr.id IN ( ? )
        `;
        return mysql.query(query, [policyId, ruleIds]);
    }

    /**
     * getOrgPayrollSettings - function to get org payroll settings
     * 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getOrgPayrollSettings(organizationId) {
        const query = `SELECT settings FROM ?? WHERE organization_id = ? ;`;

        return mysql.query(query, [this.ORG_PAYROLL_SETTINGS_TABLE, organizationId]);
    }
}

module.exports = new PayrollCreateStructureModel;