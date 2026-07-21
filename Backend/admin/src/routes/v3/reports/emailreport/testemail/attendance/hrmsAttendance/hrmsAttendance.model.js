const moment = require('moment');
const mySql = require('../../../../../../../database/MySqlConnection').getInstance();
const EmpProductivityReportModel = require('../../../../../../../models/employee_productivity.schema');

class attendanceModel {
    constructor() {
        this.EMPLOYEE_ATTENDANCE_TABLE = 'employee_attendance';
        this.HRMS_EMPLOYEE_ATTENDANCE_TABLE = 'hrms_employee_attendance';
    }
    /**
    * Get attendace
    *
    * @function getAttendance
    * @memberof  attendanceModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    getAttendance(start_date, end_date, employee_ids, organization_id) {
        let match = { organization_id };
        if (employee_ids.length > 0) match.employee_id = { $in: employee_ids };
        if (start_date && end_date) match.yyyymmdd = {
            $gte: parseInt(start_date.split('-').join('')),
            $lte: parseInt(end_date.split('-').join(''))
        };
        let query = [{ $match: match },];

        query.push({
            $project: {
                _id: 0,
                employee_id: 1,
                date: 1,
                active_time: { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration'] },
                office_time: { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration'] },
            }
        });

        return EmpProductivityReportModel.aggregate(query);
    }

    /**
    * Get attendace hours
    *
    * @function getAttendanceHours
    * @memberof  attendanceModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    getAttendanceHours(name, organization_id) {
        let query = `SELECT name, value, attendance_colors FROM organization_hrms_settings
                     WHERE name=(?) AND organization_id =(?)`;
        return mySql.query(query, [name, organization_id]);
    }

    getOrgPFSettings(organization_id) {
        return mySql.query('SELECT id , organization_id , settings FROM organization_payroll_settings WHERE organization_id=?', [organization_id])
    }

    getLeaveByEmployee(employee_ids, date, organization_id) {
        let query = `SELECT el.id, el.employee_id, el.leave_type AS employee_leave_type, el.day_status, el.day_type, 
                     olt.name AS leave_name, olt.duration AS leave_duration, el.start_date, el.status,
                     el.end_date, el.number_of_days AS aplied_to,olt.number_of_days AS leave_type_days 
                     FROM employee_leaves el 
                     LEFT JOIN organization_leave_types olt ON olt.organization_id=el.organization_id AND olt.id=el.leave_type 
                     WHERE el.status IN (0,1,2) AND el.employee_id IN (?) AND el.organization_id=(?) 
                     AND ( el.start_date LIKE ? OR el.end_date LIKE ?)`;

        return mySql.query(query, [employee_ids, organization_id, date, date]);
    }


    /**
    * Get users list
    *
    * @function userList
    * @memberof  attendanceModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    userList(organization_id, employeesId, department_ids) {
        department_ids = department_ids?.length ? department_ids.filter(x => +x) : department_ids;
        employeesId = employeesId?.length ? employeesId.filter(x => +x) : employeesId;

        let query = `SELECT e.id As id,concat(u.first_name,' ',u.last_name) AS name, e.organization_id,
                     ol.name AS location, od.name AS department, e.emp_code, e.shift_id, osh.data,
                     e.geolocation, e.timezone, e.tracking_rule_type,
                     JSON_UNQUOTE(JSON_EXTRACT(e.custom_tracking_rule, "$.manual_clock_in")) AS manual_clock_in,
                     JSON_UNQUOTE(JSON_EXTRACT(e.custom_tracking_rule, "$.is_attendance_override")) AS is_attendance_override 
                     FROM employees e
                     INNER JOIN users u ON u.id=e.user_id
                     INNER JOIN organization_locations ol ON e.location_id=ol.id
                     INNER JOIN organization_departments od ON od.id=e.department_id
                     INNER JOIN user_role ur ON ur.user_id=u.id
                     INNER JOIN roles rn ON rn.id=ur.role_id
                     LEFT JOIN organization_shifts osh ON osh.id=e.shift_id
                     JOIN organization_settings os ON e.organization_id=os.organization_id
                     LEFT JOIN employee_payroll_settings eps ON e.id=eps.employee_id           
                     WHERE e.organization_id=${organization_id} AND u.status = 1 `;

        if (employeesId.length) query += ` AND e.id  IN (${employeesId})`;
        if (department_ids.length) query += ` AND e.department_id  IN (${department_ids})`;

        query += ` GROUP BY e.id`;
        return mySql.query(query);
    }

    /**
    * Get Attendance list
    *
    * @function getTimesheet
    * @memberof  attendanceModel
    * @param {Date} start_date
    * @param {Date} end_date
    * @param {Array} employee_id
    * @param {Number} organization_id
    * @returns {Array} -  return promise.
    */
    getTimesheet(start_date, end_date, setupEmps, type, organization_id) {
        const employee_attendance = type && type == 4 ? "hrms_employee_attendance" : "employee_attendance";
        let query = `SELECT ea.id as attendance_id, ea.employee_id, ea.date, ea.start_time, ea.end_time, ea.is_manual_attendance, TIMESTAMPDIFF(SECOND, ea.start_time, ea.end_time) as logged_duration,  
                     JSON_UNQUOTE(JSON_EXTRACT(ea.details, "$.status")) AS custom_status, 
                     JSON_UNQUOTE(JSON_EXTRACT(ea.details, "$.request_status")) AS attendance_request_status, 
                     CONCAT(u.first_name, ' ', u.last_name) as overridden_by
                     FROM ${employee_attendance} ea
                     LEFT JOIN users u ON u.id = ea.updated_by
                     WHERE ea.employee_id IN (?) AND ea.organization_id =(?) AND ea.date BETWEEN (?) AND (?) `;
        return mySql.query(query, [setupEmps, organization_id, start_date, end_date]);
    }

