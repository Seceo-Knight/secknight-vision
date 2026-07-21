const Mysql = require('../../../../database/MySqlConnection').getInstance();
const { BaseModel } = require('../../../../models/BaseModel');

class ResellerModel extends BaseModel {
    static get TABLE_NAME() {
        return 'reseller';
    }

    static get TABLE_FIELDS() {
        return [
            'id', 'user_id', 'logo', 'domain', 'status', 'details',
            'created_at', 'updated_at',
        ];
    }
    /**
     *Get information
     *
     * @function resellerStats
     * @memberof ResellerModel
     * @param {number} user_id
     * @return  promise.
     */
    static getReseller({ user_id }) {
        const query = `SELECT r.id AS reseller_id, r.user_id, r.logo, r.domain,r.status, r.details
                    FROM reseller r
                    WHERE user_id = ?`;

        return Mysql.query(query, [user_id]);
    }

    /**
     *insert information
     *
     * @function insert
     * @memberof ResellerModel
     * @param {string} logo
     * @param {string} domain
     * @param {number} status
     * @param {string} details
     * @return  promise.
     */
    static insert({ logo, domain, status, details, userId }) {
        const query = `
                INSERT INTO reseller(logo, domain, status, details,user_id )
                VALUES (?, ?, ?, ?, ?);`;

        return Mysql.query(query, [logo, domain, status, details, userId]);
    }

    /**
     *update information
     *
     * @function update
     * @memberof ResellerModel
     * @param {string} logo
     * @param {string} domain
     * @param {number} status
     * @param {string} details
     * @return  promise.
     */
    static update({ logo, domain, status, details, userId }) {
        const query = `
                    UPDATE reseller
                    SET logo = ?, domain = ?, status = ?, details = ?
                    WHERE user_id = ? ;`;

        return Mysql.query(query, [logo, domain, status, details, userId]);
    }

    /**
    *update organization information
    *
    * @function update
    * @memberof ResellerModel
    * @param {string} domain
    * @param {number} resellerId
    * @return  promise.
    */
    static updateOrg({ resellerId, domain }) {
        const query = `
                    UPDATE organizations
                    SET reseller_id = ?
                    WHERE domain = ? ;`;

        return Mysql.query(query, [resellerId, domain])
    }

    /**
    *Add client
    *
    * @function addClient
    * @memberof ResellerModel
    * @param {number} amemberId
    * @param {number} resellerId
    * @return  promise.
    */
    static addClient({ amemberId, resellerId }) {
        const query = `UPDATE organizations o
        SET o.reseller_id = ?
        WHERE o.amember_id = ?;`;

        return Mysql.query(query, [resellerId, amemberId]);
    }

    /**
    *Remove client
    *
    * @function removeClient
    * @memberof ResellerModel
    * @param {number} amemberId
    * @param {number} resellerId
    * @return  promise.
    */
    static removeClient({ email, resellerId }) {
        const query = `UPDATE organizations o
        INNER JOIN users u ON u.id = o.user_id
        SET o.reseller_id = ?
        WHERE o.reseller_id = ? AND (u.email = ? OR u.a_email = ?);`;

        return Mysql.query(query, [null, resellerId, email, email]);
    }

    /**
    * getClientDetails client
    * 
    * @memberof ResellerModel
    * @param {number} amemberId
    * @param {number} resellerId
    * @return  promise.
    */
    static getClientDetails({ email, resellerId }) {
        const query = `
            SELECT 
                o.id AS organization_id, u.id AS user_id
            FROM organizations o
            INNER JOIN users u ON u.id = o.user_id
            WHERE o.reseller_id = ? AND (u.email = ? OR u.a_email = ?);
        `;

        return Mysql.query(query, [resellerId, email, email]);
    }

