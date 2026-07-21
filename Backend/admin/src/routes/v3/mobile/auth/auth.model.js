'use strict';

const mySql = require('../../../../database/MySqlConnection').getInstance();

const moment = require('moment');

class AuthModel {
    userWithAdminAndRole(email) {
        const query = `
            SELECT 
                u.id, u.first_name, u.last_name, u.email, u.a_email, u.password, u.email_verified_at, u.contact_number, u.address, u.photo_path, u.status, u.date_join as begin_date,
                e.emp_code, e.timezone, e.organization_id, e.id as employee_id,e.custom_tracking_rule,
                od.id as department_id, od.name as department,o.total_allowed_user_count,
                ol.id as location_id, ol.name as location, e.room_id,
                r.name as role, ur.role_id,o.language,o.weekday_start,s.data AS shift,
                JSON_EXTRACT(os.rules,'$.product_id') as product_id, JSON_EXTRACT(os.rules,'$.pack.expiry') as expire_date,
                JSON_EXTRACT(os.rules,'$.productiveHours') as productive_hours,
                JSON_EXTRACT(os.rules,'$.productivityCategory') as productivityCategory, e.mobile_login_date, e.language as employee_language
            FROM users u 
            JOIN employees as e ON e.user_id = u.id
            JOIN organization_departments as od ON od.id = e.department_id
            JOIN organization_locations as ol ON ol.id = e.location_id
            LEFT JOIN user_role as ur ON ur.user_id = e.user_id
            JOIN organizations as o ON o.id =e.organization_id
            LEFT JOIN roles as r ON r.id = ur.role_id
            JOIN organization_settings as os ON os.organization_id = e.organization_id
            LEFT JOIN organization_shifts as s ON s.id =e.shift_id
            WHERE (u.a_email LIKE '${email}' OR u.email LIKE '${email}') LIMIT 1;
        `; //status 1-active ,0-account deleted,2-suspended

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return mySql.query(query);
    }

    roles(user_id) {
        const query = `SELECT r.name, ur.role_id,ur.user_id
                    FROM user_role ur
                    INNER JOIN roles r ON r.id=ur.role_id
                    WHERE ur.user_id=${user_id};`;

        return mySql.query(query);
    }

    
    userPermission(role_id, organization_id) {
        const query = `
        SELECT p.id as permission_id, p.name as permission, p.type 
            FROM permission_role pr
            JOIN permissions p ON p.id = pr.permission_id
            WHERE pr.role_id = ${role_id} AND organization_id=${organization_id};
        `;

        if (process.env.MYSQL_TIMEOUT === 'true') {
            return mySql.query({ sql: query, timeout: parseInt(process.env.MYSQL_TIMEOUT_INTERVAL) });
        }

        return mySql.query(query);
    }

    dashboardFeature() {
        const query = `
        SELECT name,status
        FROM dashboard_features;`;
        return mySql.query(query);
    }

    getOrganizationSetting(organisationId) {
        const query = `SELECT os.rules,o.timezone,o.id,o.total_allowed_user_count,o.current_user_count,re.logo,re.details, re.user_id as reseller_user_id,
                        o.current_user_count as current_count
                        FROM organizations as o
                        JOIN organization_settings os ON os.organization_id = o.id
                        LEFT JOIN reseller re ON re.id = o.reseller_id
                        WHERE o.id = ${organisationId}`;
        return mySql.query(query);
    }

    async getResellerOrgId(organisation_id) {
        let query = `
            SELECT o.id as organization_id
            FROM reseller r
            JOIN users u ON u.id = r.user_id
            JOIN organizations o ON o.user_id = u.id
            WHERE r.user_id = ${organisation_id}
        `;
        return mySql.query(query);
    }

    async isReseller(organization_id) {
        let query = `
            SELECT 
                re.logo,re.details
                FROM  
                    organizations o 
                    JOIN users u ON u.id = o.user_id
                    JOIN reseller re ON re.user_id= u.id
                WHERE  o.id = ?;
        `;

        const params = [organization_id];
        return mySql.query(query, params);
    }

    updatePassword(pass, {id}) {
        let query = `
            UPDATE users SET password = ? WHERE id = ?;
        `;

        const params = [pass, id];
        return mySql.query(query, params);
    }

    updateMobileLoginDate(employee_id, last_login_time) {
        let query = `UPDATE employees SET mobile_login_date="${moment(last_login_time).format('YYYY-MM-DD HH:mm:ss')}" WHERE id=${employee_id}`;
        return mySql.query(query);
    }

    updateEmployeeLocalizationStatus(employee_id, language) {
        let query = `
            UPDATE employees 
                SET language = "${language}"
                WHERE id = ${employee_id}
        `;
        return mySql.query(query);
    }
}

module.exports = new AuthModel();