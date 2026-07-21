const MySql = require('../../../database/MySqlConnection').getInstance();
const SqlString = require('sqlstring');
const moment = require('moment');

const businessDaysAgo = (daysTotal) => {
    const date = new Date()
    while (daysTotal > 0) {
        date.setDate(date.getDate() - 1);
        if (![0, 6].includes(date.getDay())) daysTotal--;
    }
    return date.toISOString().substring(0, 10);
};

class UserNotificationModel {

    /**
     * getLastLoginData 
     * @memberof UserNotificationModel
     * @description mysql model
     * @returns Last login data 
     * @author Guru Prasad <guruprasad@globussoft.in>
    */
    async getLastLoginData(absentEmpIds) {
        const dateQuery = SqlString.format(`select MAX(date) AS date,employee_id,organization_id from employee_attendance ea where ea.employee_id IN (?) group by employee_id`, [absentEmpIds]);
        return MySql.query(dateQuery);
    }

    async getOrganizationsData(reportTimezone, specielAdmins) {
        const date = moment().format("YYYY-MM-DD")
        const dateQuery = SqlString.format(`SELECT o.id AS org_id,o.user_id,o.timezone,u.email FROM  organizations o 
        INNER JOIN organization_settings os ON os.organization_id = o.id
        INNER JOIN users u ON u.id=o.user_id
        LEFT JOIN reseller r ON r.id=o.reseller_id
        WHERE JSON_EXTRACT(os.rules,'$.pack.expiry')  >= ? AND o.timezone IN (?) AND o.id IN (?)`, [date, reportTimezone, specielAdmins]);

        return MySql.query(dateQuery);
    }
    async getAbsentData(organization_id) {
        const dateQuery = SqlString.format(`SELECT ee.id FROM employees ee
        WHERE ee.organization_id=? AND
        ee.id NOT IN
        (SELECT  ea.employee_id FROM employee_attendance ea WHERE ea.date IN (?) AND ea.organization_id=?)`, [organization_id, businessDaysAgo(1), organization_id]);
        return MySql.query(dateQuery);
    }

    async getEmployeesData(organization_id, absentEmpIds) {
        const dateQuery = SqlString.format(`SELECT e.id AS empid,e.emp_code AS empcode,u.status,CONCAT(u.first_name,u.last_name) AS UserName,u.email AS email,e.id AS empid, ol.name AS Location,od.name AS Department,u.computer_name AS ComputerName 
        FROM  employees e
        INNER JOIN users u ON e.user_id=u.id
        INNER JOIN organization_locations ol ON ol.id=e.location_id
        INNER JOIN organization_departments od ON od.id=e.department_id
        WHERE e.organization_id=? AND e.id IN (?)
        GROUP BY e.id`, [organization_id, absentEmpIds]);
        return MySql.query(dateQuery);
    }
}
module.exports = new UserNotificationModel;