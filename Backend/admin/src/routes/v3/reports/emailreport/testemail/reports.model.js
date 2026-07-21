const _ = require("underscore");

const mySql = require('../../../../../database/MySqlConnection').getInstance();
const EmpProductivitySchema = require('../../../../../models/employee_productivity.schema');
const activitySchema = require('../../../auth/services/activitylogs.schema');
const { EmployeeActivityModel: EmpActivityModel } = require('../../../../../models/employee_activities.schema');
const OrgDeptAppWebModel = require('../../../../../models/organizaton_department_apps_web.schema');
const OrgAppWebModel = require('../../../../../models/organization_apps_web.schema');
const { logger: Logger } = require('../../../../../logger/Logger');

class reportsModel {
    static getAttendanceUsingFilter({ orgId, depIds, empIds, startDate, endDate }) {
        let query = `
            SELECT
                e.id, ea.id as attendance_id,
                CONCAT(u.first_name, ' ' , u.last_name) AS name,
                u.a_email, e.timezone, e.emp_code, ea.date, ea.start_time, 
                ea.end_time,ol.name AS location_name,od.name AS department_name,
                e.department_id,u.computer_name, ea.details
            FROM employees e
                JOIN users u ON e.user_id = u.id
                JOIN organization_departments od ON e.department_id = od.id
                JOIN organization_locations ol ON e.location_id = ol.id
                JOIN employee_attendance ea ON e.id = ea.employee_id
            WHERE
                e.organization_id = ? AND ea.date BETWEEN ? AND ?
        `;
        const params = [orgId, startDate, endDate];

        if (empIds && empIds.length > 0) {
            query += ' AND e.id IN(?)';
            params.push(empIds);
        }

        if (depIds && depIds.length > 0) {
            params.push(depIds);
            query += ' AND e.department_id IN(?)';
        }

        query += ' ORDER BY ea.date DESC';
        if (process.env.ORGANIZATION_ID.split(',').includes(orgId.toString())) {
            query += ', e.emp_code ASC';
        }
        query += ';';

        return mySql.query(query, params);
    }

    static getAttendanceUsingTimeSlot({ orgId, empIds, depIds, loginStartDate, loginEndDate }) {

        let query = `
            SELECT
                e.id               
            FROM employees e
                JOIN users u ON e.user_id = u.id
                JOIN organization_departments od ON e.department_id = od.id
                JOIN organization_locations ol ON e.location_id = ol.id
                JOIN employee_attendance ea ON e.id = ea.employee_id
            `;
        query += ` WHERE e.organization_id = ${orgId} AND ea.start_time BETWEEN '${loginStartDate}' AND '${loginEndDate}'`

        if (empIds && empIds.length > 0) {
            query += ` AND e.id IN(${empIds})`;
        }

        if (depIds && depIds.length > 0) {
            query += ` AND e.department_id IN(${depIds})`;
        }
        query += ' ORDER BY ea.date DESC;';
        return mySql.query(query);
    }

    static async getAttendance(organization_id, start_date, end_date, column, order) {
        const params = [organization_id, start_date, end_date];
        let query = `
            SELECT
                e.id, ea.id as attendance_id, u.first_name, u.last_name, u.a_email as email, e.timezone,e.emp_code, e.department_id,
                od.name as department, ol.name as location ,DATE_FORMAT(ea.date,'%Y-%m-%d') as date, ea.details,
                ea.start_time,ea.end_time,(COUNT( e.id ) OVER()) AS total_count,
                TIMESTAMPDIFF(second,ea.start_time,ea.end_time) as total_time
            FROM employees e
                JOIN users u ON e.user_id = u.id
                JOIN organization_departments od ON e.department_id = od.id
                JOIN organization_locations ol ON e.location_id = ol.id
                JOIN employee_attendance ea ON e.id = ea.employee_id
            WHERE e.organization_id = ? AND ea.date BETWEEN ? AND ?`;

        if (column && order) {
            query += ` ORDER BY ?? ${order}`;
            params.push(column);
        }
        return mySql.query(query, params);
    }
    
