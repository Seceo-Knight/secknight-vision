const _ = require('underscore');
const mySql = require('../../../../database/MySqlConnection').getInstance();
const { EmployeeActivityModel: EmpActivityModel } = require('../../../../models/employee_activities.schema');
const EmpKeyStrokesModel = require('../../../../models/employee_keystrokes.schema');
const OrgDeptAppWebModel = require('../../../../models/organizaton_department_apps_web.schema');
const OrgAppWebModel = require('../../../../models/organization_apps_web.schema');
const SqlString = require('sqlstring');
const EmpProductivityReportsModel = require('../../../../models/employee_productivity.schema');
const mongoose = require('mongoose');
const activityLogsSchema =require('../../auth/services/activitylogs.schema')

class EmployeeReportsModel {
    /**
     * ! NOT IN USE
     * @param {Object} dataObj
     * @param {Number} dataObj.organization_id
     * @param {Number} dataObj.employee_id
     * @param {String} dataObj.startDate
     * @param {String} dataObj.endDate
     * @returns {Promise<any>}
     * @memberof EmployeeReportsModel
     * @deprecated
     */
    getLogDetails(dataObj) {
        const { organization_id, employee_id, startDate, endDate } = dataObj;
        const query = `
            SELECT p.id, p.log_sheet_id, p.day, p.login_time, p.logout_time, p.user_id,u.name AS user_name, p.working_hours, p.non_working_hours, p.total_hours, p.is_report_generated,
            (SELECT count(*) FROM production_stats ps WHERE ps.admin_id=${organization_id} AND  ps.user_id=${employee_id} AND (ps.day BETWEEN '${from_date}' AND '${to_date}')) AS total_count
            FROM production_stats p
            INNER JOIN users u ON u.id=p.user_id
            WHERE p.admin_id=${organization_id} AND p.user_id=${employee_id} AND (p.day BETWEEN '${startDate}' AND '${endDate}')
            ORDER BY p.day DESC
        `;

        return mySql.query(query);
    }

    getKeyStrokes(attendance_ids) {
        return EmpKeyStrokesModel
            .aggregate([
                { $match: { attendance_id: { $in: attendance_ids }, } },
                { $group: { _id: "$attendance_id", keystrokes: { $push: { $concat: ["$keystrokes"] } } } },
                { $project: { _id: 0 } }
                // { $sort: { createdAt: -1 } }
            ])
    }

    getOrganizationAppsWebs(organization_id, applicationIds) {
        const query = [
            {
                $match: {
                    _id: { $in: applicationIds },
                    organization_id: organization_id,
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                }
            },
        ];
        return OrgAppWebModel.aggregate(query);
    }
    
