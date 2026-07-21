const mySql = require("../../../database/MySqlConnection").getInstance();
const mongoose = require("mongoose");
const EmpProductivityModel = require("../models/employee_productivity.schema");
const ExternalTeleWorksModel = require("../models/externalTeleWorks.schema");
const ActtivityModel = require("../models/activity_request.schema");
const _ = require("underscore");

const  { TaskSchemaModel } = require('../models/silah_db.schema');


const Organization_App_Web = require("../models/organization_apps_web.schema");
const OrgDeptAppWebModel = require("../models/organizaton_department_apps_web.schema");
const { EmployeeActivityModel: EmployeeActivities } = require("../models/employee_activities.schema");

const ActivityRequestModel = require("../models/activity_request.schema");

const moment = require('moment');

function formatDateString(input) {
    const momentDate = moment(input);
    return momentDate.utc().format('YYYY-MM-DD HH:mm:ss');
}

class Model {
    getOrganizationData() {
        let query = `
            SELECT et.id, et.organization_id, et.spToken, et.labourOfficeId, et.sequenceNumber, o.timezone
            FROM external_teleworks et
            JOIN organizations o ON o.id = et.organization_id;
        `;
        return mySql.query(query);
    }

    getOrganizationSettings(orgId) {
        const query = `SELECT organization_id,rules FROM organization_settings WHERE organization_id=?`;
        return mySql.query(query, [orgId]);
    }

    getOrgEmployees({ organization_id }) {
        let query = `SELECT 
            e.emp_code AS emp_code, 
            e.id AS emp_id, 
            u.id AS user_id, 
            u.first_name AS first_name, 
            u.last_name AS last_name,
            u.email AS email
            FROM users u
            JOIN employees e ON e.user_id = u.id
            WHERE e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }
    
    findAttendanceByDate({ date, employeeIds }) {
        let query = `
            SELECT a.id as attendance, a.employee_id
            FROM employee_attendance a 
            WHERE a.employee_id IN (${employeeIds}) AND a.date = "${date}"
        `;
        return mySql.query(query);
    }

    async GetProductivity({
        organization_id, empids, dates,
        skip, limit, column, order, productive_hours
    }) {
        const match = { organization_id };
        if (empids.length > 0) match.employee_id = { $in: empids };
        if (dates) match.date = dates;
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
        if (skip) query.push({ $skip: skip },);
        if (limit) query.push({ $limit: limit },);

        return EmpProductivityModel.aggregate(query);
    }

    getEmployeeAttendanceTimeClaim({organization_id, empids, dates,}) {
        return ActtivityModel.find({organization_id: organization_id, employee_id: { $in : empids }, date: dates, type: 3, status: 1});
    }

    getEmployeeTask({ date, employeeIds }) {
        let query = `SELECT * FROM project_tasks
            WHERE employee_id IN (${employeeIds})
            AND DATE('${date}') BETWEEN start_date  AND end_date
        `;
        return mySql.query(query);
    }

    insertTeleWorksData(props) {
        return ExternalTeleWorksModel.insertMany([props]);
    }

    checkifTeleWorksData(props) {
        return ExternalTeleWorksModel.find(props);
    }

    checkifTeleWorksDataNew(props) {
        return ExternalTeleWorksModel.findOne(props);
    }

    findAndUpdateTeleWorksData(_id, employeesDetails, api_response_message,) {
        let data = { api_response_message, employeesDetails };
        return ExternalTeleWorksModel.updateOne({ _id: _id }, data, { upsert: true });
    }

    findAndUpdateTeleWorksDataInsert(_id, employeesDetails, api_response_message, successEmployeeIds) {
        let data = { api_response_message, $push: { employeesDetails: { $each: employeesDetails }, successEmployeeIds: { $each: successEmployeeIds } } };
        return ExternalTeleWorksModel.updateOne({ _id: _id }, data, { upsert: true });
    }

    getEmployee({ organization_id }) {
        let query = `SELECT 
            e.emp_code AS emp_code, 
            e.id AS emp_id, 
            u.id AS user_id, 
            u.first_name AS first_name, 
            u.last_name AS last_name,
            u.email AS email,
            e.shift_id,
            os.data as shift_detail,
            e.timezone
            FROM users u
            JOIN employees e ON e.user_id = u.id
            JOIN organization_shifts os ON os.id = e.shift_id
            WHERE e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }
    fetchManager(emp_id) {
        let query = `SELECT u.email as email,e.emp_code
            FROM employees e
            JOIN users u ON u.id = e.user_id
            JOIN assigned_employees ae ON ae.to_assigned_id = e.id
            WHERE ae.employee_id = ${emp_id}
        `;
        return mySql.query(query);
    }
    async insertData({ type, organization_id, date, employeesDetails, api_response, employee_id }) {
        employeesDetails = employeesDetails.map(i => {
            i.api_response = api_response;
            i.type = type;
            return i;
        })

        let ifExist = await this.checkifTeleWorksDataNew({ organization_id, date });
        let idsNumber = _.pluck(employeesDetails, "IdNumber");
        if (ifExist) {
            let data = ifExist.employeesDetails.filter(i => {
                if(!idsNumber.includes(i.IdNumber)) return true;
            })
            ifExist.employeesDetails = data;
            await ExternalTeleWorksModel.updateMany({_id: new mongoose.Types.ObjectId(ifExist._id)}, { $set: {employeesDetails: ifExist.employeesDetails}});
        }
        if (!ifExist) {
            if (type === 'success') {
                let data = { organization_id, date, employeesDetails, successEmployeeIds: employee_id };
                return ExternalTeleWorksModel.insertMany([data]);
            } else {
                let data = { organization_id, date, employeesDetails, employee_id };
                return ExternalTeleWorksModel.insertMany([data]);
            }
        }
        else {
            if (type === 'success') {
                let successEmployeeIds = employee_id;
                let data = { $push: { employeesDetails: { $each: employeesDetails }, successEmployeeIds: { $each: successEmployeeIds } } };
                return ExternalTeleWorksModel.findOneAndUpdate({_id: ifExist._id}, data);
            } else {
                let data = { $push: { employeesDetails: { $each: employeesDetails } } };
                return ExternalTeleWorksModel.findOneAndUpdate({_id: ifExist._id}, data);
            }
        }
    }