    static async getEmployeeDetails(organization_id,empids) {
        const params = [organization_id, empids];
        let query = `
    SELECT
        e.id, u.first_name, u.last_name, u.a_email as email, e.timezone, e.department_id,
        od.name as department, ol.name as location 
    FROM employees e
        JOIN users u ON e.user_id = u.id
        JOIN organization_departments od ON e.department_id = od.id
        JOIN organization_locations ol ON e.location_id = ol.id
    WHERE e.organization_id = ? AND e.id IN (?)`;

    return mySql.query(query, params);
    }
    static getAttandanceIdsGroupped({ orgId, depIds, empIds, startDate, endDate }) {
        let query = `
            SELECT
                e.id,GROUP_CONCAT(ea.id SEPARATOR ',') AS attendance_ids,
                CONCAT(u.first_name, ' ' , u.last_name) AS name,u.a_email,
                u.first_name,u.last_name,e.emp_code, ea.details,
                e.timezone,
                e.department_id,
                od.name
            FROM
                employee_attendance AS ea
                JOIN employees AS e ON ea.employee_id = e.id
                JOIN users AS u ON u.id = e.user_id
                JOIN organization_departments od ON e.department_id = od.id
                JOIN organization_locations ol ON e.location_id = ol.id
            WHERE
                ea.organization_id = ? AND`;

        const params = [orgId, startDate, endDate];

        if (empIds && empIds.length > 0) {
            query += ' AND e.id IN(?)';
            params.push(empIds);
        }

        if (depIds && depIds.length > 0) {
            params.push(depIds);
            query += ' AND e.department_id IN(?)';
        }

        query += ' ORDER BY ea.date DESC';
        if (process.env.ORGANIZATION_ID.split(',').includes(orgId.toString())) {
            query += ', e.emp_code ASC';
        }
        query += ';';

        return mySql.query(query, params);
        // if (employee_ids.length > 0) query1 += ` ea.employee_id IN(?) AND`;

        // query1 += ` ea.date BETWEEN ? AND ?
        //         GROUP BY e.id
        //     `;
        // const query = SqlString.format(query1,
        //     employee_ids.length > 0 ? [organization_id, employee_ids, start_date, end_date] : [organization_id, start_date, end_date]
        // );
        // return mySql.query(query)
    }

    static getProductivity({ orgId, depIds, empIds, startDate, endDate }) {
        const match = {
            organization_id: orgId,
            date: { $gte: startDate, $lte: endDate }
        };

        if (empIds && empIds.length) {
            match.employee_id = { "$in": empIds };
        }

        if (depIds && depIds.length) {
            match.department_id = { "$in": depIds };
        }

        return EmpProductivitySchema.find(match)
            .select(
                'productive_duration non_productive_duration neutral_duration' +
                ' idle_duration break_duration employee_id date'
            )
            .lean();
    }

