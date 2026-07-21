const mySql = require("../../../../../../database/MySqlConnection").getInstance();
const helper = require('./attendance.helper');


class Model {
    static getOrganizationShift(ShiftsId) {
        const query = `SELECT os.name, os.data, os.id, ol.timezone, os.late_period, os.early_login_logout_time, os.half_day_hours
        FROM organization_shifts os
        LEFT JOIN organization_locations ol ON ol.id = os.location_id
        WHERE os.id IN (?);`;

        return mySql.query(query, [ShiftsId]);
    }

    static async getOrgTimezone(organization_id) {
        const query = `SELECT timezone
        FROM organizations
        WHERE id = ?;`;

        const [orgData] = await mySql.query(query, [organization_id]);
        return orgData.timezone;
    }

    static getEmployeeForAttSheet({ organization_id, employee_ids, department_ids }) {
        department_ids = department_ids?.length ? department_ids.filter(x => +x) : department_ids;
        employee_ids = employee_ids?.length ? employee_ids.filter(x => +x) : employee_ids;

        let query = `SELECT e.id, e.shift_id, e.emp_code, u.first_name, u.last_name, 
                    od.name as department, ol.name as location, e.organization_id as oID 
        FROM employees e
        JOIN users u ON u.id = e.user_id 
        JOIN organization_departments od ON od.id = e.department_id
        JOIN organization_locations ol ON ol.id = e.location_id 
        WHERE e.organization_id = ? `;

        if (employee_ids.length) { query += `AND e.id IN (${employee_ids}) ` }
        if (department_ids.length) { query += `AND od.id IN (${department_ids}) ` }

        return mySql.query(query, [organization_id]);
    }

    static getAttendanceSheet({ organization_id, employeesId, date }) {
        const { start, end } = helper.getAttMonthRangeDate(date);
        const query = `SELECT 
        date, start_time as start, end_time as end, employee_id
        FROM employee_attendance 
        WHERE organization_id = ? 
        AND employee_id IN (?) 
        AND date BETWEEN ? AND ?
        ORDER BY date`;

        return mySql.query(query, [organization_id, employeesId, start, end]);
    }
}

module.exports = Model;