    async getTeleworksOrganization(organization_id) {
        let query = `
            SELECT o.id, u.first_name, u.last_name, et.spToken, et.labourOfficeId, et.sequenceNumber, r.id as reseller_id 
            FROM organizations o 
            JOIN users u ON u.id = o.user_id 
            JOIN reseller r ON r.user_id = u.id 
            JOIN external_teleworks et ON et.organization_id = o.id
            WHERE o.id IN (${organization_id})
        `;
        return mySql.query(query);
    }

    async findOrganizationUnderTeleWorks({reseller_id}) {
        let query = `
            SELECT o.id as organization_id, u.first_name, u.last_name, o.reseller_id_client, o.reseller_number_client, o.timezone, u.email
            FROM organizations o 
            JOIN users u ON u.id = o.user_id 
            WHERE o.reseller_id = ${reseller_id};
        `;
        return mySql.query(query);
    }

    
    async getActiveTasks () {
        return TaskSchemaModel.find({ status: 1 });
    }

    async getEmployeeDetails(employee_ids) {
        let query = `
            SELECT e.id, e.timezone, u.email, u.first_name, u.last_name
            FROM employees e
            JOIN users u ON u.id = e.user_id
            WHERE e.id IN (${employee_ids})
        `;
        return mySql.query(query);
    }

    async getEmployeeAttendanceReport(_id) {
        return EmpProductivityModel.findOne({ _id })
    }

    async getEmployeeAttendanceSilah(date, employee_id) {
        let query = `
            SELECT ea.id, ea.date
            FROM employee_attendance ea
            WHERE ea.employee_id = ${employee_id} AND ea.date="${date}"
        `;
        return mySql.query(query);
    }

    async updateEmployeeAttendanceSilah(attendance_id, end_date ) {
        let query = `
            UPDATE employee_attendance ea
            SET ea.end_time = "${end_date}" WHERE ea.id = ${attendance_id}
        `;
        return mySql.query(query);
    }

    

    getStorageDetails(organization_id) {
        let query = `
            SELECT
                op.provider_id AS storage_type_id ,p.name,p.short_code ,opc.id AS storage_data_id,opc.creds,op.status
                FROM organization_providers op 
                INNER JOIN providers p ON p.id=op.provider_id
                INNER JOIN organization_provider_credentials opc ON opc.org_provider_id =op.id
                WHERE op.organization_id=? AND opc.status=1
        `;
        return mySql.query(query, [organization_id]);
    }

    getAllEmployees(organization_id) {
        let query = `
            SELECT e.id, u.id as user_id, u.email, u.a_email, u.first_name, u.last_name, e.timezone, e.department_id, e.location_id
                FROM employees e
                JOIN users u ON u.id = e.user_id
                WHERE e.organization_id = ?
        `;
        return mySql.query(query, [organization_id]);
    }

    addEmployeeAttendance(employee_id, organization_id, start_time, end_time, date, is_manual_attendance) {
        let query = `
            INSERT INTO employee_attendance (employee_id, organization_id, start_time, end_time, date, is_manual_attendance)
            VALUES (?,?,?,?,?,?)
        `;
        return mySql.query(query, [employee_id, organization_id, start_time, end_time, date, is_manual_attendance]);
    }

    createTeamsOfflineMeetApplication(data) {
        return new Organization_App_Web(data).save();
    }

    checkApplicationByName(name, organization_id) {
        return Organization_App_Web.findOne({ organization_id, name: name });
    }

    addEmployeeActivity(data) {
        return new EmployeeActivities(data).save();
    }
    