    getOrganizationAppsWebsNew(organization_id, keyword) {
        let searchQuery = {organization_id: organization_id}
        if(keyword) searchQuery.name = new RegExp(keyword, 'i') 
        const query = [
            {
                $match: searchQuery
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                }
            },
        ];
        return OrgAppWebModel.aggregate(query);
    }

    getBrowserHistory(attendanceIds) {
        const query = [
            {
                $match: {
                    attendance_id: { $in: attendanceIds },
                    domain_id: { '$ne': null },
                }
            },
            {
                $project: {
                    _id: '$domain_id',
                    title: 1,
                    attendance_id: 1,
                    domain_id: 1,
                    application_id: 1,
                    url: 1,
                    keystrokes: 1,
                    start_time: 1,
                    end_time: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    idle_seconds: { $subtract: ["$total_duration", "$active_seconds"] }
                }
            },
        ];
        return EmpActivityModel.aggregate(query);
    }

    getBrowserHistoryNew(attendanceIds,domainIds) {
        const query = [
            {
                $match: {
                    attendance_id: { $in: attendanceIds },
                    domain_id: { $in: domainIds },
                }
            },
            {
                $project: {
                    _id: '$domain_id',
                    title: 1,
                    attendance_id: 1,
                    domain_id: 1,
                    application_id: 1,
                    url: 1,
                    keystrokes: 1,
                    start_time: 1,
                    end_time: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    idle_seconds: { $subtract: ["$total_duration", "$active_seconds"] }
                }
            },
        ];
        return EmpActivityModel.aggregate(query);
    }
    async getBrowserHistoryCustom(attendanceIds, startTime, endTime, start_date, end_date) {
        let gDate = new Date(`${start_date} ${startTime}`);
        let lDate = new Date(`${end_date} ${endTime}`);
        return await EmpActivityModel.find({
            attendance_id: { $in: attendanceIds },
            domain_id: { '$ne': null },
            createdAt: {
                $gte: gDate, //2021-08-12T16:59:53.676+0000
                $lte: lDate
            }
        });
    }

    getApplicationUsed(attendanceIds) {
        const query = [
            {
                $match: {
                    attendance_id: { $in: attendanceIds },
                    application_id: { $ne: null },
                    domain_id: { $eq: null },
                }
            },
            {
                $project: {
                    _id: '$application_id',
                    title: 1,
                    attendance_id: 1,
                    application_id: 1,
                    keystrokes: 1,
                    start_time: 1,
                    end_time: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    idle_seconds: { $subtract: ["$total_duration", "$active_seconds"] }
                }
            },
        ];
        return EmpActivityModel.aggregate(query);
    }
    getApplicationUsedNew(attendanceIds,applicationIds) {
        const query = [
            {
                $match: {
                    attendance_id: { $in: attendanceIds },
                    application_id: { $in: applicationIds },
                    domain_id: { $eq: null },
                }
            },
            {
                $project: {
                    _id: '$application_id',
                    attendance_id: 1,
                    title: 1,
                    application_id: 1,
                    keystrokes: 1,
                    start_time: 1,
                    end_time: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    idle_seconds: { $subtract: ["$total_duration", "$active_seconds"] }
                }
            },
        ];
        return EmpActivityModel.aggregate(query);
    }


    async getApplicationUsedCustom(attendanceIds, startTime, endTime, start_date, end_date) {
        let gDate = new Date(`${start_date} ${startTime}`);
        let lDate = new Date(`${end_date} ${endTime}`);

        return await EmpActivityModel.find({
            attendance_id: { $in: attendanceIds },
            application_id: { $ne: null },
            domain_id: { $eq: null },
            createdAt: {
                $gte: gDate, //2021-08-12T16:59:53.676+0000
                $lte: lDate
            }
        });
    }

    getAttandanceIds({ organization_id, employee_id, startDate, endDate }) {
        const query = `
            SELECT id AS attendance_id
            FROM employee_attendance
            WHERE
                organization_id = ${organization_id} AND
                employee_id = ${employee_id} AND
                date BETWEEN "${startDate}" AND "${endDate}"
        `;

        return mySql.query(query)
    }

    getEmployees(employee_ids, organization_id) {
        const query = `
            SELECT
                u.first_name,
                u.last_name,
                u.a_email,
                e.id AS employee_id,
                e.timezone,
                u.status,
                ol.name as location_name,
                ol.id as location_id,
                od.name as department_name,
                od.id as department_id,
                u.computer_name
            FROM employees AS e
            INNER JOIN users AS u ON u.id = e.user_id
            LEFT JOIN organization_locations ol ON e.location_id = ol.id
            LEFT JOIN organization_departments od ON od.id = e.department_id
            WHERE
                e.organization_id = ${organization_id} AND
                e.id IN (${employee_ids.toString()})
        `;

        return mySql.query(query);
    }

    getAttandanceIdsGroupped({ organization_id, employee_ids, start_date, end_date, location_id, department_ids, employee_role_id }) {
        const departmentIds = department_ids ? "'" + department_ids.split(",").join("','") + "'" : 0;
        let query1 = `
            SELECT
                GROUP_CONCAT(ea.id SEPARATOR ',') AS attendance_ids,
                e.id AS employee_id,
                u.first_name,
                u.last_name,
                e.timezone,
                e.department_id,
                od.name,
                e.location_id,
                ol.name location,
                e.emp_code,
                u.computer_name
            FROM
                employee_attendance AS ea
                JOIN employees AS e ON ea.employee_id = e.id
                JOIN users AS u ON u.id = e.user_id
                JOIN user_role AS ur ON u.id = ur.user_id
                JOIN organization_departments od ON e.department_id = od.id
                JOIN organization_locations ol ON e.location_id = ol.id
            WHERE
                ea.organization_id = ? AND`;

        if (employee_ids.length > 0) query1 += ` ea.employee_id IN(?) AND`;
        if (department_ids) query1 += ` e.department_id IN(${departmentIds}) AND`;
        if (location_id) query1 += ` e.location_id =${location_id} AND`;
        if (employee_role_id) query1 += ` ur.role_id =${employee_role_id} AND`;
        query1 += ` ea.date BETWEEN ? AND ?
                GROUP BY e.id`;

        const query = SqlString.format(query1,
            employee_ids.length > 0 ? [organization_id, employee_ids, start_date, end_date] : [organization_id, start_date, end_date]
        );
        return mySql.query(query)
    }

    getAttandanceIdsGroupped_new({ organization_id, employee_ids, start_date, end_date, location_id, department_ids, employee_role_id, skip, limit }) {
        const departmentIds = department_ids ? "'" + department_ids.split(",").join("','") + "'" : 0;
        let query1 = `
            SELECT
                GROUP_CONCAT(ea.id SEPARATOR ',') AS attendance_ids,
                e.id AS employee_id,
                u.first_name,
                u.last_name,
                e.timezone,
                e.department_id,
                od.name,
                e.location_id,
                ol.name location
            FROM
                employee_attendance AS ea
                JOIN employees AS e ON ea.employee_id = e.id
                JOIN users AS u ON u.id = e.user_id
                JOIN user_role AS ur ON u.id = ur.user_id
                JOIN organization_departments od ON e.department_id = od.id
                JOIN organization_locations ol ON e.location_id = ol.id
            WHERE
                ea.organization_id = ? AND`;

        if (employee_ids.length > 0) query1 += ` ea.employee_id IN(?) AND`;
        if (department_ids) query1 += ` e.department_id IN(${departmentIds}) AND`;
        if (location_id) query1 += ` e.location_id =${location_id} AND`;
        if (employee_role_id) query1 += ` ur.role_id =${employee_role_id} AND`;
        query1 += ` ea.date BETWEEN ? AND ?
                GROUP BY e.id`;
        if (skip && limit) query1 += ` LIMIT ${skip}, ${limit}`;
        const query = SqlString.format(query1,
            employee_ids.length > 0 ? [organization_id, employee_ids, start_date, end_date] : [organization_id, start_date, end_date]
        );
        return mySql.query(query)
    }

    async getApplicationsStatus(applicationIds, departmentIds) {
        try {
            const statusesRecords = await OrgDeptAppWebModel.find({
                application_id: { $in: applicationIds },
                department_id: null,
                type: 1,
            }).lean();
            const statuses = _.object(statusesRecords.map(item => [item.application_id, item.status]));
            const depStatusesRecords = await OrgDeptAppWebModel.find({
                application_id: { $in: applicationIds },
                department_id: { $in: departmentIds },
            }).lean();
            const depStatuses = {};
            for (const record of depStatusesRecords) {
                if (!(record.application_id in depStatuses)) {
                    depStatuses[record.application_id] = {};
                }
                depStatuses[record.application_id][record.department_id] = record.status;
            }
            const result = {};
            for (const applicationId of applicationIds) {
                if (applicationId in statuses) {
                    result[applicationId] = { '0': statuses[applicationId] };
                } else if (applicationId in depStatuses) {
                    result[applicationId] = depStatuses[applicationId];
                } else {
                    result[applicationId] = { '0': 0 };
                }
            }
            return Promise.resolve(result);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    getEmployeeAssignedToManager(manager_id, role_id) {
        let query = `
            SELECT employee_id
            FROM assigned_employees
            WHERE to_assigned_id=? 
        `;
        if(role_id) query += ` AND role_id=? `
        return mySql.query(query, [manager_id, role_id])
    }

    getAttandanceIdstest() {

        const query = `
            SELECT id AS attendance_id
            FROM employee_attendance
            WHERE
                organization_id = 143 AND
                date="2020-09-17"
        `;

        return mySql.query(query)
    }
    count(ids) {
        return EmpActivityModel.countDocuments({ attendance_id: { $in: ids }, "domain_id": "5ed4944ca9f9543b534521c8" });

    }
    disticts(ids) {
        return EmpActivityModel.find({ attendance_id: { $in: ids }, "domain_id": "5ed4944ca9f9543b534521c8" }, { attendance_id: 1 }).distinct('attendance_id')
    }
    employees(ids) {
        const query = `
            SELECT ea.id AS attendance_id,e.id,u.first_name,u.last_name,u.a_email
            FROM employee_attendance ea
            INNER JOIN employees e ON e.id=ea.employee_id
            INNER JOIN users u ON e.user_id=u.id
            WHERE
                ea.id IN (${ids})
        `;

        return mySql.query(query)
    }

    async getDateWiseApplicationUsed(attendanceIds, gdate, ldate) {

        const query = [
            {
                $match: {
                    attendance_id: { $in: attendanceIds },
                    application_id: { $ne: null },
                    domain_id: { $eq: null },
                    createdOn: { $gt: gdate, $lt: ldate }
                }
            },
            {
                $project: {
                    _id: '$application_id',
                    attendance_id: 1,
                    application_id: 1,
                    keystrokes: 1,
                    start_time: 1,
                    end_time: 1,
                    createdOn: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    title,
                }
            },
        ];
        return EmpActivityModel.aggregate(query);
    }

    async getAppWebData(employee_ids, sortOrder, sortcolumn, startdate, enddate, organization_id, limit, skip, request_option, searchname, location_ids, department_ids) {
        let start = Number(startdate)
        let end = Number(enddate)
        const match = {
            organization_id: organization_id,
            yyyymmdd: {
                $gte: start,
                $lte: end
            },
        };

        if (employee_ids && employee_ids.length > 0) {
            match.employee_id = { "$in": employee_ids };
        }
        if (location_ids && location_ids.length > 0) {
            match.location_id = { "$in": location_ids };
        }
        if (department_ids && department_ids.length > 0) {
            match.department_id = { "$in": department_ids };
        }
        let query = []
        query.push({ $match: match },)
        query.push({ $project: { applications: 1 } },)
        query.push({ $unwind: "$applications" },)

        if (request_option == 1) {
            query.push({ $match: { 'applications.application_type': 1 } },)
        }
        else if (request_option == 2) {
            query.push({ $match: { 'applications.application_type': 2 } },)
        }
        else {
            query.push({ $match: { 'applications.application_type': { $in: [1, 2] } } },)
        }
        query.push({ $project: { applications: { application_id: '$applications.application_id', total: '$applications.total' } } },)
        query.push({ $group: { _id: '$applications.application_id', duration: { $sum: '$applications.total' } } },)
        query.push({
            $match: {
                duration: { $gt: 20 }
            }
        })

        query.push({ $lookup: { from: 'organization_apps_webs', localField: '_id', foreignField: '_id', as: 'app' } },)
        query.push({ $unwind: "$app" },)
        if (!request_option) query.push({ $sort: { "app.type": 1 } })
        query.push({ $lookup: { from: 'organization_department_apps_webs', localField: '_id', foreignField: 'application_id', as: 'rule' } },)
        if (searchname) {
            query.push({ $match: { 'app.name': { $regex: searchname } } },)
        }
        if (sortOrder) {
            if (sortcolumn == "total_duration") query.push({ $sort: request_option ? { duration: sortOrder } : { "app.type": -1, duration: sortOrder } });
            if (sortcolumn == "status") query.push({ $sort: request_option ? { 'rule.status': sortOrder } : { "app.type": -1, 'rule.status': sortOrder } });
            if (sortcolumn == "type") query.push({ $sort: { 'app.type': sortOrder } });
        }
        query.push({ $project: { name: '$app.name', lowercasename: { $toLower: '$app.name' }, duration: 1, type: '$app.type', status: { $arrayElemAt: ["$rule.status", 0] } } },)
        if (sortcolumn == "name") {
            query.push({ $sort: request_option ? { lowercasename: sortOrder } : { type: sortOrder, lowercasename: sortOrder } });
        }
        if (skip) query.push({ $skip: skip });
        if (limit) query.push({ $limit: limit });
        const data = await EmpProductivityReportsModel.aggregate(query)
        return data;
    };

    async getAppWebDataCount(employee_ids, startdate, enddate, organization_id, request_option, searchname, location_ids, department_ids) {

        let start = Number(startdate)
        let end = Number(enddate)
        const match = {
            organization_id: organization_id,
            yyyymmdd: {
                $gte: start,
                $lte: end
            },
        };

        if (employee_ids && employee_ids.length > 0) {
            match.employee_id = { "$in": employee_ids };
        }
        if (location_ids && location_ids.length > 0) {
            match.location_id = { "$in": location_ids };
        }
        if (department_ids && department_ids.length > 0) {
            match.department_id = { "$in": department_ids };
        }
        let query = []
        query.push({ $match: match },)
        query.push({ $project: { applications: 1 } },)
        query.push({ $unwind: "$applications" },)

        if (request_option == 1) {
            query.push({ $match: { 'applications.application_type': 1 } },)
        }
        else if (request_option == 2) {
            query.push({ $match: { 'applications.application_type': 2 } },)
        }
        else {
            query.push({ $match: { 'applications.application_type': { $in: [1, 2] } } })
        }
        query.push({ $project: { applications: { application_id: '$applications.application_id', total: '$applications.total' } } },)
        query.push({ $group: { _id: '$applications.application_id', duration: { $sum: '$applications.total' }, } },)
        query.push({
            $match: {
                duration: { $gt: 20 }
            }
        })
        query.push({ $lookup: { from: 'organization_apps_webs', localField: '_id', foreignField: '_id', as: 'app' } },)
        query.push({ $unwind: "$app" },)
        if (searchname) {
            query.push({ $match: { 'app.name': { $regex: searchname } } },)
        }
        query.push({ $group: { _id: null, count: { $sum: 1 } } })
        const totalCount = await EmpProductivityReportsModel.aggregate(query)
        return totalCount;
    };

    async getDepartmentNames(dept_Ids, organization_id, searchValue) {
        let query = `
        SELECT id AS department_id,name
        FROM organization_departments        
        WHERE id IN (${dept_Ids}) AND organization_id=${organization_id} `;
        if (searchValue) {
            query += `AND name LIKE '%${searchValue}%'`;
        }
        return mySql.query(query)
    }

    async getDeptIdByName(name, organization_id) {
        let query = `
        SELECT id AS department_id,name
        FROM organization_departments        
        WHERE name LIKE '%${name}%' AND organization_id=${organization_id} `;
        return mySql.query(query)
    }

    async getDeptRulesDataCount(application_id, employee_ids, startdate, enddate, organization_id, location_ids, department_ids) {
        let start = Number(startdate)
        let end = Number(enddate)
        let match = {
            organization_id: organization_id,
            yyyymmdd: {
                $gte: start,
                $lte: end,
            },
        };
        if (employee_ids && employee_ids.length > 0) {
            match.employee_id = { "$in": employee_ids };
        }
        if (location_ids && location_ids.length > 0) {
            match.location_id = { "$in": location_ids };
        }
        if (department_ids && department_ids.length > 0) {
            match.department_id = { "$in": department_ids };
        }

        const totalCount = await EmpProductivityReportsModel.aggregate([
            { '$match': match },
            { '$project': { applications: 1, department_id: 1 } },
            { '$unwind': '$applications' },
            {
                '$match': { 'applications.application_id': new mongoose.Types.ObjectId(application_id) }
            },
            { '$group': { _id: '$department_id', dept_duration: { $sum: "$applications.total" } } },
            { '$match': { dept_duration: { $gte: 0 } } },
            { '$group': { _id: null, count: { $sum: 1 } } }
        ])
        return totalCount
    }

    async getDeptRulesData(application_id, employee_ids, startdate, enddate, organization_id, location_ids, department_ids, skip, limit) {
        let start = Number(startdate)
        let end = Number(enddate)
        let match = {
            organization_id: organization_id,
            yyyymmdd: {
                $gte: start,
                $lte: end,
            },
        };
        if (employee_ids && employee_ids.length > 0) {
            match.employee_id = { "$in": employee_ids };
        }
        if (location_ids && location_ids.length > 0) {
            match.location_id = { "$in": location_ids };
        }
        if (department_ids && department_ids.length > 0) {
            match.department_id = { "$in": department_ids };
        }
        const data = await EmpProductivityReportsModel.aggregate([
            { '$match': match },
            { '$project': { applications: 1, department_id: 1 } },
            { '$unwind': '$applications' },
            {
                '$match': { 'applications.application_id': new mongoose.Types.ObjectId(application_id) }
            },
            { '$group': { _id: '$department_id', dept_duration: { $sum: "$applications.total" } } },
            { '$match': { dept_duration: { $gte: 0 } } },

            { '$project': { duration: '$dept_duration' } },
            { $sort: { _id: -1 } },
            { '$limit': limit },
            { '$skip': skip }
        ])
        return data
    }

    async getAppWebCumulativeData({
        employee_ids, order, sortColumn, startdate, enddate, organization_id,
        limit, skip, type, searchname, location_ids, department_ids, isCount, employeeIdsPresentInSystem
    }) {
        let start = Number(startdate);
        let end = Number(enddate);
        //match pipeline
        const match = {
            organization_id: organization_id,
            yyyymmdd: {
                $gte: start,
                $lte: end
            }
        };
        // match condition for employee
        let employeeIdOrder = [];
        if (employee_ids && employee_ids.length > 0) {
            employee_ids = employee_ids.split(',').map(id => Number(id.trim()));
            employeeIdOrder = employeeIdsPresentInSystem.filter(val => employee_ids.includes(val));
        } else {
            employeeIdOrder = employeeIdsPresentInSystem;
        }
        match.employee_id = { $in: employeeIdOrder };

        // match condition for location
        if (location_ids && location_ids.length > 0) {
            match.location_id = { $in: location_ids.split(',').map(id => Number(id.trim())) };
        }
        // match condition for department
        if (department_ids && department_ids.length > 0) {
            match.department_id = { $in: department_ids.split(',').map(id => Number(id.trim())) };
        }

        let query = []

        // match pipeline push 
        query.push({ $match: match });
        // project pipeline push
        query.push({
            $project: {
                employee_id: 1, location_id: 1, department_id: 1, applications: 1
            }
        });

        // unwind pipeline push
        query.push({ $unwind: "$applications" });

        // application type match pipeline push
        if (type == 1) {
            query.push({ $match: { 'applications.application_type': 1 } });
        } else if (type == 2) {
            query.push({ $match: { 'applications.application_type': 2 } });
        } else {
            query.push({ $match: { 'applications.application_type': { $in: [1, 2] } } });
        }

        // group pipeline pushed
        query.push({
            $group: {
                _id: {
                    employee_id: "$employee_id",
                    application_id: "$applications.application_id",
                    application_type: "$applications.application_type",
                },
                productive: { $sum: "$applications.pro" },
                non_productive: { $sum: "$applications.non" },
                neutral: { $sum: "$applications.neu" },
                idle: { $sum: "$applications.idle" }
            }
        });

        // used to order the doc as per the employee_ids order
        query.push({ "$addFields": { "__order": { "$indexOfArray": [employeeIdOrder, "$_id.employee_id"] } } })

        //count query return from here
        if (isCount) {
            query.push({ $group: { _id: null, count: { $sum: 1 } } })
            const data = await EmpProductivityReportsModel.aggregate(query);
            return data;
        }

        // web app names lookup
        query.push({
            $lookup: {
                from: 'organization_apps_webs',
                localField: '_id.application_id',
                foreignField: '_id',
                as: 'app'
            }
        });
        query.push({ $unwind: "$app" });

        //search by app/web names
        if (searchname) {
            query.push({ $match: { 'app.name': { $regex: searchname } } });
        }

        //final project
        query.push({
            $project: {
                _id: 0,
                employee_id: "$_id.employee_id",
                application_id: "$_id.application_id",
                type: "$_id.application_type",
                name: '$app.name',
                productive: 1,
                non_productive: 1,
                neutral: 1,
                idle: 1,
                lowercasename: { $toLower: '$app.name' },
                __order: 1
            }
        });

        // sorting pipeline
        if (sortColumn == "name") {
            query.push({ $sort: type ? { lowercasename: order } : { type: order, lowercasename: order } });
        } else if (['productive', 'non_productive', 'neutral', 'idle'].some(ele => ele == sortColumn)) {
            const sortObj = {};
            sortObj[sortColumn] = order;
            query.push({ $sort: sortObj });
        } else {
            query.push({ $sort: { __order: 1 } });
        }

        // remove sorting temp field
        query.push({ $project: { lowercasename: 0, __order: 0 } });

        //skip and limit pipeline
        if (skip) query.push({ $skip: skip });
        if (limit) query.push({ $limit: limit });

        const data = await EmpProductivityReportsModel.aggregate(query);
        return data;
    };

    async getAppWebCumulativeDataDateWise({
        startdate, enddate, organization_id, type
    }) {
        let start = Number(startdate);
        let end = Number(enddate);
        //match pipeline
        const match = {
            organization_id: organization_id,
            yyyymmdd: {
                $gte: start,
                $lte: end
            }
        };

        let query = []

        // match pipeline push 
        query.push({ $match: match });
        // project pipeline push
        query.push({
            $project: {
                employee_id: 1, applications: 1, date: 1
            }
        });

        // unwind pipeline push
        query.push({ $unwind: "$applications" });

        // application type match pipeline push
        if (type == 1) {
            query.push({ $match: { 'applications.application_type': 1 } });
        } else if (type == 2) {
            query.push({ $match: { 'applications.application_type': 2 } });
        }

        // group pipeline pushed
        query.push({
            $group: {
                _id: {
                    employee_id: "$employee_id",
                    application_id: "$applications.application_id",
                    application_type: "$applications.application_type",
                    date: "$date"
                },
                productive: { $sum: "$applications.pro" },
                non_productive: { $sum: "$applications.non" },
                neutral: { $sum: "$applications.neu" },
                idle: { $sum: "$applications.idle" }
            }
        });

        // web app names lookup
        query.push({
            $lookup: {
                from: 'organization_apps_webs',
                localField: '_id.application_id',
                foreignField: '_id',
                as: 'app'
            }
        });
        query.push({ $unwind: "$app" });

        //final project
        query.push({
            $project: {
                _id: 0,
                employee_id: "$_id.employee_id",
                application_id: "$_id.application_id",
                type: "$_id.application_type",
                name: '$app.name',
                date: "$_id.date",
                productive: 1,
                non_productive: 1,
                neutral: 1,
                idle: 1,
                lowercasename: { $toLower: '$app.name' },
                __order: 1
            }
        });

        // remove sorting temp field
        query.push({ $project: { lowercasename: 0, __order: 0 } });

        const data = await EmpProductivityReportsModel.aggregate(query);
        return data;
    };

    /**
     * getActiveEmployeeIds - function to get the active employees
     * @param {*} organizationId 
     * @returns 
     */
    getActiveEmployeeIds(organizationId, sortColumn = '', sortOrder = '', employeeId = 0) {
        let queryValueArr = [organizationId];
        let order = 'DESC';
        let column = '';
        if (sortOrder.toUpperCase() != 'D') {
            order = `ASC`;
        }

        switch (sortColumn) {
            case 'firstname':
                column = `u.first_name`
                break;
            case 'email':
                column = `u.a_email`
                break;
            case 'location':
                column = `ol.name`
                break;
            case 'department':
                column = `od.name`
                break;
            default:
                column = `e.created_at`;
                order = `DESC`
                break;
        }
        let query = `
            SELECT 
                e.id
            FROM employees e
            INNER JOIN users u on u.id = e.user_id
            LEFT JOIN organization_locations ol ON e.location_id = ol.id
            LEFT JOIN organization_departments od ON od.id = e.department_id
            WHERE 
                e.organization_id = ?
        `;
        if (employeeId) {
            query += ` AND e.id = ?`;
            queryValueArr.push(employeeId);
        }
        query += ` ORDER BY ${column} ${order}`;
        return mySql.query(query, queryValueArr);
    }

    getAllActiveEmployeeIds(organizationId, sortColumn = '', sortOrder = '', employeeId = 0) {
        let queryValueArr = [organizationId];
        let order = 'DESC';
        let column = '';
        if (sortOrder.toUpperCase() != 'D') {
            order = `ASC`;
        }

        switch (sortColumn) {
            case 'firstname':
                column = `u.first_name`
                break;
            case 'email':
                column = `u.a_email`
                break;
            case 'location':
                column = `ol.name`
                break;
            case 'department':
                column = `od.name`
                break;
            default:
                column = `e.created_at`;
                order = `DESC`
                break;
        }
        let query = `
            SELECT 
                e.id
            FROM employees e
            INNER JOIN users u on u.id = e.user_id
            LEFT JOIN organization_locations ol ON e.location_id = ol.id
            LEFT JOIN organization_departments od ON od.id = e.department_id
            WHERE 
                e.organization_id = ?
        `;
        if (employeeId) {
            query += ` AND e.id = ?`;
            queryValueArr.push(employeeId);
        }
        query += ` AND u.status = "1" ORDER BY ${column} ${order}`;
        return mySql.query(query, queryValueArr);
    }

    
    getLoginActivityLogsData(condition) {
        return activityLogsSchema.aggregate([{ $match: condition }, { $sort: { createdDate: -1 } },]);
    }

    getEmployeeDetails(organization_id, employee_id) {
        let query = `
            SELECT e.id, od.name AS department_name, ol.name AS location_name, concat(u.first_name, " ", u.last_name) AS employeeName,
                e.system_type, IF(e.system_type = 0, null, u.email) AS email
                FROM employees e 
                JOIN organization_departments od ON od.id = e.department_id 
                JOIN organization_locations ol ON ol.id = e.location_id 
                JOIN users u ON u.id = e.user_id 
                WHERE e.organization_id = ${organization_id} and e.id in (${employee_id});
        `;
        return mySql.query(query);
    }

    getEmployeeByLocationAndDepartment(department_ids, location_ids, organization_id) {
        let query = `
            SELECT e.id 
            FROM employees e
            WHERE 
        `
        if(department_ids && !location_ids) query +=` e.department_id = ${department_ids}`
        if(!department_ids && location_ids) query +=` e.location_id = ${location_ids}`
        if(department_ids && location_ids) query += ` e.department_id = ${department_ids} AND e.location_id = ${location_ids}`
        return mySql.query(query);
    }

}

module.exports = new EmployeeReportsModel;


// 
//     od.name
// JOIN organization_departments od ON e.department_id = od.id
