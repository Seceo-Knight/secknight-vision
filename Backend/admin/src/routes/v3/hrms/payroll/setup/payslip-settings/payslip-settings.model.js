/** Payslip Settings Model */


/** Imports */
const mySql = require("../../../../../../database/MySqlConnection").getInstance();



/**
 * @class PayslipSettingsModel
 * Contains Methods for queries in MySql DB
 */
class PayslipSettingsModel {

    /**
     * Gets Organization Payroll Data
     * @param {*} param0 
     * @returns 
     * @author Akshay Dhood
     */
    getOrganizationSettings({ organization_id }) {
        const query = `SELECT id, settings 
                FROM organization_payroll_settings
                WHERE organization_id = ? ;`;

        return mySql.query(query, [organization_id]);
    }


    /**
     * Update Organization Payroll Settings
     * @param {*} param0 
     * @returns 
     * @author Akshay Dhood
     */
    updateOrganizationSettings({ settings, organization_id }) {
        const query = `UPDATE organization_payroll_settings
                SET settings = ? 
                WHERE organization_id = ? ;`;

        return mySql.query(query, [settings, organization_id]);
    }


    /**
     * Create Organization Payroll Settings
     * @param {*} param0 
     * @returns 
     * @author Akshay Dhood
     */
    createOrganizationSettings({ settings, organization_id }) {
        const query = `INSERT INTO organization_payroll_settings
                (organization_id, settings)
                VALUES (?) ;`;

        return mySql.query(query, [[organization_id, settings]])
    }
}


/** exports */
module.exports = new PayslipSettingsModel;