const mysql = require("../../../../../../database/MySqlConnection").getInstance();


class PayrollSetupSettingModel {
    constructor() {
        this.ORG_PAYROLL_SETTINGS_TABLE = 'organization_payroll_settings';
        this.EMP_PAYROLL_SETTINGS_TABLE = 'employee_payroll_settings';
        this.TAX_SCHEMES_TABLE = 'tax_schemes';
    }

    getOrgPayrollDetails({ organization_id }) {
        const query = `
            SELECT ops.id, ops.organization_id, ops.settings, ops.contract_scheme_id, ts.scheme AS contract_scheme
            FROM ${this.ORG_PAYROLL_SETTINGS_TABLE} ops 
            LEFT JOIN ${this.TAX_SCHEMES_TABLE} ts ON ops.contract_scheme_id=ts.id
            WHERE ops.organization_id = ?
        `;
        return mysql.query(query, [organization_id]);
    }

    updateOrgPayrollSettings(orgId, settings, updateBody) {
        const params = [JSON.stringify(settings)];
        let update = `${this.ORG_PAYROLL_SETTINGS_TABLE} set settings = ?`;
        if (updateBody.contract_scheme_id) {
            update += `,contract_scheme_id = ?`;
            params.push(updateBody.contract_scheme_id);
        }
        params.push(orgId);

        const query = `
            UPDATE ${update}
            WHERE organization_id = ?
        `;
        return mysql.query(query, params);
    }

    /**
     * checkOrgPayrollSettingExists - function to check employee payroll setting exist or not
     * @param {s} employeeId 
     * @param {*} organizationId 
     * @returns 
     */
    checkOrgPayrollSettingExists(organizationId) {
        const query = `
            SELECT EXISTS (
                SELECT id
                FROM ${this.ORG_PAYROLL_SETTINGS_TABLE}
                WHERE organization_id = ?
            ) as has_organization_payroll_setting;
        `;
        return mysql.query(query, [organizationId]);
    }

    /**
     * createOrgPayrollSettingDefaultSettings - function to create organization payroll setting with default values
     * @param {*} employeeId 
     * @param {*} organizationId 
     * @returns 
     */
    createOrgPayrollSettingDefaultSettings({ organizationId, defaultOrgPayrollSetting }) {
        const query = `
            INSERT INTO ${this.ORG_PAYROLL_SETTINGS_TABLE} ( organization_id, settings )
            VALUES ('${organizationId}', '${JSON.stringify(defaultOrgPayrollSetting)}') 
        `;
        return mysql.query(query);
    }

    updateEmpTaxScheme({ organizationId, adminApprovedSchemeId, empType = 2 }) {
        const query = `UPDATE ${this.EMP_PAYROLL_SETTINGS_TABLE} eps
                     SET eps.admin_approved_scheme_id=?
                     WHERE organization_id = ? AND JSON_EXTRACT(eps.details, '$.type') =? 
                        AND eps.admin_approved_scheme_id IS NULL
                    `;

        return mysql.query(query, [adminApprovedSchemeId, organizationId, empType]);
    }
}

module.exports = new PayrollSetupSettingModel;