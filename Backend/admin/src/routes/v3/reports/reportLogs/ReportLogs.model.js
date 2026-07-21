const _ = require('underscore');
const mySql = require('../../../../database/MySqlConnection').getInstance();
const { EmployeeActivityModel: EmpActivityModel } = require('../../../../models/employee_activities.schema');
const EmpKeyStrokesModel = require('../../../../models/employee_keystrokes.schema');
const OrgDeptAppWebModel = require('../../../../models/organizaton_department_apps_web.schema');
const OrgAppWebModel = require('../../../../models/organization_apps_web.schema');
const SqlString = require('sqlstring');
const EmpProductivityReportsModel = require('../../../../models/employee_productivity.schema');
const mongoose = require('mongoose');

class ReportLogsModel {
    getEmployeeAssignedToManager(manager_id, role_id) {
        const query = `
            SELECT employee_id
            FROM assigned_employees
            WHERE to_assigned_id=? AND role_id=?
        `;

        return mySql.query(query, [manager_id, role_id])
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

        const query = SqlString.format(query1,
            employee_ids.length > 0 ? [organization_id, employee_ids, start_date, end_date] : [organization_id, start_date, end_date]
        );
        return mySql.query(query)
    }


    async getApplicationUsed(attendanceIds) {
        console.log('------requested11111111111111----------');
        console.log('------requested11111111111111----------');
        console.log('------requested11111111111111----------');
        console.log('------requested11111111111111----------');
        console.log('------requested11111111111111----------');
        const attenadnceIdsChunks = _.chunk(attendanceIds, 100);
        const map = attenadnceIdsChunks.map((attIds) => this.getApplicationUsedHist(attIds));
        const appsData = await Promise.all(map);
        console.log('------requested2222222222222222222----------');
        console.log('------requested2222222222222222222----------');
        console.log('------requested2222222222222222222----------');
        console.log('------requested2222222222222222222----------');
        console.log('------requested2222222222222222222----------');
        console.log('------requested2222222222222222222----------');
        let finalData = [];
        appsData.map(item => finalData.push(...item));
        console.log('------requested333333333333333333----------');
        console.log('------requested333333333333333333----------');
        console.log('------requested333333333333333333----------');
        console.log('------requested333333333333333333----------');
        console.log('------requested333333333333333333----------');
        console.log('------requested333333333333333333----------');
        return finalData;
    }
    getApplicationUsedHist(attendanceIds) {
        const query = [
            {
                $match: {
                    attendance_id: { $in: attendanceIds },
                    application_id: { $ne: null },
                    domain_id: { $eq: null },
                }
            },
            { $sort: { start_time: -1, attendance_id: -1 } },
            {
                $project: {
                    _id: '$application_id',
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
    async getBrowserHistory(attendanceIds) {
        const attenadnceIdsChunks = _.chunk(attendanceIds, 100);
        const map = attenadnceIdsChunks.map((attIds) => this.getBrowserHistoryData(attIds));
        const browersData = await Promise.all(map);
        let finalData = [];
        browersData.map(item => finalData.push(...item));
        return finalData;
    }
    getBrowserHistoryData(attendanceIds) {
        const query = [
            {
                $match: {
                    attendance_id: { $in: attendanceIds },
                    domain_id: { '$ne': null },
                }
            },
            { $sort: { start_time: -1, attendance_id: -1 } },
            {
                $project: {
                    _id: '$domain_id',
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
}

module.exports = new ReportLogsModel;