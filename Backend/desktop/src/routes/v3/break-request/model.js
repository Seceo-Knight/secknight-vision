const _ = require('underscore');
const mongoose = require('mongoose')
const mysql = require(`../../../database/MySqlConnection`).getInstance()
const EmployeeProductivityModel = require('../../../models/employee_productivity.schema');
const BreakRequestModel = require('../../../models/break_request.schema');
const ActivityRequestModel = require('../../../models/activity_request.schema');
const moment = require('moment');
const EmployeeActivityModel = require("../../../models/employee_activities.schema");
const { OrganizationReasonModel } = require("../../../models/organization_timeclaim_reasons.schema");

class Model {


    static create(param) {
        return BreakRequestModel(param).save()
    }

    static getEmployeeProductivity({ date, employeeId }) {
        return EmployeeProductivityModel
            .findOne({ date, employee_id: employeeId });
    }

    
    static getAttendanceId({ date, employeeId, organizationId }) {
        const query = `
                    SELECT ea.id,e.timezone,e.department_id 
                    FROM employee_attendance ea
                    INNER JOIN employees e on e.id = ea.employee_id
                    WHERE ea.date = ? AND ea.employee_id = ? AND ea.organization_id = ?
                    `;

        return mysql.query(query, [date, employeeId, organizationId])
    }
    
    static getPreviousReqBreakTime({ organizationId, employee_id, date, type, id }) {
        let match = { organization_id: organizationId, employee_id, date, status: { $in : [1 , 0]} } // status 0 from existing pending request and 1 from approved
        if (id) match = { _id: { $ne: new mongoose.Types.ObjectId(id) }, ...match };
        return BreakRequestModel.aggregate([
            {
                $match: match,
            },
            {
                $project: { _id: 0, start_time: 1, end_time: 1 }
            }
        ])
    }

    static getTimeClaimRequest({ organization_id, employee_id, date, attendanceId, type = 2 }){
        return ActivityRequestModel.aggregate([
            {
                $match: {
                    organization_id,
                    type: type,
                    employee_id,
                    status: { $in: [0, 1] },
                    attendance_id: attendanceId,
                    date: date,
                }
            }
        ]);
    }

    static getIdleRequest({ organization_id, employee_id, date, attendanceId }){
        return ActivityRequestModel.aggregate([
            {
                $match: {
                    organization_id,
                    type: 1,
                    employee_id,
                    status: { $in: [0, 1] },
                    attendance_id: attendanceId,
                    date: date,
                }
            },
            {
                $project: { _id: 0, start_time: 1, end_time: 1, activities: 1 }
            }
        ]);
    }

    static getEmployeeActivities({ attendanceId }) {
        let match = { attendance_id: attendanceId };

        return EmployeeActivityModel.aggregate([
            {
                $match: match
            },
            {
                $project: {
                    start_time: 1,
                    end_time: 1,
                    application_id: 1,
                    domain_id: 1,
                    url: 1,
                    idleData: 1,
                    activeData: 1,
                },
            },
            {
                $sort: { start_time: 1 }
            }
        ]);
    }

    static getEmployeeDetails({ organizationId, employee_ids, date }) {
        let query = `SELECT e.id, ea.id as attendance_id, CONCAT(u.first_name ," ", u.last_name) name ,e.timezone ,e.department_id FROM employees e 
                     JOIN employee_attendance ea on ea.employee_id = e.id
                     JOIN users u ON u.id = e.user_id
                     WHERE e.id=${employee_ids} and ea.date='${date}' and e.organization_id=${organizationId};`;
        return mysql.query(query);
    }

    static isApprovedOrg(organization_id) {
        const query = `
            SELECT u.auto_time_claim as auto_accept_time_claim
            FROM organizations o
            JOIN users u ON u.id=o.user_id
            WHERE o.id = ${organization_id};
        `;
        return mysql.query(query);
    }

    static getAssignedAdminId(user_id, employee_id) {
        let query = `
            SELECT u.auto_time_claim as auto_accept_time_claim, to_assigned_id as non_admin_id
            FROM users u
            JOIN employees e ON e.user_id=u.id
            JOIN assigned_employees ae ON ae.employee_id=e.id
        `;
        if (user_id) query += ` WHERE u.id = ${user_id};`
        if (employee_id) query += ` WHERE e.id = ${employee_id};`
        return mysql.query(query);
    }

    static getNonAdminApproval(assignedAdminId) {
        let query = `
            SELECT u.auto_time_claim as auto_accept_time_claim, u.id as user_id
            FROM users u
            JOIN employees e ON e.user_id=u.id
            WHERE e.id IN (?);
        `;
        return mysql.query(query, [assignedAdminId]);
    }

    static getEmployees({ organization_id, employee_ids }) {
        let query = `SELECT e.id ,CONCAT(u.first_name ," ", u.last_name) name ,e.timezone ,e.department_id, u.computer_name
        FROM employees e
        INNER JOIN users u ON u.id = e.user_id
        WHERE
        e.organization_id=${organization_id} AND e.id IN (${employee_ids})`

        return mysql.query(query)
    }

    static getEmployeeActivityByIds(ids) {
        ids = ids.map(_id => new mongoose.Types.ObjectId(_id));
        return EmployeeActivityModel
            .aggregate([
                {
                    $match: { _id: { $in: ids } }
                },
                {
                    $project: {
                        _id: 0, activity_id: "$_id"
                    }
                },
            ]);
    }

    static createIdleRequest(param) {
        return ActivityRequestModel(param).save();
    }

    static getAdminData(organization_id) {
        let query = `SELECT u.id, CONCAT(u.first_name ," ",u.last_name) AS name
        FROM users u 
        INNER JOIN organizations o ON o.user_id=u.id
        WHERE o.id IN (?) `
        return mysql.query(query, [organization_id])
    }

    static getApprovers({ organization_id, employee_ids }) {
        let query = `SELECT   CONCAT(u.first_name ," ", u.last_name) name,u.email ,r.name role ,pr.permission_id ,ae.employee_id
        from users u
        INNER JOIN employees e ON e.user_id=u.id
        INNER JOIN user_role ur on ur.user_id=u.id
        INNER JOIN roles r ON r.id=ur.role_id
        INNER join permission_role  pr ON pr.role_id=r.id
        INNER JOIN permissions p ON p.id=pr.permission_id
        INNER JOIN  assigned_employees ae on ae.to_assigned_id=e.id
        WHERE ae.employee_id in(?)   
        AND p.name="activity_alter_process"
        AND e.organization_id=?
        GROUP BY u.id
        `
        return mysql.query(query, [employee_ids, organization_id])
    }

    static findReasons({ organization_id, type }) {
        return OrganizationReasonModel.aggregate([
            { $match: { organization_id: organization_id } },
            { $unwind: '$reasons' },
            { $match: { 'reasons.type': type } },
            { $group: { _id: '$_id', list: { $push: '$reasons' } } }
        ]);
    }

}
module.exports.Model = Model;