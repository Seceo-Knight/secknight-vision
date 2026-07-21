const mysql = require(`${dbFolder}/MySqlConnection`).getInstance();

class pfModel {

    /**
     * A function for get organization pf settings
     * @function getPfSettings
     * @param {Number} organization_id
     * @returns {*} Success or Error 
     */
    static getPfSettings(organization_id) {
        return mysql.query('SELECT id , organization_id , settings FROM organization_payroll_settings WHERE organization_id=?', [organization_id])
    }

    /**
     * A function for update organization pf settings
     * @function updatePfSettings
     * @param {Number} organization_id 
     * @param {*} settings 
     * @returns {Promise<Object>} Success or Error 
     */
    static updatePfSettings(organization_id, settings) {
        return mysql.query('UPDATE organization_payroll_settings SET settings=? WHERE organization_id=?', [settings, organization_id]);
    }

    /**
     * A function for update organization pf settings
     * @function createPfSettings
     * @param {Number} organization_id 
     * @param {*} settings 
     * @returns {Promise<Object>} Success or Error 
     */
    static createPfSettings(organization_id, settings) {
        return mysql.query('INSERT INTO organization_payroll_settings (settings,organization_id)  VALUES(?,?)', [settings, organization_id]);
    }

}
module.exports = { pfModel };