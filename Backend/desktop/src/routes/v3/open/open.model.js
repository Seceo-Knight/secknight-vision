'use strict';

const mySql = require('../../../database/MySqlConnection').getInstance();

class OpenModel {
    constructor() {
        this.applicationInfoTable = 'application_info';
        this.usersTable = 'users';
    }

    getInfo(agent) {
        const query = `SELECT id,
        operating_system, architecture, c_version, meta_name, agent_name,
        patch_url, updated_at as last_updated_at FROM ${this.applicationInfoTable} WHERE status = 1 AND agent_name=?`;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, values: [agent], timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return mySql.query(query, [agent]);
    }

    checkIdExist({ id }) {
        const query = `SELECT id FROM ${this.applicationInfoTable} WHERE id = ${id};`;
        return mySql.query(query);
    }

    updateApplicationInfo({ id, c_version }) {
        const query = `UPDATE ${this.applicationInfoTable} SET c_version = '${c_version}' WHERE id = ${id};`;
        return mySql.query(query);
    }

    getUserIdByEmail({ email }) {
        const query = `SELECT id FROM ${this.usersTable} WHERE email = '${email}';`;
        return mySql.query(query);
    }

    getOrganizationDetail({ email }) {
        let query = `
            SELECT o.id 
            FROM employees e
            JOIN organizations o ON e.organization_id = o.id
            JOIN users u ON e.user_id = u.id
            WHERE u.email = ? OR u.a_email = ?;
        `;
        return mySql.query(query, [email, email]);
    }

    getOrganizationPlan({ organization_id }) {
        let query = `
            SELECT o.id, JSON_EXTRACT(os.rules, '$.pack.expiry') as expiry, o.timezone
            FROM organizations o
            JOIN organization_settings os ON o.id = os.organization_id
            WHERE o.id = ?;
        `;
        return mySql.query(query, [organization_id]);
    }
}

module.exports = new OpenModel;