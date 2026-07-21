const Mysql = require('../../../../database/MySqlConnection').getInstance();
const mongoose = require('mongoose');
const { BaseModel } = require('../../../../models/BaseModel');
const EmpProductivityReportModel = require('../../../../models/employee_productivity.schema');
const OrgDeptAppWebModel = require('../../../../models/organizaton_department_apps_web.schema');
const OgrWebApps = require('../../../../models/organization_apps_web.schema');
const { EmployeeActivityModel } = require("../../../../models/employee_activities.schema");
class WebUsagesModel extends BaseModel {

    /**
     * checkWebUrl - function to check the URL id is valid or not
     * @param {*} url_id 
     * @returns 
     */
    static async checkWebUrl(url_id) {
        return OrgDeptAppWebModel.findOne({ application_id: new mongoose.Types.ObjectId(url_id) });
    }

    /**
     * getWebUsages - function to get the web usages
     * @param {*} param0 
     * @returns 
     */    
    static async getWebUsages({ startDate, endDate, url_id, type = [], organization_id, skip, limit, isCountQuery, employee_ids = [], location_id, department_id, appIds = []}) {
        let aggregateArr = [];
        let filterCond = [];
        let match = {
            yyyymmdd: {
                $gte: parseInt(startDate.split('-').join('')),
                $lte: parseInt(endDate.split('-').join(''))
            }
        };

        if (employee_ids && employee_ids.length) {
            match.employee_id = { $in: employee_ids };
        }

        if (location_id) match.location_id = location_id;
        if (department_id) match.department_id = department_id;
        if (organization_id) match.organization_id = organization_id;

        if (Array.isArray(type) && type.length) {
            match["applications.application_type"] = { $in: type };
            filterCond.push({ $in: ["$$item.application_type", type] });
        }

        if (url_id) {
            const urlObjectId = new mongoose.Types.ObjectId(url_id);
            match["applications.application_id"] = urlObjectId;
            filterCond.push({ $eq: ["$$item.application_id", urlObjectId] });
        } else if (appIds && appIds.length) {
            const applicationIds = appIds.map(i => new mongoose.Types.ObjectId(i));
            match["applications.application_id"] = { $in: applicationIds };
            filterCond.push({ $in: ["$$item.application_id", applicationIds] });
        }

        aggregateArr.push({ $match: match });

        aggregateArr.push({
            $project: {
                _id: 1,
                employee_id: 1,
                yyyymmdd: 1,
                applications: {
                    $filter: {
                        input: "$applications",
                        as: "item",
                        cond: filterCond.length > 0 ? { $and: filterCond } : true
                    }
                }
            }
        });

        aggregateArr.push({ $unwind: "$applications" });

        aggregateArr.push({
            $group: {
                _id: { employee_id: "$employee_id", appId: "$applications.application_id" },
                visitCount: { $sum: 1 },
                neutal: { $sum: "$applications.neu" },
                idle: { $sum: "$applications.idle" },
                productive: { $sum: "$applications.pro" },
                nonProductive: { $sum: "$applications.non" }
            }
        });

        aggregateArr.push({
            $project: {
                _id: 0,
                application_id: "$_id.appId",
                employee_id: "$_id.employee_id",
                visitCount: 1,
                neutal: 1,
                idle: 1,
                productive: 1,
                nonProductive: 1
            }
        });

        if (isCountQuery) {
            aggregateArr.push({ $count: "count" });
        } else {
            aggregateArr.push({ $sort: { visitCount: -1 } });
            if (skip) aggregateArr.push({ $skip: skip });
            if (limit) aggregateArr.push({ $limit: limit });
        }

        return EmpProductivityReportModel.aggregate(aggregateArr);
    }


    /**
     * getEmployeeDetails - function to get the employee details
     * @param {*} employeeIds 
     * @returns 
     */
    static async getEmployeesDetails(employeeIds) {
        let query = `
                    SELECT
                        e.id, CONCAT(u.first_name, ' ' , u.last_name) AS name, e.timezone, u.a_email, u.status,
                        e.department_id,od.name AS department,ol.name AS location,e.emp_code,u.computer_name
                    FROM employees e
                        INNER JOIN users u ON u.id=e.user_id
                        JOIN organization_departments od ON e.department_id = od.id
                        JOIN organization_locations ol ON e.location_id = ol.id
                    WHERE
                        e.id IN (?)`;
        return Mysql.query(query, [employeeIds]);
    }

