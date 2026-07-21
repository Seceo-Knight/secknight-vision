const mySql = require("../../../database/MySqlConnection").getInstance();

class Model {
    static getOrganizationShift(organization_ids) {
        organization_ids = organization_ids?.split(',');
        let query = ` 
            SELECT o.id AS organization_id, os.id AS shift_id, os.name AS shift_name, os.data AS shift_data, o.timezone, os.late_period
                FROM organizations o 
                JOIN organization_shifts os ON os.organization_id = o.id 
                WHERE o.id in (${organization_ids})
        `;
        return mySql.query(query);
    }

    static getEmployeeAssignToShift(shift_id, date, timezone) {
        let query = `
            SELECT e.id, u.first_name, u.last_name, u.email, ea.id as attendance_id, e.timezone, ea.start_time, e.emp_code, od.name as department_name, ol.name as location_name, u.contact_number
            FROM employees e 
            JOIN users u on u.id = e.user_id
            LEFT join employee_attendance ea on ea.employee_id = e.id and ea.date = "${date}"
            JOIN organization_departments od on od.id = e.department_id 
            JOIN organization_locations ol on ol.id = e.location_id 
            WHERE e.shift_id = ${shift_id} AND e.timezone = '${timezone}'
        `;
        return mySql.query(query);
    }

    static findCommonTimeZone(organization_id) {
        let query = `
            SELECT e.timezone
            FROM employees e 
            WHERE e.organization_id = ${organization_id}
            GROUP BY e.timezone
        `;
        return mySql.query(query);
    }
}


module.exports = Model;