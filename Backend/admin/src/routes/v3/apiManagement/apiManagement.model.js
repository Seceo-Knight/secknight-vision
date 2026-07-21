const mySql = require('../../../database/MySqlConnection').getInstance();
const APILoggingSchema = require('../../../models/api_logging.schema');

class Model {
    getAdmin(organization_id) {
        const query = {
            sql: `
        SELECT 
            u.id, u.first_name, u.last_name, u.email, u.a_email, u.email_verified_at,u.contact_number,
            u.contact_number, u.date_join, u.address,u.photo_path, o.id as organization_id,os.rules,o.amember_id,
            o.total_allowed_user_count,o.current_user_count,o.language,o.weekday_start,o.timezone, r.id AS reseller_id,
            u.password, u.username, o.total_allowed_user_count, o.product_tour_status, o.is2FAEnable
        FROM ?? u 
        JOIN ?? o ON o.user_id = u.id
        JOIN ?? os ON os.organization_id = o.id
        LEFT JOIN ?? r ON r.user_id=u.id
        WHERE o.id = ?
        `
        }; //status 1-active ,0-account deleted
        const params = [this.userTable, this.organizationTable, this.organizationSettingTable, this.resellerTable, organization_id];

        if (process.env.MYSQL_TIMEOUT === 'true') {
            query.timeout = +process.env.MYSQL_TIMEOUT_INTERVAL;
        }

        return mySql.query(query, params);
    }

    async saveToken(organization_id, token) {
        const query = `
            INSERT INTO api_tokens (organization_id, token)
            VALUES (?, ?)
        `;
        const params = [organization_id, token];
        return mySql.query(query, params);
    }

    async getTokens(organization_id) {
        const query = `
            SELECT * FROM api_tokens WHERE organization_id = ?
        `;
        const params = [organization_id];
        return mySql.query(query, params);
    }

    async deleteToken(organization_id) {
        const query = `
            DELETE FROM api_tokens WHERE organization_id = ?
        `;
        const params = [organization_id];
        return mySql.query(query, params);
    }

    async getOrganizationPlan(organization_id) {
        const query = `
            SELECT 
                o.id AS organization_id, JSON_EXTRACT(os.rules, '$.pack.expiry') as expiry, o.timezone
            FROM organization_settings os
            JOIN organizations o ON o.id = os.organization_id
            JOIN users u ON u.id = o.user_id
            WHERE o.id = ?
        `;
        const params = [organization_id];
        return mySql.query(query, params);
    }

    async getAPILogs(skip, limit, search, organization_id, start_date, end_date) {
        const query = { organization_id };
        if (start_date && end_date) {
            query.timestamp = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        if (search) {
            query.$or = [
                { endpoint: { $regex: search, $options: 'i' } },
                { method: { $regex: search, $options: 'i' } }
            ];
        }

        return APILoggingSchema.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    }

    async getAPILogsCount(search, organization_id, start_date, end_date) {
        const query = { organization_id };

        if (start_date && end_date) {
            query.timestamp = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        if (search) {
            query.$or = [
                { endpoint: { $regex: search, $options: 'i' } },
                { method: { $regex: search, $options: 'i' } }
            ];
        }

        return APILoggingSchema.countDocuments(query);
    }

}

module.exports = new Model();