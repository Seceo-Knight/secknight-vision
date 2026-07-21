/** HRMSPassword Model */

/** Imports */
const mySql = require("../../../../database/MySqlConnection").getInstance();


/**
 * @class HRMSPasswordModel
 * Queries for HRMSPassword Services
 */
class HRMSPasswordModel {

    getPassword({ column, organization_id }) {
        let query = `SELECT id, ${column} 
                FROM organization_hrms_settings
                WHERE organization_id = ? `;

        return mySql.query(query, [organization_id]);
    }


    UpdatePasswordRow({ column, password, organization_id }) {
        let query = `UPDATE organization_hrms_settings SET ${column} = ?
                WHERE organization_id = ? `;

        return mySql.query(query, [password, organization_id]);
    }


    createPasswordRow({ column, password, organization_id }) {
        let query = `INSERT INTO organization_hrms_settings  
                (${column}, organization_id) 
                VALUES (?) ;`;

        return mySql.query(query, [[password, organization_id]]);
    }

    getOrganizationData({ organization_id }) {
        let query = `SELECT CONCAT(u.first_name, ' ', u.last_name) as name,
                    u.email, u.a_email
                    FROM users u
                    INNER JOIN organizations o ON o.user_id = u.id 
                    WHERE o.id = ? `;

        return mySql.query(query, [organization_id]);
    }
}


/** Exports */
module.exports = HRMSPasswordModel;