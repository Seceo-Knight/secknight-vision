const mySql = require('../../../database/MySqlConnection').getInstance();
const SqlString = require('sqlstring');

class NotificationModel {

    getNotificationList({ organization_id, skip, limit, location_id, department_id, employee_id, startDate, endDate, sortOrder, sortColumn, name, download }) {
        let column;
        let order;

        if (sortOrder === 'D') {
            order = `DESC`;
        } else {
            order = `ASC`;
        }

        switch (sortColumn) {
            case 'Full Name':
                column = `u.first_name`
                break;
            case 'Computer':
                column = `u.computer_name`
                break;
            case 'Employee Code':
                column = `e.emp_code`
                break;
            case 'Date':
                column = `en.date`
                break;
            default:
                column = `en.date`;
                order = `DESC`
                break;
        }

        let query = `
            SELECT
                en.id,en.employee_id, CONCAT(u.first_name,' ',u.last_name) AS emp_name,u.computer_name,e.emp_code,
                en.date AS date_time,en.read_status, en.notification_period,(COUNT( en.id ) OVER()) AS total_count
            FROM employee_mail_notification AS en

            INNER JOIN employees AS e ON en.employee_id=e.id
            INNER JOIN users AS u ON e.user_id=u.id
            WHERE  en.organization_id=${organization_id}
                AND CONVERT(DATE,date) BETWEEN '${startDate}' AND '${endDate}'`;

        if (location_id) query += ` AND e.location_id=${location_id}`;
        if (department_id) query += ` AND e.department_id=${department_id}`;
        if (employee_id) query += ` AND en.employee_id=${employee_id}`;
        if (name) query += ` AND (CONCAT(u.first_name,' ',u.last_name) LIKE '%${name}%' OR u.computer_name LIKE '%${name}%' OR e.emp_code LIKE '%${name}%')`
        if (download == false) {
            query += ` ORDER BY ${column} ${order}, en.read_status ASC
            LIMIT ${skip},${limit};`;
        } else {
            query += ` ORDER BY ${column} ${order}`
        }

        return mySql.query(query);
    }

    updateNotificationStatus(organization_id, ids) {

        let query = SqlString.format(`
            UPDATE employee_mail_notification
            SET employee_mail_notification.read_status = 1
            WHERE employee_mail_notification.organization_id = '${organization_id}'
            AND employee_mail_notification.id IN(${ ids})
                `);

        return mySql.query(query);
    }

    unreadMessageWithCount(organization_id) {
        const query = `SELECT COUNT(id) as count
            FROM employee_mail_notification
            WHERE organization_id = ${ organization_id} AND read_status = 0`;

        return mySql.query(query);
    }


}

module.exports = new NotificationModel;