    async findApplicationProductivityStatus(application_id, department_id) {
        let orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id, department_id: null }).lean();

        if (!orgDeptAppWeb) {
            orgDeptAppWeb = await new OrgDeptAppWebModel({ application_id, type: 1, status: 0, }).save((err, data) => { });
        }
        if (orgDeptAppWeb && orgDeptAppWeb.type === 1) {
            return Promise.resolve(orgDeptAppWeb);
        } else {
            orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id, department_id });
            if (!orgDeptAppWeb) {
                return Promise.resolve({ status: 0, pre_request: 0 });
            }
            return Promise.resolve(orgDeptAppWeb);
        }
    }


    createEmployeeProductivityReport({ application_id, organization_id, employee_id, productive_duration, non_productive_duration, neutral_duration, department_id, location_id, date, durationSecond }) {
        return new EmpProductivityModel({
            logged_duration: durationSecond,
            total_duration: durationSecond,
            risk_percentage: 0,
            offline_time: 0,
            employee_id,
            department_id,
            location_id,
            organization_id,
            productive_duration: productive_duration,
            non_productive_duration: non_productive_duration,
            neutral_duration: neutral_duration,
            idle_duration: 0,
            break_duration: 0,
            year: date.split('-')[0],
            month: date.split('-')[1],
            day: date.split('-')[2],
            yyyymmdd: date.split('-').join(''),
            date: date,
            applications: [
                {
                    "pro": productive_duration,
                    "non": non_productive_duration,
                    "neu": neutral_duration,
                    "idle": 0,
                    "total": durationSecond,
                    "application_type": 1,
                    "tasks": [
                        {
                            "pro": durationSecond,
                            "non": 0,
                            "neu": 0,
                            "idle": 0,
                            "total": durationSecond,
                            "task_id": 0
                        }
                    ],
                    "application_id": application_id
                }
            ]
        }).save();
    }
    
    getEmployeeAttendance (employee_id, organization_id, date) {
        let query = `
            SELECT start_time, end_time, id
            FROM employee_attendance
            WHERE employee_id=? AND organization_id=? AND DATE(date)=?
        `;
        return mySql.query(query, [employee_id, organization_id, date]);
    }
    
    updateEmployeeAttendance(employee_id, organization_id, start_date, end_date, id) {
        let query = `UPDATE employee_attendance SET `;
        let params = [];
        
        if (start_date !== undefined && start_date !== null) {
            query += `start_time = ?, `;
            params.push(formatDateString(start_date));
        }
    
        if (end_date !== undefined && end_date !== null) {
            query += `end_time = ?, `;
            params.push(formatDateString(end_date));
        }
    
        query = query.replace(/,\s*$/, '');
    
        query += ` WHERE employee_id = ? AND organization_id = ? AND DATE(date) = ? AND id = ?`;
        params.push(employee_id, organization_id, new Date().toISOString().split('T')[0], id);
    
        return mySql.query(query, params);
    }
    
    getEmployeeProductivityReport(employee_id, organization_id, date) {
        return EmpProductivityModel.findOne({ organization_id: organization_id, employee_id: employee_id, yyyymmdd: +date.split('-').join("")});
    }

    getAttendanceId({ date, employeeId, organizationId }) {
        const query = `
                    SELECT ea.id,e.timezone,e.department_id 
                    FROM employee_attendance ea
                    INNER JOIN employees e on e.id = ea.employee_id
                    WHERE ea.date = ? AND ea.employee_id = ? AND ea.organization_id = ?
                    `;

        return mySql.query(query, [date, employeeId, organizationId])
    }

    getEmployeeActivities({ attendanceId }) {
        let match = { attendance_id: attendanceId };

        return EmployeeActivities.aggregate([
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

    getAttendanceTimeClaimRequest (start_date, end_date, employee_id, organization_id) {
        return ActivityRequestModel.aggregate([
            {
                $match: {
                    "start_time": { $gte: new Date(start_date), $lte: new Date(end_date) },
                    "end_time": { $gte: new Date(start_date), $lte: new Date(end_date) },
                    "employee_id": +employee_id,
                    "organization_id": organization_id,
                    "status": 1,
                    "type": 3
                }
            },
            {
                "$project": {
                    start_time: 1,
                    end_time: 1,
                    _id: 0
                }
            }
        ])
    }


    getTimeClaimRequestTimesheet({ organization_id, employee_id, date, attendanceId, status = [1], type }) {
        return ActivityRequestModel.aggregate([
            {
                $match: {
                    organization_id,
                    employee_id,
                    status: { $in: status },
                    attendance_id: attendanceId,
                    date: date,
                    type
                }
            },
            {
                $project: { _id: 0, start_time: 1, end_time: 1 }
            }
        ]);
    }

    getIdleTimeClaimRequestTimesheet({ organization_id, employee_id, date, attendanceId, status = [1], type }) {
        return ActivityRequestModel.aggregate([
            {
                $match: {
                    organization_id,
                    employee_id,
                    status: { $in: status },
                    attendance_id: attendanceId,
                    date: date,
                    type
                }
            },
            {
                $lookup: {
                    from: "employee_activities",
                    localField: "activities.activity_id",
                    foreignField: "_id",
                    as: "result"
                }
            },
            {
                $project: { _id: 0, "result.idleData": 1 }
            }
        ]);
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

}

module.exports = new Model