    /**
     * getClientEmployeeAttendanceData - function to get the employee attendance details
     * @param {*} param0 
     * @returns 
     */
    static getClientEmployeeAttendanceData({ organization_id }) {
        const query = `
            SELECT 
                e.user_id, e.id as employee_id, e.organization_id,
                att.id AS attendance_id, u.email
            FROM employees e
            INNER JOIN users u ON u.id = e.user_id
            LEFT JOIN employee_attendance att ON att.employee_id = e.id
            WHERE e.organization_id = ?
        `;
        return Mysql.query(query, [ organization_id ]);
    }
    
    /**
     * deleteUser - function to delete a user
     * 
     * @param {*} user_id 
     * @returns 
     */
    static deleteUser(user_id) {
        let query = `
            DELETE FROM users WHERE id = ?
        `;

        return Mysql.query(query, [ user_id ]);
    }
    /**
    *Client stats
    *
    * @function clientStats
    * @memberof ResellerModel
    * @param {number} resellerId
    * @return  promise.
    */
    static clientStats({ resellerId, amemberId }) {
        let condition = `o.reseller_id = ${resellerId}`;
        if (amemberId) condition += ` AND o.amember_id = ${amemberId}`;

        const query = `SELECT u.a_email, current_user_count, o.total_allowed_user_count, o.amember_id, u.username, o.notes,
                    JSON_EXTRACT(os.rules,'$.pack.expiry') AS expiry,o.id AS client_organization_id, u.id AS client_user_id, o.reseller_id_client, o.reseller_number_client
                    FROM organizations o
                    JOIN users u ON u.id = o.user_id
                    JOIN organization_settings os ON os.organization_id=o.id
                    WHERE ${condition}`;

        return Mysql.query(query);
    }

    static activeStorage({ orgIds }) {
        const query = `SELECT p.short_code ,op.status,  JSON_EXTRACT(opc.creds,'$.reseller') AS reseller, opc.auto_delete_period,
                p.id as provider_id, op.organization_id, opc.id as opc_id
                FROM organization_providers op
                INNER JOIN providers p ON p.id=op.provider_id
                INNER JOIN organization_provider_credentials opc ON opc.org_provider_id =op.id
                WHERE op.organization_id IN(?) AND opc.status=1`;

        return Mysql.query(query, [orgIds]);
    }

    /**
     * getResellerOrganizationDetails - function to get the reseller org details
     * @param {*} orgId 
     * @returns 
     */
     static async getResellerOrganizationDetails(orgId) {
        const query = `
            SELECT u.a_email, o.current_user_count, o.total_allowed_user_count,u.first_name, u.last_name,
            u.email,u.username, u.contact_number, u.date_join, u.address, u.photo_path,            
            JSON_EXTRACT(os.rules,'$.pack.expiry') AS expiry_date
            FROM organizations o
            JOIN users u ON u.id = o.user_id
            JOIN organization_settings os ON os.organization_id=o.id
            WHERE o.id = ?
        `;

        return Mysql.query(query, [ orgId ]);
    }

    /**
     * getClientLicUsed - function get the no of lic used by reseller's client
     * @param {*} reseller_id 
     * @returns 
     */
    static async getClientLicUsed(reseller_id) {
        const query = `
            SELECT sum(o.total_allowed_user_count) AS sold_lic
            FROM organizations o
            WHERE o.reseller_id = ?
        `;
        return Mysql.query(query, reseller_id);
    }

    /**
     * getClientProfileDetails - function to get the client profile details
     * @param {*} user_id 
     * @returns 
     */
    static async getClientProfileDetails(user_id) {
        const query = `
            SELECT u.first_name, u.last_name, u.email, u.a_email, u.username, u.contact_number, u.date_join, u.address, u.photo_path,
            JSON_EXTRACT(os.rules,'$.pack.expiry') AS expiry_date, o.current_user_count, o.total_allowed_user_count
            FROM users u
            INNER JOIN organizations o ON o.user_id = u.id
            INNER JOIN organization_settings os ON os.organization_id=o.id
            WHERE u.id = ?
        `;

        return Mysql.query(query, [user_id]);
    }

