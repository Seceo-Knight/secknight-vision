const mySql = require('../../../../database/MySqlConnection').getInstance();

class LeaveModel {

    /**
    * Checking leave with Id
    *
    * @function checkLeaveById
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    checkLeaveById(leave_id, organization_id) {
        let query = `SELECT id,day_type,leave_type,start_date,end_date,reason,employee_id FROM employee_leaves WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [leave_id, organization_id]);
    }

    /**
    * Adding leave with Id
    *
    * @function addLeave
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    addLeave(employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, day_status, organization_id, status) {
        let query = `INSERT INTO employee_leaves (employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, day_status, organization_id, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        return mySql.query(query, [employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, day_status, organization_id, status]);
    }

    /**
    * Get leave with Id
    *
    * @function getLeaves
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    getLeaves(leave_id, employee_id, is_employee, is_admin, organization_id) {
        let query = ``;
        if (!is_admin && !is_employee) {
            query += `SELECT el.id,el.employee_id,CONCAT(u.first_name, ' ', u.last_name) AS employee_name, el.leave_type,el.day_type,
                      olt.name,el.start_date,el.end_date,el.number_of_days,el.reason,el.status,
                      (COUNT( e.id ) OVER()) AS total_count, e.timezone 
                      FROM assigned_employees a
                      INNER JOIN employees e ON e.id=a.employee_id
                      INNER JOIN employee_leaves el ON el.employee_id=e.id
                      INNER JOIN organization_leave_types olt ON olt.id=el.leave_type
                      INNER JOIN users u ON u.id=e.user_id
                      INNER JOIN user_role ur ON ur.user_id=u.id
                      WHERE e.organization_id='${organization_id}' AND a.to_assigned_id='${employee_id}'`;
        } else {
            query += `SELECT el.id,el.employee_id,CONCAT(u.first_name, ' ', u.last_name) AS employee_name, 
                      el.leave_type,el.day_type,ol.name,el.start_date,el.end_date,el.number_of_days,el.reason,el.status
                      FROM employee_leaves el 
                      LEFT JOIN employees e ON e.id=el.employee_id 
                      INNER JOIN users u ON u.id=e.user_id 
                      INNER JOIN organization_leave_types ol ON ol.id=el.leave_type
                      WHERE el.organization_id='${organization_id}'`;
            if (leave_id) query += ` AND el.id='${leave_id}'`;
            if (is_employee) query += ` AND el.employee_id='${employee_id}'`;
        }
        query += ` ORDER BY el.end_date DESC`;
        return mySql.query(query);
    }

    /**
    * Update leave with Id
    *
    * @function updateLeave
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    updateLeave(leave_id, employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, day_status, status, organization_id) {
        let query = `UPDATE employee_leaves SET employee_id=(?), day_type=(?), leave_type=(?), start_date=(?), end_date=(?), reason=(?), number_of_days=(?), day_status=(?), status=(?)
                     WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [employee_id, day_type, leave_type, start_date, end_date, reason, number_of_days, day_status, status, leave_id, organization_id]);
    }

    /**
    * Delete leave with Id
    *
    * @function deleteLeave
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    deleteLeave(leave_id, organization_id) {
        let query = `DELETE FROM employee_leaves WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [leave_id, organization_id]);
    }

    /**
    * Get leave types
    *
    * @function getLeaveTypes
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    getLeaveTypes(leave_id, organization_id) {
        let query = `SELECT id, name, duration, number_of_days, carry_forward FROM organization_leave_types WHERE organization_id='${organization_id}'`;
        if (leave_id) query += ` AND id='${leave_id}'`
        return mySql.query(query);
    }

    /**
    * Create leave type
    *
    * @function createLeaveType
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    createLeaveType(name, duration, number_of_days, carry_forward, organization_id) {
        let query = `INSERT INTO organization_leave_types (name, duration, number_of_days, carry_forward, organization_id)
                    VALUES (?, ?, ?, ?, ?)`;
        return mySql.query(query, [name, duration, number_of_days, carry_forward, organization_id]);
    }

    /**
    * Update leave type
    *
    * @function updateLeaveType
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    updateLeaveType(leave_id, name, duration, number_of_days, carry_forward, organization_id) {
        let query = `UPDATE organization_leave_types SET name=(?), duration=(?), number_of_days=(?), carry_forward=(?) WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [name, duration, number_of_days, carry_forward, leave_id, organization_id]);
    }

    /**
    * Get leave type by Name
    *
    * @function checkLeaveTypeByName
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    checkLeaveTypeByName(name, organization_id) {
        let query = `SELECT id,name FROM organization_leave_types WHERE name=(?) AND organization_id=(?)`;
        return mySql.query(query, [name, organization_id]);
    }

    /**
    * Delete leave type
    *
    * @function deleleLeaveType
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    deleleLeaveType(leave_id, organization_id) {
        let query = `DELETE FROM organization_leave_types WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [leave_id, organization_id]);
    }

    /**
    * Get Leaves by employee Id
    *
    * @function getLeaveByEmployee
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
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
    * Get Employee leaves
    *
    * @function getEmployeeLeaves
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    getEmployeeLeaves(employee_ids, start, end, organization_id) {
        let query = `SELECT employee_id, leave_type, SUM(number_of_days) total_applied 
                     FROM employee_leaves 
                     WHERE employee_id IN (?) AND status=1 
                     AND start_date BETWEEN (?) AND (?) AND organization_id=(?) GROUP BY employee_id `;
        return mySql.query(query, [employee_ids, start, end, organization_id]);
    }

    /**
    * Update leave status
    *
    * @function updateLeaveStatus
    * @memberof  LeaveModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    updateLeaveStatus(leave_id, status, organization_id) {
        let query = `UPDATE employee_leaves SET status=(?)
                     WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [status, leave_id, organization_id]);
    }

    getEmployeeAnnualLeaves(employee_id, leave_type, start, end, organization_id) {
        let query = `SELECT el.id, el.employee_id, el.day_type, el.leave_type, SUM(el.number_of_days) total_applied, olt.number_of_days AS leave_type_duration
                     FROM employee_leaves el
                     LEFT JOIN organization_leave_types olt ON olt.id=el.leave_type
                     WHERE el.leave_type=(?) AND el.employee_id=(?) AND el.status IN (0,1)
                     AND el.start_date BETWEEN (?) AND (?) AND el.organization_id=(?)
                     GROUP BY el.employee_id`;
        return mySql.query(query, [leave_type, employee_id, start, end, organization_id]);
    }

    getEmployeeAnnualLeavesExept(leave_id, employee_id, leave_type, start, end, organization_id) {
        let query = `SELECT el.id, el.employee_id, el.day_type, el.leave_type, SUM(el.number_of_days) total_applied, olt.number_of_days AS leave_type_duration
                     FROM employee_leaves el
                     LEFT JOIN organization_leave_types olt ON olt.id=el.leave_type
                     WHERE el.leave_type=(?) AND el.employee_id=(?) AND el.status IN (0,1)
                     AND el.start_date BETWEEN (?) AND (?) AND el.organization_id=(?) AND NOT el.id=(?)
                     GROUP BY el.employee_id`;
        return mySql.query(query, [leave_type, employee_id, start, end, organization_id, leave_id]);
    }

    getEmployeeLeavesById(employee_id, start, end, organization_id) {
        let query = `SELECT id, employee_id, start_date, end_date 
                     FROM employee_leaves 
                     WHERE employee_id=(?) AND status IN (0,1) 
                     AND start_date BETWEEN (?) AND (?) AND organization_id=(?)`;
        return mySql.query(query, [employee_id, start, end, organization_id]);
    }

    getLeaveByMonth(start, end, organization_id) {
        let query = `SELECT el.id, e.emp_code AS emp_id, el.employee_id, CONCAT(u.first_name, ' ', u.last_name) AS employee_name, el.start_date, el.end_date, el.status, el.number_of_days, el.day_type, el.leave_type, olt.name
                     FROM employee_leaves el 
                     LEFT JOIN organization_leave_types olt ON olt.id=el.leave_type
                     INNER JOIN employees e ON e.id=el.employee_id
                     INNER JOIN users u ON u.id=e.user_id
                     WHERE el.status=1 
                     AND el.start_date BETWEEN (?) AND (?) AND el.organization_id=(?)`;
        return mySql.query(query, [start, end, organization_id]);
    }

    updateLossOfPay(lop) {
        let query = `INSERT INTO employee_payroll (employee_id, lop, present_days, working_days, total_days, month, year, organization_id)
                    VALUES ?`;
        return mySql.query(query, [lop]);
    }

    /**
    * Get Employee leaves by Status
    *
    * @function getLeaveByStatus
    * @memberof  LeaveModel
    * @param {Number} status
    * @param {Number} organization_id
    * @returns {Array} -  return promise.
    */
    getLeaveByStatus(status, employee_id, is_employee, organization_id, to_assigned_id, role_id, month) {
        let query = ``;
        if (to_assigned_id) {
            query += `SELECT el.id, e.emp_code AS emp_id, el.employee_id, CONCAT(u.first_name, ' ', u.last_name) AS employee_name, 
                  el.start_date, el.end_date, el.status, el.number_of_days, el.day_type, el.leave_type, olt.name, el.reason
                  FROM assigned_employees AS ae
                  LEFT JOIN employee_leaves el ON ae.employee_id=el.employee_id
                  LEFT JOIN organization_leave_types olt ON olt.id=el.leave_type
                  INNER JOIN employees e ON e.id=el.employee_id
                  INNER JOIN users u ON u.id=e.user_id
                  WHERE el.organization_id=? AND ae.to_assigned_id = ${to_assigned_id}
                  AND ae.role_id = ${role_id}`;
        }
        else {
            query += `SELECT el.id, e.emp_code AS emp_id, el.employee_id, CONCAT(u.first_name, ' ', u.last_name) AS employee_name, 
                    el.start_date, el.end_date, el.status, el.number_of_days, el.day_type, el.leave_type, olt.name, el.reason
                    FROM employee_leaves el 
                    LEFT JOIN organization_leave_types olt ON olt.id=el.leave_type
                    INNER JOIN employees e ON e.id=el.employee_id
                    INNER JOIN users u ON u.id=e.user_id
                    WHERE el.organization_id=?`;
        }
        let params = [];
        params.push(organization_id);
        if (status != 3) {
            query += ` AND el.status=?`;
            params.push(status);
        }
        if (is_employee) {
            query += ` AND el.employee_id=?`;
            params.push(employee_id);
        }
        if (month) {
            query += ` AND (el.start_date LIKE ? || el.start_date LIKE ?) `;
            params.push(month, month);
        }
        query += ` ORDER BY el.end_date DESC`;
        return mySql.query(query, params);
    }

