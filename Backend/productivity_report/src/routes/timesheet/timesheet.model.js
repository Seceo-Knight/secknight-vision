const mySql = require('../../database/MySqlConnection').getInstance();
const Logger = require('../../Logger').logger;
const EmpProductivityModel = require('../../models/employee_productivity.schema');

class TimeSheetModel {
    async getAttendanceUsingFilter(admin_id, location_id, department_id, user_id, start_date, end_date) {
        // let query = `
        //         SELECT e.id, ea.id as attendance_id, u.first_name, u.last_name, u.email, e.timezone,e.emp_code, od.name as department, ol.name as location ,ea.date ,ea.start_time,ea.end_time
        //         FROM employees e
        //             JOIN users_new u ON e.user_id = u.id
        //             JOIN organization_departments od ON e.department_id = od.id
        //             JOIN organization_locations ol ON e.location_id = ol.id
        //             JOIN employee_attendance ea ON e.id = ea.employee_id
        //         WHERE e.organization_id = ${admin_id}
        //         AND ea.date BETWEEN '${start_date}' AND '${end_date}'`;
        let query = `
        SELECT 
        e.id, ps.id as attendance_id, e.name as first_name, e.full_name as last_name, e.email, e.timezone, e.emp_code, d.name as department, l.name as location ,ps.day as date ,ps.login_time as start_time, ps.logout_time as end_time
                        FROM users e
                            JOIN department d ON d.id = e.department_id
                            JOIN location l ON l.id = e.location_id
                            JOIN production_stats ps ON e.id = ps.user_id
                        WHERE e.admin_id = ${admin_id}
                        AND ps.day BETWEEN '${start_date}' AND '${end_date}'`;

        if (location_id !== parseInt(0)) query += ` AND e.location_id = ${location_id}`;
        if (user_id !== parseInt(0)) query += ` AND e.id = ${user_id}`;
        if (department_id !== parseInt(0)) query += ` AND e.department_id = ${department_id}`;

        // query += ` ORDER BY ea.date DESC;`
        query += ` ORDER BY ps.day DESC;`

        let userData = await mySql.query(query);
        return userData;
    }

    async getTimeSheetDetails(attendance_id, cb) {
        try {
            let query = `
            SELECT 
                id, start_time, end_time, type, mode, duration 
            FROM employee_timesheet 
            WHERE attendance_id = ${attendance_id} `;

            let timesheetData = await mySql.query(query);
            cb(null, timesheetData);
        } catch (err) {
            cb(err, null);
        }
    }

    async GetProductivityData(admin_id, location_id, department_id, user_id, start_date, end_date) {

        let query = { date: { $gte: start_date, $lte: end_date } };
        if (location_id !== parseInt(0)) query["location_id"] = location_id;
        if (department_id !== parseInt(0)) query["department_id"] = department_id;
        if (user_id !== parseInt(0)) query["employee_id"] = user_id;

        return EmpProductivityModel
            .find(query)
            .sort('-date')
            .select('productive_duration non_productive_duration neutral_duration idle_duration break_duration employee_id date')
            .lean()
    }
}

module.exports = new TimeSheetModel;