    /**
    * Get Manual Employee Attendance list
    *
    * @function getManualTimesheet
    * @memberof  attendanceModel
    * @param {Date} start_date
    * @param {Date} end_date
    * @param {Array} manualEmps
    * @param {Number} organization_id
    * @returns {Array} -  return promise.
    */
    getManualTimesheet(start_date, end_date, manualEmps, organization_id) {
        let query = `SELECT hea.id as attendance_id, hea.employee_id, hea.date, hea.start_time, hea.end_time, hea.is_manual_attendance, TIMESTAMPDIFF(SECOND, hea.start_time, hea.end_time) as logged_duration,  
                     JSON_UNQUOTE(JSON_EXTRACT(hea.details, "$.status")) AS custom_status,
                     JSON_UNQUOTE(JSON_EXTRACT(hea.details, "$.request_status")) AS attendance_request_status,
                     CONCAT(u.first_name, ' ', u.last_name) as overridden_by 
                     FROM hrms_employee_attendance hea
                     LEFT JOIN users u ON u.id = hea.updated_by
                     WHERE hea.employee_id IN (?) AND hea.organization_id =(?) AND hea.date BETWEEN (?) AND (?)`;
        return mySql.query(query, [manualEmps, organization_id, start_date, end_date]);
    }

    getEmployeeAttendance({ employee_ids, organization_id, date, order_col, order, limit }) {
        let whereStr = '';
        let whereArr = [];
        let limitStr = '';
        let orderCol = '';
        let orderStr = '';

        if (order_col) {
            orderCol = ` ORDER BY ${order_col} `;
        }

        if (order) {
            if (order.toUpperCase() == 'A') {
                orderStr = ' ASC ';
            } else {
                orderStr = ' DESC ';
            }
        }

        if (employee_id) {
            const seperator = whereStr ? ' AND ' : ' ';
            whereStr += `${seperator} employee_id = ? `;
            whereArr.push(employee_id);
        }
        if (organization_id) {
            const seperator = whereStr ? ' AND ' : ' ';
            whereStr += `${seperator} organization_id = ? `;
            whereArr.push(organization_id);
        }
        if (date) {
            const seperator = whereStr ? ' AND ' : ' ';
            whereStr += `${seperator} date = ? `;
            whereArr.push(date);
        }

        if (!order_col || !order) {
            orderStr = '';
            orderCol = '';
        }

        if (limit) {
            limitStr = ` LIMIT ${limit} `;
        }

        let query = `
            SELECT
                id, employee_id, organization_id, date, start_time, end_time, details, is_manual_attendance, created_at, updated_at
            FROM ${this.EMPLOYEE_ATTENDANCE_TABLE} 
            WHERE
            ${whereStr}
            ${orderCol} ${orderStr} ${limitStr}
        `;
        return mySql.query(query, whereArr);
    }