     /**
    * Get Employee leaves for FieldTrack
    *
    * @function getLeaveByStatus
    * @memberof  LeaveModel
    * @param {Number} status
    * @param {Number} organization_id
    * @returns {Array} -  return promise.
    */
     getFieldLeaves(employee_id, is_employee, organization_id, to_assigned_id, role_id,startDate,endDate) {
        try{
                let query = ``;
            if (to_assigned_id) {
                query += `SELECT el.id, e.emp_code AS emp_id, el.employee_id, CONCAT(u.first_name, ' ', u.last_name) AS employee_name, 
                      el.start_date, el.end_date, el.status, el.number_of_days, el.day_type, el.leave_type, olt.name, el.reason,el.day_status
                      FROM assigned_employees AS ae
                      LEFT JOIN employee_leaves el ON ae.employee_id=el.employee_id
                      LEFT JOIN organization_leave_types olt ON olt.id=el.leave_type
                      INNER JOIN employees e ON e.id=el.employee_id
                      INNER JOIN users u ON u.id=e.user_id
                      WHERE el.organization_id=? AND ae.to_assigned_id = ${to_assigned_id}
                      AND ae.role_id = ${role_id}`;
            }
            else {
                query += `SELECT el.id, e.emp_code AS emp_id, el.employee_id, CONCAT(u.first_name, ' ', u.last_name) AS employee_name, 
                        el.start_date, el.end_date, el.status, el.number_of_days, el.day_type, el.leave_type, olt.name, el.reason,el.day_status
                        FROM employee_leaves el 
                        LEFT JOIN organization_leave_types olt ON olt.id=el.leave_type
                        INNER JOIN employees e ON e.id=el.employee_id
                        INNER JOIN users u ON u.id=e.user_id
                        WHERE el.organization_id= ${organization_id}`;
            }
          
            if (is_employee) {
                query += ` AND el.employee_id= ${employee_id}`;
            }
            if (startDate && endDate) {
                query += ` AND (el.start_date between '${startDate}' and '${endDate}' || el.end_date between '${startDate}' and '${endDate}' ) `;
            }
            return mySql.query(query);
        }
        catch(err){
            throw err;
        }
    }

