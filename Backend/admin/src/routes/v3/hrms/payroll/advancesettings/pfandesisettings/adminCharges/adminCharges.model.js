// Admin Charges Model

// mysql connection
const mysql = require('../../../../../../../database/MySqlConnection').getInstance();


// class
class AdminChargesModel {

    /**
     * get the admin charges for an organization
     * @param {*} organization_id 
     */
    getAdminCharges(organization_id) {
        const query = `SELECT id, organization_id, settings
                    FROM organization_payroll_settings
                    WHERE organization_id = ?`;

        return mysql.query(query, [organization_id]);
    }

    /**
     * update admin charges for an organization
     * @param {*} settings 
     * @param {*} organization_id 
     * @returns 
     */
    updateAdminCharges(settings, organization_id) {
        const query = `UPDATE organization_payroll_settings 
                    SET settings = ?
                    WHERE organization_id = ?`;

        return mysql.query(query, [settings, organization_id]);
    }

    /**
     * Create admin charges if not for organization
     * @param {*} settings 
     * @param {*} organization_id 
     * @returns 
     */
    createAdminCharges(settings, organization_id) {
        const query = `INSERT INTO organization_payroll_settings 
                    (settings, organization_id)
                    VALUES
                    (?,?);`

        return mysql.query(query, [settings, organization_id]);
    }
}

// exports
module.exports = new AdminChargesModel();