    static getProductivityOfEmp({ orgId, startDate, endDate, empIds, depIds }) {
        const match = {
            organization_id: orgId,
            date: {
                $gte: startDate,
                $lte: endDate
            },
        };

        if (empIds && empIds.length > 0) {
            match.employee_id = { "$in": empIds };
        }

        if (depIds && depIds.length > 0) {
            match.department_id = { "$in": depIds };
        }

        return EmpProductivitySchema.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$employee_id',
                    productive_duration: { $sum: '$productive_duration' },
                    non_productive_duration: { $sum: '$non_productive_duration' },
                    neutral_duration: { $sum: '$neutral_duration' },
                    idle_duration: { $sum: '$idle_duration' },
                    break_duration: { $sum: '$break_duration' },
                    computer_time: {
                        $sum: {
                            $add: ['$non_productive_duration', '$productive_duration', '$neutral_duration']
                        }
                    },
                    count: { $sum: 1 },
                    office_hours: {
                        $sum: {
                            $add: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$idle_duration', '$break_duration']
                        }
                    }
                },
            },
        ]);
    }

    static async GetProductivityforEmployee({ organization_id, empids, dates, start_date, end_date, productive_hours, column, order }) {
        const match = { organization_id };
        if (empids.length > 0) match.employee_id = { $in: empids };
        if (dates.length > 0) match.date = { $in: dates };
        if (start_date && end_date) match.yyyymmdd = {
            $gte: parseInt(start_date.split('-').join('')),
            $lte: parseInt(end_date.split('-').join(''))
        };

        let query = [{ $match: match },];

        query.push({
            $project: {
                productive_duration: 1,
                non_productive_duration: 1,
                neutral_duration: 1,
                idle_duration: 1,
                break_duration: 1,
                employee_id: 1,
                date: 1,
                computer_activities_time: { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration'] },
                office_time: { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration', '$offline_time'] },
                productivity: {
                    $multiply: [
                        {
                            $divide: [
                                '$productive_duration',
                                process.env.ORGANIZATION_ID.split(',').includes(organization_id.toString()) ? 30600
                                    : (productive_hours || { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration'] })
                            ]
                        }, 100]
                },
            }
        });

        if (column) query.push({ $sort: { [column]: order === 'DESC' ? -1 : 1 } },);

        return EmpProductivitySchema.aggregate(query);
    }

    static getEmployeesData({ orgId, empIds }) {
        let query = `
                    SELECT
                        e.id, CONCAT(u.first_name, ' ' , u.last_name) AS name, u.a_email, e.timezone,
                        e.department_id,od.name AS department,ol.name AS location,e.emp_code,u.computer_name
                    FROM employees e
                        INNER JOIN users u ON u.id=e.user_id
                        JOIN organization_departments od ON e.department_id = od.id
                        JOIN organization_locations ol ON e.location_id = ol.id
                    WHERE
                        e.organization_id IN (?)`;

        if (empIds && empIds.length > 0) query = query + ` AND e.id IN(${empIds})`;
        return mySql.query(query, [orgId]);
    }

    static async getApplicationsUsedStream(attendanceIds, callback) {
        try {
            const query = [
                {
                    attendance_id: { $in: attendanceIds },
                    application_id: { $ne: null },
                    domain_id: { $eq: null },
                },
                {
                    _id: 0,
                    application_id: '$application_id',
                    start_time: 1,
                    end_time: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    attendance_id: 1,
                },
            ];
            let total = 0;
            for await (const doc of EmpActivityModel.find(...query).lean()) {
                total++;
                await callback(doc);
            }
            return total;
        } catch (err) {
            Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
            return Promise.reject(err);
        }
    }
    static async getApplicationsUsed(attendanceIds) {
        try {
            const query = [
                {
                    attendance_id: { $in: attendanceIds },
                    application_id: { $ne: null },
                    domain_id: { $eq: null },
                },
                {
                    _id: 0,
                    application_id: '$application_id',
                    start_time: 1,
                    end_time: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    attendance_id: 1,
                },
            ];

            const appUsage = await EmpActivityModel
                .find(...query)
                // .sort({ start_time: -1 })
                // .populate({ path: 'organization_apps_webs', select: 'name' })
                .lean()

            return Promise.resolve(appUsage);
        } catch (err) {
            Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
            return Promise.reject(err);
        }
    }


    static async getBrowserHistory(attendanceIds) {
        try {
            const query = [
                {
                    attendance_id: { $in: attendanceIds },
                    domain_id: { $ne: null },
                },
                {
                    _id: 0,
                    application_id: '$application_id',
                    domain_id: '$domain_id',
                    start_time: 1,
                    end_time: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    attendance_id: 1,
                    url: 1,
                },
            ];
            const browserHistory = await EmpActivityModel
                .find(...query)
                // .sort({ start_time: -1 })
                .lean();
            return Promise.resolve(browserHistory);
        } catch (err) {
            Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
            return Promise.reject(err);
        }
    }

    static async getBrowserHistoryStream(attendanceIds, callback) {
        try {
            const query = [
                {
                    attendance_id: { $in: attendanceIds },
                    domain_id: { $ne: null },
                },
                {
                    _id: 0,
                    application_id: '$application_id',
                    domain_id: '$domain_id',
                    start_time: 1,
                    end_time: 1,
                    total_duration: 1,
                    active_seconds: 1,
                    attendance_id: 1,
                    url: 1,
                },
            ];
            let total = 0;
            for await (const doc of EmpActivityModel.find(...query).lean()) {
                total++;
                await callback(doc);
            }
            return total;
        } catch (err) {
            Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
            return Promise.reject(err);
        }
    }

    static topWebApps(organization_id, start_date, end_date, type, department_ids, employee_ids) {
        let match = {
            organization_id: organization_id,
            date: {
                $gte: start_date,
                $lte: end_date
            }
        };

        if (department_ids && department_ids.length) {
            match = { department_id: { $in: department_ids }, ...match }
        }
        if (employee_ids && employee_ids.length) {
            match = { employee_id: { $in: employee_ids }, ...match }
        }

        const query = [
            { $match: match },
            { $project: { applications: 1 } },
            { $unwind: "$applications" },
            { $match: { 'applications.application_type': type } },
            { $project: { applications: { application_id: '$applications.application_id', total: '$applications.total' } } },
            { $group: { _id: '$applications.application_id', duration: { $sum: '$applications.total' } } },
            { $sort: { duration: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'organization_apps_webs', localField: '_id', foreignField: '_id', as: 'app' } },
            { $unwind: "$app" },
            { $project: { name: '$app.name', duration: 1 } },
        ]

        return EmpProductivitySchema.aggregate(query);
    }

    static orgStats(organization_id, start_date, end_date, department_ids, employee_ids) {
        let match = {
            organization_id: organization_id,
            date: {
                $gte: start_date,
                $lte: end_date
            }
        }

        if (department_ids && department_ids.length > 0) {
            match = { department_id: { $in: department_ids }, ...match }
        }
        if (employee_ids && employee_ids.length > 0) {
            match = { employee_id: { $in: employee_ids }, ...match }
        }

        return EmpProductivitySchema.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: '$organization_id',
                    productive_duration: { $sum: '$productive_duration' },
                    non_productive_duration: { $sum: '$non_productive_duration' },
                    neutral_duration: { $sum: '$neutral_duration' },
                    idle_duration: { $sum: '$idle_duration' },
                    break_duration: { $sum: '$break_duration' },
                    count: { $sum: 1 }
                },
            },
        ]);
    }

    static employeePresentRate(organization_id, start_date, end_date, employee_ids, department_ids) {
        let query = `SELECT COUNT(id) AS total_count,
                    	(SELECT COUNT(id) 
                         from employee_attendance ea
                         WHERE ea.organization_id=${organization_id} AND ea.date BETWEEN "${start_date}" AND "${end_date}"
                        ) AS present_count
                    FROM employees 
                    WHERE organization_id=${organization_id}`;

        if (employee_ids && employee_ids.length) {
            query = `SELECT COUNT(id) AS total_count,
                    	(SELECT COUNT(id) 
                         from employee_attendance ea
                         WHERE ea.organization_id=${organization_id} AND ea.employee_id IN(${employee_ids}) AND ea.date BETWEEN "${start_date}" AND "${end_date}"
                        ) AS present_count
                    FROM employees 
                    WHERE organization_id=${organization_id} AND id IN(${employee_ids})`;
        }

        if (department_ids && department_ids.length) {
            query = `SELECT COUNT(id) AS total_count,
                    	(SELECT COUNT(e.id) 
                         from employee_attendance ea
                         INNER JOIN employees e ON e.id=ea.employee_id
                         WHERE ea.organization_id=${organization_id} AND e.department_id IN(${department_ids}) AND ea.date BETWEEN "${start_date}" AND "${end_date}"
                        ) AS present_count
                    FROM employees
                    WHERE organization_id=${organization_id} AND department_id IN(${department_ids})`
        }

        return mySql.query(query);
    }

    static async getApplicationsStatus(applicationIds, departmentIds) {
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
            Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
            return Promise.reject(err);
        }
    }

    static async consolatedAppWebUsed({ orgId, startDate, endDate, type, depIds, empIds, filterType }) {
        const match = {
            organization_id: orgId,
            date: {
                $gte: startDate,
                $lte: endDate
            },
        };

        let group = {
            _id: { application_id: "$applications.application_id" },
            duration: { $sum: '$applications.total' },
        };
        if (empIds && empIds.length > 0 && filterType === 2) {
            match.employee_id = { "$in": empIds };
            group = {
                _id: { application_id: "$applications.application_id", employee_id: '$employee_id' },
                duration: { $sum: '$applications.total' },
            }
            if (depIds.length) group._id['department_id'] = '$department_id';
        }

        if ((depIds && depIds.length > 0 && (filterType === 3 || filterType === 1))) {
            match.department_id = { "$in": depIds };
            group = {
                _id: { application_id: "$applications.application_id", department_id: '$department_id' },
                duration: { $sum: '$applications.total' },
            }
        }

        let data = await EmpProductivitySchema.aggregate([
            { $match: match },
            { $project: { applications: 1, employee_id: 1, department_id: 1 } },
            { $unwind: "$applications" },
            { $match: { 'applications.application_type': type } },
            { $project: { applications: { application_id: '$applications.application_id', total: '$applications.total' }, employee_id: 1, department_id: 1 } },
            { $group: group },
            { $project: { _id: '$_id.application_id', department_id: '$_id.department_id', employee_id: '$_id.employee_id', duration: 1 } },
            { $sort: { employee_id: -1, department_id: -1, duration: -1 } },
            { $lookup: { from: 'organization_apps_webs', localField: '_id', foreignField: '_id', as: 'app' } },
            { $unwind: "$app" },
            { $project: { name: '$app.name', duration: 1, department_id: 1, employee_id: 1 } }
        ]);
        if (data.length === 0) return [];
        if (empIds && empIds.length > 0 && filterType === 2) {
            const eIds = _.unique(_.pluck(data, 'employee_id').filter(x => x));
            const employeeData = await this.getEmployeesData({ orgId, empIds: eIds });
            const deptData = await this.getDepartments({ orgId, dIds: depIds });
            data = data.map(x => {
                const emp = employeeData.find(e => e.id == x.employee_id);
                if (emp) {
                    x.emp_name = emp.name;
                    x.a_email = emp.a_email;
                    x.department = emp.department;
                    x.location = emp.location;
                    x.computer_name = emp.computer_name;
                } else {
                    x.emp_name = '';
                    x.a_email = '';
                }
                const dept = deptData.find(d => d.id == x.department_id);
                dept ? x.department = dept.department : x.department = '';
                return x;
            });
        }
        if (depIds && depIds.length > 0 && (filterType === 3 || filterType === 1)) {
            const dIds = _.unique(_.pluck(data, 'department_id').filter(x => x));
            const deptData = await this.getDepartments({ orgId, dIds });
            data = data.map(x => {
                const dept = deptData.find(d => d.id == x.department_id);
                dept ? x.department = dept.department : x.department = '';
                return x;
            });
        }
        return data;
        // return EmpProductivitySchema.aggregate([
        //     { $match: match },
        //     { $project: { applications: 1 } },
        //     { $unwind: "$applications" },
        //     { $match: { 'applications.application_type': type } },
        //     { $project: { applications: { application_id: '$applications.application_id', total: '$applications.total' } } },
        //     { $group: { _id: '$applications.application_id', duration: { $sum: '$applications.total' }, } },
        //     { $sort: { duration: -1 } },
        //     { $lookup: { from: 'organization_apps_webs', localField: '_id', foreignField: '_id', as: 'app' } },
        //     { $unwind: "$app" },
        //     { $project: { name: '$app.name', duration: 1 } },
        // ]);
    }
    /**
     * getResellerDetails - function to get the reseller data
     * @memberof reportsModel
     * @param number organisation_id
     * @return object | null
     */
    static async getResellerDetails(organisation_id) {
        let query = `
            SELECT 
                re.logo,re.details, reo.id as reseller_organization_id
            FROM  
                organizations o 
                LEFT JOIN reseller re ON re.id= o.reseller_id
                JOIN organizations reo ON reo.user_id = re.user_id
            WHERE  o.id = ?
        `;

        const params = [organisation_id];
        return mySql.query(query, params);
    }

    static async isReseller(organisation_id) {
        let query = `
            SELECT 
                re.logo,re.details
                FROM  
                    organizations o 
                    JOIN users u ON u.id = o.user_id
                    JOIN reseller re ON re.user_id= u.id
                WHERE  o.id = ?;
        `;

        const params = [organisation_id];
        return mySql.query(query, params);
    }

    static getOrganizationSettings(orgId) {
        const query = `SELECT organization_id,rules FROM organization_settings WHERE organization_id=?`;
        return mySql.query(query, [orgId]);
    }

    static getDepartments({ orgId, dIds }) {
        return mySql.query(`SELECT id,name as department FROM organization_departments WHERE organization_id=${orgId} AND id IN(${dIds})`);
    }

    static getAssignedEmployees(employee_id, organization_id, depIds) {
        let query = `
            SELECT e.id 
            FROM employees e
            JOIN assigned_employees ae ON ae.employee_id = e.id
            WHERE ae.to_assigned_id = ${employee_id} AND e.organization_id = ${organization_id} 
        `;
        if(depIds?.length) query += ` AND e.department_id IN (${depIds})`; 
        return mySql.query(query);
    }

    static getAllAssignedDepartments(organization_id, empIds) {
        let query = `
        SELECT e.department_id as department_id
        FROM employees e
        WHERE e.organization_id = ${organization_id}
        `
        if (empIds.length) query += ` AND e.id IN (${empIds})`
        return mySql.query(query);
    }

    static getAttendanceCount(organization_id, start_date, end_date, employee_ids, department_ids) {
        let query = `
            SELECT count(ea.id) AS count
                FROM employees e
                JOIN employee_attendance ea ON ea.employee_id = e.id
                WHERE e.organization_id = ${organization_id}
            AND (ea.date BETWEEN '${start_date}' AND '${end_date}')
        `;
        if(employee_ids.length) query += ` AND e.id IN (${employee_ids})`
        if(department_ids.length) query += ` AND e.department_id IN (${department_ids})`
        return mySql.query(query);
    }

    static async GetLogsforEmployee({ organization_id:organization, start_date, end_date, column, order }) {
      
        const match = { organization };
      
        if (start_date && end_date) match.createdAt = {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
        };

        let query = [{ $match: match },];

        query.push({
            $project: {
                employeeId: 1,
                organization:1,
                type: 1,
                logIn: 1,
                logOut: 1,
               
            }
        });
       
        return await activitySchema.aggregate(query)
    }

    static getAllDepartments(orgId) {
        let query = `
            SELECT d.id 
            FROM organization_departments d
            WHERE d.organization_id = ${orgId}
        `;
        return mySql.query(query);
    }

    static getEmployeeByLocationId(location_id, organization_id) {
        let query = `
            SELECT e.id
            FROM employees e
            WHERE e.location_id IN (${location_id}) AND e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }

    static getEmployeeByShift(shift_ids, organization_id, employee_id) {
        let query = `
            SELECT e.id
            FROM employees e
            WHERE e.shift_id IN (${shift_ids}) AND e.organization_id = ${organization_id}
        `;
        if(employee_id) {
            query = `
                SELECT e.id
                	FROM employees e
                    JOIN assigned_employees ae ON ae.employee_id = e.id
                    WHERE e.shift_id IN (${shift_ids}) AND e.organization_id = ${organization_id} AND ae.to_assigned_id = ${employee_id};
            `;
        }
        return mySql.query(query);
    }

}

module.exports.reportsModel = reportsModel;

(async () => {
    console.log('------------------------')
    const empIds = [];
    const depIds = [];
    const match = {
        organization_id: 143,
        yyyymmdd: {
            $gte: 20200901,
            $lte: 20200930
        },
    };

    if (empIds && empIds.length > 0) {
        match.employee_id = { "$in": empIds };
    }

    if (depIds && depIds.length > 0) {
        match.department_id = { "$in": depIds };
    }

    const appData = await EmpProductivitySchema.aggregate([
        { $match: match },
        { $project: { applications: 1 } },
        { $unwind: "$applications" },
        { $match: { 'applications.application_type': 2 } },
        { $project: { applications: { application_id: '$applications.application_id', total: '$applications.total' } } },
        { $group: { _id: '$applications.application_id', duration: { $sum: '$applications.total' } } },
        { $sort: { duration: -1 } },
        // { $limit: 10 },
        { $lookup: { from: 'organization_apps_webs', localField: '_id', foreignField: '_id', as: 'app' } },
        { $unwind: "$app" },
        { $project: { name: '$app.name', duration: 1 } },
    ]);
    console.log('-------------', appData);

});