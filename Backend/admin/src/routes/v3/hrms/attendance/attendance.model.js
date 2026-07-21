const moment = require('moment');
const mySql = require('../../../../database/MySqlConnection').getInstance();
const EmpProductivityReportModel = require('../../../../models/employee_productivity.schema');
const PERMITTED_QUERY_COLUMNS = ["organization_id", "employee_id", "date", "id"];
const PERMITTED_UPDATE_COLUMNS = ["start_time", "end_time", "check_out_detail"];
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

    /**
    * Get users list
    *
    * @function userList
    * @memberof  attendanceModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    userList(admin_id, location_id, department_id, role_id, name, skip, limit, to_assigned_id, column, order, status, is_employee, employee_type, roleId, date,non_adminID) {

        const department_ids = department_id ? "'" + department_id.split(",").join("','") + "'" : 0;
        const location_ids = location_id ? "'" + location_id.split(",").join("','") + "'" : 0;
        let query;
        if (is_employee) {
            query = `SELECT e.id As id,u.id AS u_id,concat(u.first_name,' ',u.last_name) AS name,u.status, e.organization_id,
                     e.location_id,ol.name AS location,e.department_id,od.name AS department,e.emp_code, e.shift_id, osh.data,
                     (COUNT( e.id ) OVER()) AS total_count, (SELECT COUNT(id) FROM employees 
                     WHERE organization_id='${admin_id}') as org_total_count, e.geolocation, e.timezone, u.date_join, 
                     JSON_UNQUOTE(JSON_EXTRACT(e.custom_tracking_rule, "$.manual_clock_in")) AS manual_clock_in
                     FROM employees e `;
                     if(non_adminID) query +=  ` INNER JOIN assigned_employees a ON a.employee_id=e.id `
           query += ` INNER JOIN users u ON u.id=e.user_id
                     INNER JOIN organization_locations ol ON e.location_id=ol.id
                     INNER JOIN organization_departments od ON od.id=e.department_id
                     INNER JOIN user_role ur ON ur.user_id=u.id
                     INNER JOIN roles rn ON rn.id=ur.role_id
                     LEFT JOIN organization_shifts osh ON osh.id=e.shift_id
                     JOIN organization_settings os ON e.organization_id=os.organization_id              
                     WHERE e.organization_id=${admin_id} AND e.id=${to_assigned_id} `;
                     if(non_adminID) query += ` AND a.to_assigned_id=${non_adminID} and a.role_id=${roleId}`;
                     query += ` GROUP BY e.id`;

        } else if (to_assigned_id) {
            query = `SELECT e.id As id, u.id AS u_id,a.to_assigned_id, concat(u.first_name,' ',u.last_name) AS name,u.status, e.organization_id,
                    e.location_id,ol.name AS location,e.department_id,e.emp_code,e.shift_id,od.name AS department,ur.role_id, osh.data,
                    rn.name AS role,rn.type AS role_type, (COUNT( e.id ) OVER()) AS total_count, e.timezone, u.date_join, 
                    JSON_UNQUOTE(JSON_EXTRACT(e.custom_tracking_rule, "$.manual_clock_in")) AS manual_clock_in
                    FROM assigned_employees a
                    INNER JOIN employees e ON e.id=a.employee_id
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN organization_locations ol ON e.location_id=ol.id
                    INNER JOIN organization_departments od ON od.id=e.department_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    LEFT JOIN organization_shifts osh ON osh.id=e.shift_id
                    JOIN roles rn ON rn.id=ur.role_id
                    JOIN organization_settings os ON e.organization_id=os.organization_id
                    LEFT JOIN employee_payroll_settings eps ON e.id=eps.employee_id 
                    WHERE e.organization_id=${admin_id} AND a.to_assigned_id=${to_assigned_id} AND a.role_id = ${roleId} `;

            if (location_id != 0) query += ` AND e.location_id in(${location_id})`;
            if (department_id != 0) query += ` AND e.department_id  in(${department_id})`;
            if (name) query += ` AND (u.first_name LIKE '%${name}%' OR u.last_name LIKE '%${name}%' OR CONCAT(u.first_name,' ',u.last_name) LIKE '%${name}%' )`;
            if (status) query += ` AND u.status=${status}`;
            if (employee_type != 0) query += ` AND JSON_EXTRACT(eps.details, '$.type') = ${employee_type}`;
            if (date) query += ` AND (u.date_join IS NULL OR u.date_join <= '${moment(date).format("YYYY-MM-DD")}')`;
            query += ` GROUP BY e.id`;
            query += ` ORDER BY ${column} ${order}`;
            query += ` LIMIT ${skip},${limit};`;
        
        } else {
            query = `SELECT e.id As id,u.id AS u_id,concat(u.first_name,' ',u.last_name) AS name,u.status, e.organization_id,
                     e.location_id,ol.name AS location,e.department_id,od.name AS department,e.emp_code, e.shift_id, osh.data,
                     (COUNT( e.id ) OVER()) AS total_count, (SELECT COUNT(id) FROM employees  
                     WHERE organization_id='${admin_id}') as org_total_count, e.geolocation, e.timezone, u.date_join,
                     JSON_UNQUOTE(JSON_EXTRACT(e.custom_tracking_rule, "$.manual_clock_in")) AS manual_clock_in,
                     JSON_UNQUOTE(JSON_EXTRACT(e.custom_tracking_rule, "$.is_attendance_override")) AS is_attendance_override, e.tracking_rule_type 
                     FROM employees e
                     INNER JOIN users u ON u.id=e.user_id
                     INNER JOIN organization_locations ol ON e.location_id=ol.id
                     INNER JOIN organization_departments od ON od.id=e.department_id
                     INNER JOIN user_role ur ON ur.user_id=u.id
                     INNER JOIN roles rn ON rn.id=ur.role_id
                     LEFT JOIN organization_shifts osh ON osh.id=e.shift_id
                     JOIN organization_settings os ON e.organization_id=os.organization_id
                     LEFT JOIN employee_payroll_settings eps ON e.id=eps.employee_id           
                     WHERE e.organization_id=${admin_id}`;
            if (location_id != 0) query += ` AND e.location_id in(${location_id})`;
            if (role_id != 0) query += ` AND ur.role_id= ${role_id}`;
            if (department_id != 0) query += ` AND e.department_id  in(${department_id})`;
            if (name) query += ` AND (u.first_name LIKE '%${name}%' OR u.last_name LIKE '%${name}%' OR CONCAT(u.first_name,' ',u.last_name) LIKE '%${name}%' )`;
            if (status) query += ` AND u.status=${status}`;
            if (employee_type != 0) query += ` AND JSON_EXTRACT(eps.details, '$.type') = ${employee_type}`;
            if (date) query += ` AND (u.date_join IS NULL OR u.date_join <= '${moment(date).format("YYYY-MM-DD")}')`;
            query += ` GROUP BY e.id`;
            query += ` ORDER BY ${column} ${order}`;
            query += ` LIMIT ${skip},${limit};`;
        
            
        }

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
                     JSON_UNQUOTE(JSON_EXTRACT(ea.details, "$.request_status")) AS attendance_request_status, `
            if (type == 4)  query += ` ea.check_out_detail, ea.check_in_detail, `
            query += ` CONCAT(u.first_name, ' ', u.last_name) as overridden_by
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
            hea.check_out_detail, hea.check_in_detail,
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
     * createAttendance - function to create the attendance
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    createAttendance({ organization_id, employee_id, date, start_time, end_time, is_manual_attendance }) {
        const query = `
            INSERT INTO employee_attendance SET ?
        `;
        return mySql.query(query, { organization_id, employee_id, date, start_time, end_time, is_manual_attendance });
    }

    createHrmsAttendanceField({ organization_id, employee_id, date, start_time, is_manual_attendance, check_in_detail }) {
        const query = `
            INSERT INTO hrms_employee_attendance SET ?
        `;
        return mySql.query(query, { organization_id, employee_id, date, start_time, is_manual_attendance, check_in_detail });
    }
    async updateHrmsAttendanceField({ id, end_time: startOrEndTime }) {
        const query = `
            UPDATE hrms_employee_attendance  SET    end_time = '${startOrEndTime}' where id = ${id}
        `;
        return mySql.query(query, { startOrEndTime });
    }

    /**
     * updateAttendance - function to update the attendance
     * @param {*} queryObj 
     * @param {*} setBodyObj 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    updateAttendance(queryObj, setBodyObj) {
        // if attendance_id is not present or org_id, emp_id and date are not present 
        // return null
        const { organization_id, employee_id, date, id } = queryObj;
        if (!id && (!organization_id || !employee_id || !date)) {
            return null;
        }

        let whereStr = ``;
        let whereArr = [];
        let setStr = ``;
        let setArr = [];

        for (const [key, value] of Object.entries(queryObj)) {
            if (PERMITTED_QUERY_COLUMNS.includes(key)) {
                const seperator = whereStr ? ` AND ` : ` WHERE `;
                whereStr += ` ${seperator} ${key} = ? `;
                whereArr.push(value);
            }
        }

        for (const [key, value] of Object.entries(setBodyObj)) {
            if (PERMITTED_UPDATE_COLUMNS.includes(key)) {
                const seperator = setStr ? ` , ` : ` SET `;
                setStr += ` ${seperator} ${key} = ? `;
                setArr.push(value);
            }
        }
        if (!setStr || !whereStr) {
            return null;
        }

        let query = `
            UPDATE ${this.EMPLOYEE_ATTENDANCE_TABLE}
            ${setStr}
            ${whereStr}
        `;
        return mySql.query(query, [...setArr, ...whereArr]);
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
     * getHrmsEmployeeAttendance - function to create the attendance
     *
     * @param {*} param0
     * @returns
     * @author Amit Verma<amitverma@globussoft.in>
     */
    getHrmsEmployeeAttendance({ employee_id, organization_id, date, order_col, order, limit, less_then_equal_date }) {
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

        if (less_then_equal_date) {
            const seperator = whereStr ? ' AND ' : ' ';
            whereStr += `${seperator} date <= ? `;
            whereArr.push(less_then_equal_date);
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
            FROM ${this.HRMS_EMPLOYEE_ATTENDANCE_TABLE} 
            WHERE
            ${whereStr}
            ${orderCol} ${orderStr} ${limitStr}
        `;
        return mySql.query(query, whereArr);
    }

    /**
     * createHrmsAttendance - function to create the attendance
     * 
     * @param {*} param0 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    createHrmsAttendance({ organization_id, employee_id, date, start_time, end_time, is_manual_attendance, check_in_detail }) {
        const query = `
            INSERT INTO ${this.HRMS_EMPLOYEE_ATTENDANCE_TABLE} SET ?
        `;
        return mySql.query(query, { organization_id, employee_id, date, start_time, is_manual_attendance, check_in_detail });
    }

    /**
     * updateHrmsAttendance - function to update the attendance
     * @param {*} queryObj 
     * @param {*} setBodyObj 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    updateHrmsAttendance(queryObj, setBodyObj) {
        // if attendance_id is not present or org_id, emp_id and date are not present 
        // return null
        const { organization_id, employee_id, date, id } = queryObj;
        if (!id && (!organization_id || !employee_id || !date)) {
            return null;
        }

        let whereStr = ``;
        let whereArr = [];
        let setStr = ``;
        let setArr = [];

        for (const [key, value] of Object.entries(queryObj)) {
            if (PERMITTED_QUERY_COLUMNS.includes(key)) {
                const seperator = whereStr ? ` AND ` : ` WHERE `;
                whereStr += ` ${seperator} ${key} = ? `;
                whereArr.push(value);
            }
        }

        for (const [key, value] of Object.entries(setBodyObj)) {
            if (PERMITTED_UPDATE_COLUMNS.includes(key)) {
                const seperator = setStr ? ` , ` : ` SET `;
                setStr += ` ${seperator} ${key} = ? `;
                setArr.push(value);
            }
        }
        if (!setStr || !whereStr) {
            return null;
        }

        let query = `
            UPDATE ${this.HRMS_EMPLOYEE_ATTENDANCE_TABLE}
            ${setStr}
            ${whereStr}
        `;
        return mySql.query(query, [...setArr, ...whereArr]);
    }

    /**
     * Check HRMS Attendance Settings
     * @param {*} organization_id 
     * @returns
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    checkAttendanceSettings(organization_id) {
        const query = `SELECT value FROM organization_hrms_settings ` +
            `WHERE organization_id = ?`;

        return mySql.query(query, [organization_id]);
    }

    /**
     * Check HRMS Attendance and Employee Settings
     * @param {*} organization_id 
     * @returns
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    attendanceSettings(organization_id, employee_id) {
        const query = `SELECT JSON_EXTRACT(ohs.value, '$.type') AS type,
                              JSON_EXTRACT(e.custom_tracking_rule, '$.manual_clock_in') AS manual_clock_in  
                        FROM employees AS e 
                        JOIN organization_hrms_settings AS ohs ON e.organization_id = ohs.organization_id
                        WHERE e.organization_id = ? AND e.id = ?`;

        return mySql.query(query, [organization_id, employee_id]);
    }

    /**
     * checks attendance
     * @param {*} organization_id 
     * @param {*} empID 
     * @param {*} date 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    checkAttendance(organization_id, empID, date, { type, manual_clock_in }) {
        let table = (type == 4 || manual_clock_in == 1) ? 'hrms_employee_attendance' : 'employee_attendance';

        const query = `SELECT details FROM ${table} ` +
            `WHERE organization_id = ? AND employee_id = ? AND date = ?`;

        return mySql.query(query, [organization_id, empID, date]);
    }

    /**
     * Update Status in details
     * @param {*} organization_id 
     * @param {*} empID 
     * @param {*} date 
     * @param {*} details 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    addOverrideStatus(organization_id, empID, date, details, user_id, { type, manual_clock_in }) {
        let table = (type == 4 || manual_clock_in == 1) ? 'hrms_employee_attendance' : 'employee_attendance';

        const query = `UPDATE ${table} SET details = ?, updated_by = ? ` +
            `WHERE organization_id = ? AND employee_id = ? AND date = ?`;

        return mySql.query(query, [details, user_id, organization_id, empID, date]);
    }

    /**
     * Create Attendance if absent
     * @param {*} organization_id 
     * @param {*} empID 
     * @param {*} date 
     * @param {*} details 
     * @param {*} param4 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    createAttendanceOverride(organization_id, employee_id, date, details, user_id, { type, manual_clock_in }) {
        let table = (type == 4 || manual_clock_in == 1) ? 'hrms_employee_attendance' : 'employee_attendance';
        let time = moment(date).format('YYYY-MM-DD 00:00:00');

        const query = `INSERT INTO ${table} SET  ?`;

        return mySql.query(query, { details, organization_id, employee_id, date, updated_by: user_id, start_time: time, end_time: time });
    }

    attendanceRequest(employee_id, date, check_in, check_out, details, organization_id) {
        const query = `INSERT INTO hrms_employee_attendance (employee_id, date, start_time, end_time, details, organization_id)
                       VALUES (?, ?, ?, ?, ?, ?)`;

        return mySql.query(query, [employee_id, date, check_in, check_out, details, organization_id]);
    }

    updateAttendanceRequest(employee_id, date, check_in, check_out, details, organization_id) {
        const query = `UPDATE hrms_employee_attendance SET details=? WHERE employee_id=? AND date=? AND organization_id=?`;

        return mySql.query(query, [details, employee_id, date, organization_id]);
    }

    getDayAttendance(employee_id, date, organization_id) {
        const query = `SELECT employee_id, date, start_time, end_time, details FROM hrms_employee_attendance 
                       WHERE employee_id =? AND date =? AND organization_id =? `;

        return mySql.query(query, [employee_id, date, organization_id]);

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

    /**
     * Gives data according to request_status 
     * @param {*} organization_id 
     * @param {*} status 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    getRequestAttendanceData(organization_id, { status, id, date, month, employee_id, to_assigned_id, role_id }) {
        let query;
        if (to_assigned_id) {
            query = `SELECT hea.id, hea.employee_id, e.emp_code, hea.organization_id,
                    CONCAT(u.first_name, " ", u.last_name) AS name, e.timezone AS employee_timezone,
                    hea.date, hea.start_time, hea.end_time, hea.details
                    FROM assigned_employees AS ae
                    LEFT JOIN employees e ON e.id = ae.employee_id
                    LEFT JOIN hrms_employee_attendance AS hea ON e.id = hea.employee_id
                    LEFT JOIN users AS u ON u.id = e.user_id
                    WHERE hea.organization_id = ? AND ae.to_assigned_id = ${to_assigned_id}
                    AND ae.role_id = ${role_id}`;
        }
        else {
            query = `SELECT hea.id, hea.employee_id, e.emp_code, hea.organization_id,
                    CONCAT(u.first_name, " ", u.last_name) AS name, e.timezone AS employee_timezone,
                    hea.date, hea.start_time, hea.end_time, hea.details
                    FROM employees e
                    LEFT JOIN hrms_employee_attendance AS hea ON e.id = hea.employee_id
                    LEFT JOIN users AS u ON u.id = e.user_id
                    WHERE hea.organization_id = ?`;

            if (employee_id && employee_id != 0) query += ` AND hea.employee_id = ${employee_id}`;
        }

        if (status) query += ` AND JSON_EXTRACT(hea.details, '$.request_status') = ${status}`;
        else query += ` AND JSON_EXTRACT(hea.details, '$.request_status') IN (${[1, 2, 3]})`;
        if (id) query += ` AND hea.id = ${id}`;

        if (date) query += ` AND hea.date = '${date}'`;
        else if (month) query += ` AND hea.date LIKE '${month}'`;

        return mySql.query(query, [organization_id]);
    }

    /**
     * Updates the attendance 
     * @param {*} organization_id 
     * @param {*} id 
     * @param {*} status 
     * @param {*} details 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    updateRequestAttendance(organization_id, id, status, details) {
        let query = `UPDATE hrms_employee_attendance SET details = ?`;

        if (status == 1) {
            query += `, start_time = '${details.check_in}', end_time = '${details.check_out}'`;
        }

        query += ` WHERE organization_id = ? AND id = ?`;
        details = JSON.stringify(details);

        return mySql.query(query, [details, organization_id, id]);
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

    /**
     * Create overridden leave 
     * @param {*} params 
     * @returns 
     */
    createLeaveOverride(params) {
        let query = `INSERT INTO employee_leaves
            (employee_id, organization_id, start_date, end_date, leave_type, day_type, status, number_of_days, reason, day_status)
        values(?)`;

        return mySql.query(query, [params]);
    }

    /**
     * updates overridden leaves
     * @param {*} params 
     * @returns 
     */
    updateEmployeeLeave(params) {
        let query = `UPDATE employee_details
        SET leaves = ? WHERE employee_id = ?`;

        return mySql.query(query, params);
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


    getEmpShiftForAttendanceMark(organization_id, employee_id, date = moment().format("YYYY-MM-DD")) {
        const query = `SELECT es.employee_id, es.shift_id,
            es.start_date, es.end_date, os.data 
            FROM hrms_employee_shifts es
            LEFT JOIN organization_shifts os ON es.shift_id = os.id
            WHERE es.organization_id = ? 
            AND employee_id = ? 
            AND ? BETWEEN start_date AND end_date ;`;

        return mySql.query(query, [organization_id, employee_id, date]);
    }

    deleteLeave(id) {
        const query = `DELETE FROM employee_leaves
                WHERE id = ?`;

        return mySql.query(query, [id]);
    }


    updateLeave({ id, day_status, number_of_days }) {
        const query = `UPDATE employee_leaves 
                SET day_status = ?,
                number_of_days = ?
                WHERE id = ? ;`;

        return mySql.query(query, [day_status, (number_of_days - 1), id]);
    }
   
    getEmployeeDataBio(employee_id, organization_id) {
        let query = `
            SELECT e.id, u.id as user_id, o.id as organization_id, pr.permission_id, bd.user_id as bio_user_id, bd.manual_status, e.timezone
                FROM employees e
                JOIN organizations o ON o.id = e.organization_id
                JOIN users u ON u.id = e.user_id
                JOIN user_role ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id
                LEFT JOIN biometric_data bd ON bd.user_id = u.id                                   
                LEFT JOIN permission_role pr ON pr.role_id = r.id AND pr.permission_id = 215
                WHERE e.id = ${employee_id} AND r.name = "Employee" AND o.id = ${organization_id}
        `;
        return mySql.query(query);
    }
}

module.exports = new attendanceModel;