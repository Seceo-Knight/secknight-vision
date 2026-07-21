const mySql = require('../../../database/MySqlConnection').getInstance();

const moment = require('moment-timezone');

class eventAlertEmailModel {
    static getEmployees(organization_id) {
        return mySql.query(`
            SELECT eps.id, eps.employee_id, eps.organization_id, JSON_EXTRACT(eps.details, '$.date_of_birth') as date_of_birth, u.first_name, u.last_name
                FROM employee_payroll_settings eps
                JOIN employees e ON e.id = eps.employee_id
                JOIN users u ON u.id = e.user_id
                WHERE JSON_EXTRACT(eps.details, '$.date_of_birth') is not null && DATE_FORMAT(replace(JSON_EXTRACT(eps.details, '$.date_of_birth'),'"', ''), '%m-%d') = "${moment().tz('Asia/Kolkata').add(1, 'days').format('MM-DD')}" && eps.organization_id = ?
        `, [ organization_id])
    }

    static getOrganization (organization_ids) {
        let query = `
            SELECT o.id, u.first_name, u.last_name
            FROM organizations o
            JOIN users u ON u.id = o.user_id
            WHERE o.id IN (${organization_ids})
        `;
        return mySql.query(query);
    }
}

module.exports = eventAlertEmailModel;