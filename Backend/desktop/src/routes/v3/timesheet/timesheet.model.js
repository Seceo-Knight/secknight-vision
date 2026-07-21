const mySql = require('../../../database/MySqlConnection').getInstance();
const EmployeeProductivityReportModel = require("../../../models/employee_productivity.schema");

class TimesheetModel {
    getAttendance({ organization_id, employee_id, date }) {
        return mySql.query(`
            SELECT e.id as employee_id, ea.id as attendance_id, u.first_name, u.last_name, ea.date, ea.start_time, ea.end_time
            FROM employees e
            JOIN users u ON u.id = e.user_id
            JOIN employee_attendance ea ON ea.employee_id = e.id
            WHERE e.id = ? AND e.organization_id = ? AND ea.date = "${date}"
            ORDER BY ea.date DESC
            LIMIT 1;
        `, [employee_id, organization_id]);
    }


    getEmployeeProductivity({ organization_id, employee_id, date }) {
        return EmployeeProductivityReportModel.findOne({
            organization_id,
            employee_id,
            yyyymmdd: date
        },{
            productive_duration: 1,
            non_productive_duration: 1,
            neutral_duration: 1,
            logged_duration: 1,
            idle_duration: 1
        })
    }

    getOrganizationDefaultSettings({ organization_id }) {
        return mySql.query(`
            SELECT * FROM organization_settings WHERE organization_id = ?
        `, [organization_id])
    }
}

module.exports = new TimesheetModel();