    /**
    * Get Employee leaves details
    *
    * @function getLeaveDetails
    * @memberof  LeaveModel
    * @param {Number} leave_id
    * @param {Number} organization_id
    * @returns {Array} -  return promise.
    */
    getLeaveDetails(leave_id, organization_id) {
        let query = `SELECT el.id, e.emp_code AS emp_id, el.employee_id, CONCAT(u.first_name, ' ', u.last_name) AS employee_name,
                     el.start_date, el.end_date, el.status, el.number_of_days, el.day_type, el.leave_type, olt.name, el.reason, el.day_status 
                     FROM employee_leaves el 
                     LEFT JOIN organization_leave_types olt ON olt.id=el.leave_type
                     INNER JOIN employees e ON e.id=el.employee_id
                     INNER JOIN users u ON u.id=e.user_id
                     WHERE el.id=(?) AND el.organization_id=(?)`;
        return mySql.query(query, [leave_id, organization_id]);
    }

    /**
    * Update Employee leaves status
    *
    * @function updateLeaveDayStatus
    * @memberof  LeaveModel
    * @param {Number} leave_id
    * @param {String} approved
    * @param {Number} type
    * @param {Number} organization_id
    * @returns {Array} -  return promise.
    */
    updateLeaveDayStatus(leave_id, type, approved, organization_id) {
        let query = `UPDATE employee_leaves SET status=(?), day_status=(?) WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [type, approved, leave_id, organization_id]);
    }

    /**
    * Update Employee leave status
    *
    * @function getLeaveDayStatus
    * @memberof  LeaveModel
    * @param {Number} leave_id
    * @param {Number} type
    * @param {Number} organization_id
    * @returns {Array} -  return promise.
    */

    getLeaveDayStatus(leave_id, organization_id) {
        let query = `SELECT day_status,day_type,leave_type,employee_id, status FROM employee_leaves WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [leave_id, organization_id]);
    }

    LossOfPay(total, working, present, lop, employee_id, month, year, organization_id) {
        let query = `UPDATE employee_payroll SET total_days=(?), working_days=(?), present_days=(?), lop=(?)
                     WHERE employee_id =(?) AND month=(?) AND year=(?) AND organization_id=(?)`;

        return mySql.query(query, [total, working, present, lop, employee_id, month, year, organization_id]);

    }

    getEmployeeExists(empIds, month, year, organization_id) {
        let query = `
            SELECT
                employee_id, total_days AS total, working_days AS working, present_days AS present, lop 
            FROM employee_payroll
            WHERE 
                organization_id=(?) AND employee_id IN (?) AND  year=(?) AND month=(?);`
        return mySql.query(query, [organization_id, empIds, year, month]);
    }

    getHolidayAndShift(organization_id, employee_id) {
        let query = `SELECT h.holiday_date, hs.data 
                    FROM employees e
                    LEFT JOIN holidays h ON h.organization_id = e.organization_id
                    LEFT JOIN organization_shifts hs ON e.shift_id = hs.id
                    WHERE e.organization_id = ? AND e.id = ?`;
        return mySql.query(query, [organization_id, employee_id]);
    }

    getEmployeeDetails({ organization_id, employee_id, is_assigned_to, role_id, skip, limit, name }) {
        let query = '';
        if (is_assigned_to) {
            query = `SELECT e.id as employee_id, ed.id as employee_details_id,
            CONCAT(u.first_name, ' ', u.last_name) as name, e.emp_code,
            ed.leaves, u.date_join
            FROM assigned_employees ae
            LEFT JOIN employees e ON ae.employee_id = e.id
            LEFT JOIN users u ON u.id = e.user_id
            LEFT JOIN employee_details ed ON e.id = ed.employee_id
            WHERE e.organization_id = ${organization_id} 
            AND ae.to_assigned_id = ${is_assigned_to} AND ae.role_id = ${role_id} 
            AND u.status = 1 `;
        } else {
            query = `SELECT e.id as employee_id, ed.id as employee_details_id,
            CONCAT(u.first_name, ' ', u.last_name) as name, e.emp_code,
            ed.leaves, u.date_join
            FROM employees e
            LEFT JOIN users u ON u.id = e.user_id
            LEFT JOIN employee_details ed ON e.id = ed.employee_id
            WHERE e.organization_id = ${organization_id} 
            AND u.status = 1 `;
        }
        
        if (employee_id) query += ` AND e.id = ${employee_id}`;
        if (name) query += ` AND (CONCAT(u.first_name, ' ', u.last_name) LIKE '%${name}%' OR e.emp_code LIKE '%${name}%')`;
        else if ((skip || limit) && !employee_id) {
            if (skip) query += ` LIMIT ${skip} `;
            if (limit) query += skip ? `, ${limit} ` : ` LIMIT ${limit} `;
        }

        return mySql.query(query);
    }

    insertEmployeeLeaves(params) {
        let query = `INSERT INTO employee_details
                (employee_id, organization_id, leaves)
                VALUES (?)`;

        return mySql.query(query, [params]);
    }

    updateEmployeeLeave(params) {
        let query = `UPDATE employee_details
        SET leaves = ? WHERE employee_id = ?`;

        return mySql.query(query, params);
    }

    getAppliedLeaves(organization_id, employee_id, year, is_assigned_to, role_id) {
        let query = '';
        if (is_assigned_to) {
            query = `SELECT el.day_status, el.day_type,
            el.employee_id, el.leave_type as leave_id, el.status
            FROM assigned_employees ae
            INNER JOIN employee_leaves el ON el.employee_id = ae.employee_id
            WHERE el.organization_id = ${organization_id} 
            AND ae.to_assigned_id = ${is_assigned_to} AND ae.role_id = ${role_id} 
            AND el.start_date LIKE '%${year}%'`;
        }
        else {
            query = `SELECT day_status, day_type,
            employee_id,leave_type as leave_id, status
            FROM employee_leaves
            WHERE organization_id = ${organization_id}
            AND start_date LIKE '%${year}%'`;

            if (employee_id) query += ` AND employee_id = ${employee_id}`;
        }

        return mySql.query(query);
    }

    annualLeavesOfEmployee(organization_id, year, employee_id = null, leave_type = null, except_leave_id = null) {
        let query = `SELECT id, employee_id, day_status, leave_type, day_type, status
            FROM employee_leaves 
            WHERE organization_id = ${organization_id}
            AND start_date LIKE '${year}%'`;
        if (employee_id) query += `AND employee_id IN (${employee_id})`;
        if (leave_type) query += ` AND leave_type IN (${leave_type})`;
        if (except_leave_id) query += ` AND id NOT IN (${except_leave_id})`;

        return mySql.query(query);
    }

    employeeCount({ organization_id, is_assigned_to, role_id }) {
        let query = '';
        if (is_assigned_to) {
            query = `SELECT COUNT(*) as total_count
            FROM assigned_employees ae
            LEFT JOIN employees e ON ae.employee_id = e.id
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.organization_id = ${organization_id} 
            AND ae.to_assigned_id = ${is_assigned_to} AND ae.role_id = ${role_id} 
            AND u.status = 1 
            `;
        } else {
            query = `SELECT COUNT(*) as total_count
            FROM employees e
            LEFT JOIN users u ON u.id = e.user_id 
            WHERE e.organization_id = ${organization_id} 
            AND u.status = 1 `;
        }

        return mySql.query(query);
    }

    leaveExists(organization_id, employee_id, start_date, end_date) {
        let query = `SELECT * FROM employee_leaves
            WHERE  organization_id = ${organization_id} AND employee_id = ${employee_id} AND
            (start_date LIKE '${start_date}%' OR end_date LIKE '${end_date}%') AND status IN (0,1)`;

        return mySql.query(query);
    }

    checkShifts({ organization_id, employee_id }) {
        let query = `SELECT os.data, hes.start_date, hes.end_date 
                FROM hrms_employee_shifts hes
                INNER JOIN organization_shifts os ON os.id = hes.shift_id 
                WHERE hes.organization_id = ${organization_id}
                AND hes.employee_id = ${employee_id} `;

        return mySql.query(query);
    }
}

module.exports = new LeaveModel;