    /**
     * getActiveEmployeeIds - function to get the active employees
     * @param {*} organizationId 
     * @returns 
     */
    static async getActiveEmployeeIds(organizationId, employeeId = 0) {
        let queryValueArr = [organizationId];
        let query = `
            SELECT 
                e.id
            FROM employees e
            WHERE 
                e.organization_id = ?
        `;
        if (employeeId) {
            query += ` AND e.id = ?`;
            queryValueArr.push(employeeId);
        }
        return Mysql.query(query, queryValueArr);
    }

    /**
     * getEmployeeAssignedToManager - function to get the assigned employees
     * @param {*} manager_id 
     * @param {*} role_id 
     * @returns 
     */
    static async getEmployeeAssignedToManager(manager_id, role_id) {
        const query = `
            SELECT employee_id AS id
            FROM assigned_employees
            WHERE to_assigned_id=? AND role_id=?
        `;

        return Mysql.query(query, [manager_id, role_id])
    }

    /**
     * Get application names by ids
     * @function getAppNames
     * @memberof WebUsagesModel
     * @param {Array} applicationIds 
     * @returns {Promise<Object>} app name list or error
     */
    static getAppNames = (applicationIds) => OgrWebApps.find({ _id: { $in: applicationIds.map(id => new mongoose.Types.ObjectId(id)) } }, { name: 1, type: 1 })

    /**
      * Get application used employee list
      * @function getAppUsageEmployees
      * @memberof WebUsagesModel
      * @param {Array} appIds
      * @param {String} startDate
      * @param {String} endDate
      * @returns {Promise<Object>} app name list or error
      */
    static getAppUsageEmployees({ employeesIds, appIds, startDate, endDate }) {
        let match = {
            employee_id: { $in: employeesIds },
            yyyymmdd: {
                $gte: parseInt(startDate.split('-').join('')), $lte: parseInt(endDate.split('-').join(''))
            },
            "applications.application_id": { $in: appIds.map(id => new mongoose.Types.ObjectId(id)) }
        };
        return EmpProductivityReportModel.find(match, { _id: 0, employee_id: 1 }).lean();
    }

    static getEmployeesDetailsOrg(organization_id, employee_id, start_date, end_date) {
        let query = `
            SELECT e.id AS employee_id, e.timezone, concat(u.first_name, ' ', u.last_name) as full_name
                FROM employees e 
                JOIN users u ON e.user_id = u.id
                WHERE e.id = ${employee_id} AND e.organization_id = ${organization_id}
        `;
        return Mysql.query(query)
    }

    static getEmployeesAttendance(organization_id, employee_id, start_date, end_date) {
        let query = `
            SELECT e.id as employee_id, ea.id as attendance_id, ea.date as attendance_date, ea.start_time
                FROM employees e 
                JOIN employee_attendance ea ON ea.employee_id = e.id 
                WHERE e.id = ${employee_id} AND e.organization_id = ${organization_id} AND (ea.date BETWEEN '${start_date}' AND '${end_date}')
        `;
        return Mysql.query(query)
    }

    static findApplicationUsageDayWise(employee_id, organization_id, attendanceId, skip, limit) {
        return EmployeeActivityModel.aggregate([
            {
                "$match": {
                    employee_id,
                    organization_id,
                    attendance_id: { $in: attendanceId },
                    domain_id: null
                }
            },
            {
                "$lookup": {
                    from: "organization_apps_webs",
                    localField: "application_id",
                    foreignField: "_id",
                    as: "applications"
                }
            },
            { "$unwind": "$applications" },
            {
                "$project": {
                    attendance_id: 1,
                    domain_id: 1,
                    application_id: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    idle_seconds: { $subtract: ["$total_duration", "$active_seconds"] },
                    "application_name": "$applications.name",
                    "application_type": "$applications.type",
                }
            },
            {
                "$group": {
                    _id: "$application_id",
                    "total_duration": { "$sum": "$total_duration" },
                    "active_seconds": { "$sum": "$active_seconds" },
                    "idle_seconds": { "$sum": "$idle_seconds" },
                    "application_name": { "$first": "$application_name" },
                    "application_type": { "$first": "$application_type" },
                    "attendance_id": { "$first": "$attendance_id" },
                }
            },
        ])
    }

