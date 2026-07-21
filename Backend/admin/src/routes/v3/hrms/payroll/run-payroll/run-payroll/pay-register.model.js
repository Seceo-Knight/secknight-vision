const mysql = require('../../../../../../database/MySqlConnection').getInstance()

class payRegisterModel {
    constructor() {
        this.ORG_PAYROLL_SETTINGS_TABLE = 'organization_payroll_settings';
        this.EMP_PAYROLL_SETTINGS_TABLE = 'employee_payroll_settings';
        this.PROFESSIONAL_TAX = 'professional_tax';
    }

    /**
     * Get organization settings
     * @param Number organizationId
     * @returns {*} -  return promise.
     * @author Basavaraj S <basavarajshiralashetti@gloubussoft.in>
     */
    getOrgSettings({ organizationId }) {
        const query = `SELECT * FROM ?? WHERE organization_id = ? ;`;

        return mysql.query(query, [this.ORG_PAYROLL_SETTINGS_TABLE, organizationId]);
    }

    /**
     * Get employee settings
     * @param Number organizationId
     * @param Number employeeId
     * @returns {*} -  return promise.
     * @author Basavaraj S <basavarajshiralashetti@gloubussoft.in>
     */
    getEmpSettings({ organizationId, employeeId }) {
        const query = `SELECT * FROM ?? WHERE organization_id = ? AND employee_id = ?`;
        console.log('----------', organizationId, employeeId)
        return mysql.query(query, [this.EMP_PAYROLL_SETTINGS_TABLE, organizationId, employeeId]);
    }

    getPTSetting({ organizationId, gross }) {
        const query = `SELECT * FROM ?? WHERE organization_id = ?`;

        return mysql.query(query, [this.PROFESSIONAL_TAX, organizationId]);
    }

}

module.exports = new payRegisterModel();

