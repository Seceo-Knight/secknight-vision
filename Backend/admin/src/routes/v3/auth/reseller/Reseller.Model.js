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
    *Client stats
    *
    * @function clientStats
    * @memberof ResellerModel
    * @param {number} resellerId
    * @return  promise.
    */
    static clientStats({ resellerId, amemberId, email, username }) {
        let condition = `o.reseller_id = ${resellerId}`;
        if (amemberId) condition += ` AND o.amember_id = ${amemberId}`;
        if (email && username) condition += ` AND (u.a_email = "${email}" OR u.email = "${email}" OR u.username = "${username}")`;

        const query = `SELECT u.a_email, current_user_count, o.total_allowed_user_count, o.amember_id, o.notes,
                    JSON_EXTRACT(os.rules,'$.pack.expiry') AS expiry,o.id AS client_organization_id, u.id AS client_user_id
                    FROM organizations o
                    JOIN users u ON u.id = o.user_id
                    JOIN organization_settings os ON os.organization_id=o.id
                    WHERE ${condition}`;

        return Mysql.query(query);
    }

    /**
     * getResellerOrganizationDetails - function to get the reseller org details
     * @param {*} orgId 
     * @returns 
     */
    static async getResellerOrganizationDetails(orgId) {
        const query = `
            SELECT u.a_email, o.current_user_count, o.total_allowed_user_count, o.amember_id,
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
     * insertAdminDetails - function to insert Admin details 
     * @param {*} param0 
     * @returns 
     */
    static async insertAdminDetails({ username, password, first_name, last_name, email, contact_number, date_join, address }) {
        const query = `
            INSERT INTO users 
                (username,password,first_name,last_name,email,contact_number,date_join,address,a_email)
            VALUES ('${username}','${password}','${first_name}','${last_name}', '${email}', ${contact_number ? "'" + contact_number + "'" : null},'${date_join}',${address ? "'" + address + "'" : null},'${email}');
        `;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return Mysql.query({ sql: query, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return Mysql.query(query);
    }

    static async insertOrganisation(user_id, timezone, total_allowed_user_count, reseller_id, notes, reseller_id_client, reseller_number_client) {
        const query = `
            INSERT INTO organizations 
                (user_id,timezone,total_allowed_user_count, reseller_id, notes, reseller_id_client, reseller_number_client)
            VALUES ('${user_id}','${timezone}',${total_allowed_user_count}, '${reseller_id}', '${notes}', '${reseller_id_client}', '${reseller_number_client}');
        `;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return Mysql.query({ sql: query, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return Mysql.query(query);
    }

    static async getInfo() {
        const query = `
            SELECT operating_system, c_version, meta_name 
            FROM application_info 
            WHERE status = 1 AND agent_name='empmonitor'
        `;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return Mysql.query({ sql: query, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return Mysql.query(query);
    }

    static async insertOrganizationSetting(organization_id, rules) {
        const query = `
            INSERT INTO organization_settings 
                (organization_id,rules)
            VALUES ('${organization_id}','${JSON.stringify(rules)}');
        `;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return Mysql.query({ sql: query, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return Mysql.query(query);
    }

    /**
     * getResellerDetails - function to get the reseller data
     * @memberof PwdRecoverModel
     * @param number organisation_id
     * @return object | null
     */
    static async getResellerDetails(organisation_id) {
        let query = `
            SELECT 
                re.logo,re.details
            FROM  
                organizations o 
                LEFT JOIN reseller re ON re.id= o.reseller_id
            WHERE  o.id = ?
        `;

        const params = [organisation_id];
        return Mysql.query(query, params);
    }

    /**
     * getResellerClient - function to get reseller client data
     * @param {*} username 
     * @returns 
     */
    static async getResellerClient(username) {
        const query = {
            sql: `
                SELECT 
                    u.id, u.first_name, u.last_name, u.email, u.a_email, u.email_verified_at,u.contact_number, u.password,
                    u.contact_number, u.date_join, u.address,u.photo_path, o.id as organization_id,os.rules,o.amember_id,
                    o.total_allowed_user_count,o.current_user_count,o.language,o.weekday_start,o.timezone,
                    JSON_EXTRACT(os.rules,'$.pack.expiry') AS expire_date,
                    u.date_join as begin_date
                FROM users u 
                JOIN organizations o ON o.user_id = u.id
                JOIN organization_settings os ON os.organization_id = o.id
                WHERE  u.username = ? OR u.email = ?
        `
        }; 
        const params = [username, username];

        if (process.env.MYSQL_TIMEOUT === 'true') {
            query.timeout = +process.env.MYSQL_TIMEOUT_INTERVAL;
        }

        return Mysql.query(query, params);
    }

    /**
    * users stats
    *
    * @function getUser
    * @memberof ResellerModel
    * @param {number} resellerId
    * @return  promise.
    */
    static getUser({ email, username }) {
        const query = `SELECT u.email, u.a_email, u.username
                    FROM users u
                    WHERE (u.a_email = ? OR u.email = ? OR u.username = ?)`;

        return Mysql.query(query, [email, email, username]);
    }

    static async getResellerClientOrganizationId(organization_id) {
        const query = {
            sql: `
                SELECT 
                    u.id, u.first_name, u.last_name, u.email, u.a_email, u.email_verified_at,u.contact_number, u.password, u.username,
                    u.contact_number, u.date_join, u.address,u.photo_path, o.id as organization_id,os.rules,o.amember_id,
                    o.total_allowed_user_count,o.current_user_count,o.language,o.weekday_start,o.timezone,
                    JSON_EXTRACT(os.rules,'$.pack.expiry') AS expire_date,
                    u.date_join as begin_date, o.reseller_id
                FROM users u 
                JOIN organizations o ON o.user_id = u.id
                JOIN organization_settings os ON os.organization_id = o.id
                WHERE  o.id = ?
        `
        }; 
        const params = [organization_id];
        if (process.env.MYSQL_TIMEOUT === 'true') {
            query.timeout = +process.env.MYSQL_TIMEOUT_INTERVAL;
        }
        return Mysql.query(query, params);
    }
    
    static async getResellerOrgDetails(organisation_id) {
        let query = `
            SELECT 
                re.logo,re.details, o.id, re.id as reseller_id
            FROM  
                organizations o 
                JOIN users u ON o.user_id = u.id
                JOIN reseller re ON re.user_id = u.id
            WHERE  o.id = ?
        `;
        const params = [organisation_id];
        return Mysql.query(query, params);
    }

    static assignResellerEmployee (employee_id) {
        let query = `SELECT * FROM silah_assigned_reseller WHERE employee_id = ${employee_id}`;
        return Mysql.query(query);
    }
}

module.exports.ResellerModel = ResellerModel;