    /**
     * getOrgGroupEmployeeTrackDetails - function to get org group employee settings
     * 
     * @param {*} employee_id 
     * @returns
     * @author Amit Verma <amitverma@globussoft.in> 
     */
    async getOrgGroupEmployeeTrackDetails(employee_id) {
        let query = `
            SELECT 
                e.id ,e.tracking_rule_type, e.custom_tracking_rule,
                o.id AS organization_id, os.rules AS organization_rules,
                og.id AS group_id, og.rules AS group_rules
            FROM employees e
            INNER JOIN organizations o ON o.id = e.organization_id
            INNER JOIN organization_settings os ON os.organization_id = o.id
            LEFT JOIN organization_groups og ON og.organization_id = o.id
            WHERE e.id = ?
        `;

        return mySql.query(query, [employee_id]);
    }


    /**
     * get leave and existing leave employee
     * @param {*} leave_id 
     * @param {*} organization_id
     * @returns 
     */
    getLeave(leave_id, organization_id) {
        let query = `SELECT name as leave_name
                FROM organization_leave_types 
                WHERE id = ? AND organization_id = ?`;

        return mySql.query(query, [leave_id, organization_id]);
    }

    /**
     * employees existing leaves
     * @param {*} employee_id 
     * @param {*} date 
     * @returns 
     */
    getEmployeeLeave(organization_id, employee_id, date) {
        const query = `SELECT * FROM employee_leaves
                WHERE organization_id = ?
                AND employee_id = ? 
                AND ? BETWEEN start_date AND end_date ;`;

        return mySql.query(query, [organization_id, employee_id, date]);
    }

    getHolidayList(organization_id) {
        let query = `SELECT id, holiday_name, holiday_date FROM holidays
                     WHERE organization_id =(?)`;
        return mySql.query(query, [organization_id]);
    }

    getEmployeeShifts(employee_ids, organization_id, start_date) {
        const date = moment(start_date).format('MM');

        const query = `SELECT es.employee_id, es.shift_id,
                es.start_date, es.end_date, os.data 
                FROM hrms_employee_shifts es
                LEFT JOIN organization_shifts os ON es.shift_id = os.id
                WHERE es.organization_id = ? 
                AND es.employee_id IN (?) 
                AND ? BETWEEN MONTH(es.start_date)
                AND MONTH(es.end_date) `;

        return mySql.query(query, [organization_id, employee_ids, date]);
    }

    getRequestStatus(empIds, organization_id, start, end) {
        let query = `SELECT hea.employee_id, hea.id as attendance_id, hea.date,
                JSON_EXTRACT(hea.details, '$.request_status') as request_status
                FROM hrms_employee_attendance hea
                WHERE hea.employee_id IN (?) AND organization_id = ?
                AND hea.date BETWEEN (?) AND (?) 
                AND JSON_EXTRACT(hea.details, '$.request_status') IS NOT NULL`;

        return mySql.query(query, [empIds, organization_id, start, end])
    }
}

module.exports = new attendanceModel;