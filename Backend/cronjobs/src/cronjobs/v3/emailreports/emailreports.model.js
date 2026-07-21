const mySql = require('../../../database/MySqlConnection').getInstance();

const EmpProductivityReportModel = require("../models/employee_productivity.schema");
const activitySchema = require('../models/activityLogs.Schema')

class emailReportsModel {
    static async getReports(frequency, date, timezones) {
        const query = `SELECT er.*,o.timezone,JSON_EXTRACT(os.rules,'$.pack.expiry') as expire_date, o.language, er.report_types
                    FROM
                        email_reports er
                        INNER JOIN organizations o ON o.id=er.organization_id
                        INNER JOIN organization_settings as os ON os.organization_id = er.organization_id
                    WHERE
                       o.timezone IN(?) AND frequency IN(?) AND  JSON_EXTRACT(os.rules,'$.pack.expiry')  >= ?
                        `;
        return mySql.query(query, [timezones, frequency, date]);
    }

    static async getUnEmpReports(frequency) {
        const query = `SELECT er.*,o.timezone,JSON_EXTRACT(os.rules,'$.pack.expiry') as expire_date, o.language, er.report_types
                    FROM
                        email_reports er
                        INNER JOIN organizations o ON o.id=er.organization_id
                        INNER JOIN organization_settings as os ON os.organization_id = er.organization_id
                    WHERE er.frequency = ${frequency}
        `;
        return mySql.query(query);
    }
    static async getLogsEmpReports(frequency) {
        const query = `SELECT er.*,o.timezone,JSON_EXTRACT(os.rules,'$.pack.expiry') as expire_date, o.language, er.report_types
                    FROM
                        email_reports er
                        INNER JOIN organizations o ON o.id=er.organization_id
                        INNER JOIN organization_settings as os ON os.organization_id = er.organization_id
                    WHERE er.frequency = ${frequency}
        `;
        return mySql.query(query);
    }

    static async getReportsWithCustom(date, frequency) {
        const query = `SELECT er.*,o.timezone,JSON_EXTRACT(os.rules,'$.pack.expiry') as expire_date, o.language, er.report_types
                    FROM
                        email_reports er
                        INNER JOIN organizations o ON o.id=er.organization_id
                        INNER JOIN organization_settings as os ON os.organization_id = er.organization_id
                    WHERE
                       frequency IN(${frequency}) AND  JSON_EXTRACT(os.rules,'$.pack.expiry')  >= ?
                        `;
        return mySql.query(query, [date]);
    }

    static async getReportUser(email_report_id) {
        let query = `SELECT employee_id FROM employee_dept_email_reports WHERE email_report_id=?`;
        return mySql.query(query, [email_report_id]);
    }

    static async getReportDept(email_report_id) {
        const query = `SELECT department_id
                    FROM
                        employee_dept_email_reports 
                    WHERE
                        email_report_id=${email_report_id}`;
        return mySql.query(query, [email_report_id]);
    }

    static async getAttendance(organization_id, start_date, end_date, column, order) {
        const params = [organization_id, start_date, end_date];
        let query = `
            SELECT
                e.id, ea.id as attendance_id, u.first_name, u.last_name, u.a_email as email, e.timezone, e.emp_code,  e.department_id,
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
    static async GetProductivity({ organization_id, empids, dates, start_date, end_date, productive_hours, column, order }) {
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

        return EmpProductivityReportModel.aggregate(query);
    }

    static getOrganizationSettings(orgId) {
        const query = `SELECT organization_id,rules FROM organization_settings WHERE organization_id=?`;
        return mySql.query(query, [orgId]);
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
                organization: 1,
                type: 1,
                logIn: 1,
                logOut: 1,
               
            }
        });
        return await activitySchema.aggregate(query)
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

    static async getAssignedEmployees(user_id, depIds, orgId) {
        let query = `
            SELECT e.id
            FROM employees e
            JOIN assigned_employees ae ON ae.employee_id = e.id
            WHERE ae.to_assigned_id IN (SELECT e.id
            FROM employees e
            WHERE e.user_id = ${user_id}) AND e.organization_id = ${orgId}
        `;
        if(depIds?.length != 0) query += ` AND e.department_id IN (${depIds})`; 
        return mySql.query(query);
    }

    static async checkReportCreatedBy(user_id) {
        let query = `SELECT id
        FROM employees WHERE user_id = ${user_id}
        `;
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

    static getAllDepartments(orgId) {
        let query = `
            SELECT d.id 
            FROM organization_departments d
            WHERE d.organization_id = ${orgId}
        `;
        return mySql.query(query);
    }

    static getReportLocation(location_ids, organization_id) {
        let query = `
            SELECT e.id
            FROM employees e
            WHERE e.location_id IN (${location_ids}) AND e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }

    static getReportShift(shift_ids, organization_id) {
        let query = `
            SELECT e.id
            FROM employees e
            WHERE e.shift_id IN (${shift_ids}) AND e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }

    static getReportShift(shift_ids, organization_id, emp) {
        let query = `
            SELECT e.id
            FROM employees e
            WHERE e.shift_id IN (${shift_ids}) AND e.organization_id = ${organization_id}
        `;
        if(emp && emp.id) {
            query = `
                SELECT e.id
                	FROM employees e
                    JOIN assigned_employees ae ON ae.employee_id = e.id
                    WHERE e.shift_id IN (${shift_ids}) AND e.organization_id = ${organization_id} AND ae.to_assigned_id = ${emp.id};
            `;
        }
        return mySql.query(query);
    }

}

module.exports.emailReportsModel = emailReportsModel;