    static findApplicationUsageDayWiseCount(employee_id, organization_id, attendanceId, skip, limit) {
        return EmployeeActivityModel.aggregate([
            {
                "$match": {
                    employee_id,
                    organization_id,
                    attendance_id: { $in: attendanceId },
                    domain_id: null
                }
            },
            {
                "$lookup": {
                    from: "organization_apps_webs",
                    localField: "application_id",
                    foreignField: "_id",
                    as: "applications"
                }
            },
            { "$unwind": "$applications" },
            {
                "$project": {
                    attendance_id: 1,
                    domain_id: 1,
                    application_id: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    idle_seconds: { $subtract: ["$total_duration", "$active_seconds"] },
                    "application_name": "$applications.name",
                    "application_type": "$applications.type",
                    employee_id: 1
                }
            },
            {
                "$group": {
                    _id: "$application_id",
                    "total_duration": { "$sum": "$total_duration" },
                    "active_seconds": { "$sum": "$active_seconds" },
                    "idle_seconds": { "$sum": "$idle_seconds" },
                    "application_name": { "$first": "$application_name" },
                    "application_type": { "$first": "$application_type" },
                    "attendance_id": { "$first": "$attendance_id" },
                    "employee_id": { "$first": "$employee_id" },
                }
            },
            {
                "$group": {
                    _id: "$employee_id",
                    "totalCount": { "$sum": 1 }
                }
            }
        ])
    }

    static findWebsiteUsageDayWise(employee_id, organization_id, attendanceId, skip, limit) {
        return EmployeeActivityModel.aggregate([
            {
                "$match": {
                    employee_id,
                    organization_id,
                    attendance_id: { $in: attendanceId }
                }
            },
            {
                "$lookup": {
                    from: "organization_apps_webs",
                    localField: "domain_id",
                    foreignField: "_id",
                    as: "applications"
                }
            },
            { "$unwind": "$applications" },
            {
                "$project": {
                    attendance_id: 1,
                    domain_id: 1,
                    application_id: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    idle_seconds: { $subtract: ["$total_duration", "$active_seconds"] },
                    "application_name": "$applications.name",
                    "application_type": "$applications.type",
                }
            },
            {
                "$group": {
                    _id: "$domain_id",
                    "total_duration": { "$sum": "$total_duration" },
                    "active_seconds": { "$sum": "$active_seconds" },
                    "idle_seconds": { "$sum": "$idle_seconds" },
                    "application_name": { "$first": "$application_name" },
                    "application_type": { "$first": "$application_type" },
                    "attendance_id": { "$first": "$attendance_id" },
                }
            },
        ])
    }

    static findWebsiteUsageDayWiseCount(employee_id, organization_id, attendanceId, skip, limit) {
        return EmployeeActivityModel.aggregate([
            {
                "$match": {
                    employee_id,
                    organization_id,
                    attendance_id: { $in: attendanceId }
                }
            },
            {
                "$lookup": {
                    from: "organization_apps_webs",
                    localField: "domain_id",
                    foreignField: "_id",
                    as: "applications"
                }
            },
            { "$unwind": "$applications" },
            {
                "$project": {
                    attendance_id: 1,
                    domain_id: 1,
                    application_id: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    idle_seconds: { $subtract: ["$total_duration", "$active_seconds"] },
                    "application_name": "$applications.name",
                    "application_type": "$applications.type",
                    employee_id: 1
                }
            },
            {
                "$group": {
                    _id: "$domain_id",
                    "total_duration": { "$sum": "$total_duration" },
                    "active_seconds": { "$sum": "$active_seconds" },
                    "idle_seconds": { "$sum": "$idle_seconds" },
                    "application_name": { "$first": "$application_name" },
                    "application_type": { "$first": "$application_type" },
                    "attendance_id": { "$first": "$attendance_id" },
                    "employee_id": { "$first": "$employee_id" },
                }
            },
            {
                "$group": {
                    _id: "$employee_id",
                    "totalCount": { "$sum": 1 }
                }
            }
        ])
    }
}

module.exports.WebUsagesModel = WebUsagesModel;