    /**
     * getClientLicUsed - function get the no of lic used by reseller's client
     * @param {*} reseller_id 
     * @returns 
     */
    static async getClientLicUsed(reseller_id) {
        const query = `
            SELECT sum(o.total_allowed_user_count) AS sold_lic
            FROM organizations o
            WHERE o.reseller_id = ?
        `;
        return Mysql.query(query, reseller_id);
    }

    /**
     * checkIsResellerClient - function to check the user is client
     * @param {*} param
     * @returns 
     */
    static async checkIsResellerClient({resellerId, client_id}) {
        const query = `
            SELECT u.id
            FROM users u
            INNER JOIN organizations o ON o.user_id = u.id
            WHERE o.reseller_id = ? AND u.id = ? 
        `;

        return Mysql.query(query, [resellerId, client_id]);
    }

    /**
     * getClientOrgSettings - function to get the client org settings
     * @param {*} user_id 
     * @returns 
     */
    static async getClientOrgSettings(user_id) {
        const query = `
            SELECT os.id, os.organization_id, os.rules
            FROM organizations o
            JOIN users u ON u.id = o.user_id
            JOIN organization_settings os ON os.organization_id=o.id
            WHERE u.id = ?
        `;

        return Mysql.query(query, [ user_id ]);
    }

    /**
     * clientUpdate - function to update the client details
     * @param {*} param
     * @returns 
     */
    static async clientUpdate({client_id, total_allowed_user_count, settingUpdate, notes, reseller_number_client, reseller_id_client}) {
        let queryArrParam = [];
        let updateCol = '';
        if(total_allowed_user_count) {
            updateCol = 'SET o.total_allowed_user_count = ?'
            queryArrParam.push(total_allowed_user_count);
        }
        if(settingUpdate) {
            const updateStr = 'os.rules = ?';
            let columnSeperator = '';
            queryArrParam.push(JSON.stringify(settingUpdate));
            columnSeperator  = updateCol ? ' ,': `SET `;
            updateCol += `${columnSeperator}${updateStr}`;
        }
        if (notes !== undefined && (notes === null || notes === '') || notes) {
            const updateStr = 'o.notes = ?';
            const columnSeperator = updateCol ? ' ,': `SET `;
            updateCol += `${columnSeperator}${updateStr}`;
            queryArrParam.push(notes);
        }
        if(reseller_number_client) {
            const updateStr = 'o.reseller_number_client = ?';
            const columnSeperator = updateCol ? ' ,': `SET `;
            updateCol += `${columnSeperator}${updateStr}`;
            queryArrParam.push(reseller_number_client);
        }
        if(reseller_id_client) {
            const updateStr = 'o.reseller_id_client = ?';
            const columnSeperator = updateCol ? ' ,': `SET `;
            updateCol += `${columnSeperator}${updateStr}`;
            queryArrParam.push(reseller_id_client);
        }

        if(!updateCol) return null;

        const query = `
            UPDATE organizations o 
            INNER JOIN organization_settings os ON os.organization_id = o.id 
            INNER JOIN users u ON u.id = o.user_id
            ${updateCol}
            where u.id = ${client_id};
        `;
        return Mysql.query(query, queryArrParam);
    }

    static async getCurrentEmployeeCount(organization_id) {
        const query = ` SELECT count(e.id) AS employeeCount
            FROM employees AS e
            JOIN users AS u ON e.user_id = u.id
            WHERE e.organization_id = ${organization_id};
        `;
        return Mysql.query(query);
    }
    static async updateOrgLicenseInfo(organization_id, count) {
        let query = `UPDATE organizations
                SET current_user_count = ${count} 
                WHERE id = ${organization_id}
        `;
        return Mysql.query(query);
    }

    static getOrganizationDetails(organization_id) {
        return Mysql.query(`
            SELECT o.id, o.user_id
                FROM organizations o
                WHERE o.id = ?
        `, [organization_id]);
    }
}

module.exports.ResellerModel = ResellerModel;
