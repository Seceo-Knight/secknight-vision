const mySql = require('../../../../database/MySqlConnection').getInstance();
const OrgWebAppModel = require('../../../../models/organization_apps_web.schema');
const EmployeeReportModel = require('../../../../models/employee_productivity.schema');
const {EmployeeActivityModel: EmpActivities} = require('../../../../models/employee_activities.schema');
const SqlString = require('sqlstring');

class ApiModel {
  getEmployee(employeeId, skip = 0, limit = 20, user_ids = [], location_id, department_id, role_id, name) {
    let query = `
                        SELECT e.id employee_id, e.shift_id shift_id, CONCAT(u.first_name ," ",u.last_name) name, d.name department, l.name location, ur.role_id, r.name AS role
                        FROM assigned_employees ae
                        INNER JOIN employees e ON ae.employee_id =e.id
                        INNER JOIN users u ON u.id=e.user_id
                        INNER JOIN organization_departments d ON  d.id=e.department_id
                        INNER JOIN organization_locations l ON l.id=e.location_id
                        INNER JOIN user_role ur ON ur.user_id=e.user_id
        				INNER JOIN roles r ON r.id =ur.role_id
                        WHERE ae.to_assigned_id =${employeeId}`;
    if (location_id) query += `  AND l.id=${location_id}`;
    if (department_id) query += `  AND d.id=${department_id}`;
    if (role_id) query += ` AND  ur.role_id=${role_id}`;
    if (name) query += ` AND ( u.first_name LIKE '%${name}%' OR  u.last_name LIKE '%${name}%')`;
    query += `  LIMIT ${skip} ,${limit}`;
    if (user_ids && user_ids.length > 0) {
      query = `
                   SELECT e.id employee_id, e.shift_id shift_id, CONCAT(u.first_name ," ",u.last_name) name  ,d.name department 
                   FROM assigned_employees ae
                   INNER JOIN employees e ON ae.employee_id =e.id
                   INNER JOIN users u ON u.id=e.user_id
                   INNER JOIN organization_departments d ON  d.id=e.department_id
                   WHERE ae.to_assigned_id =${employeeId} AND ae.employee_id IN (${user_ids})`;
    }

    return mySql.query(query);
  }

  getApplications(organization_id, skip, limit) {
    return OrgWebAppModel.find({organization_id, type: 1}, {_id: 0, name: 1}).skip(skip).limit(limit).lean();
  }
  getAppsByName(names, organization_id) {
    return OrgWebAppModel.find({organization_id, type: 1, name: {$in: names}}, {name: 1}).lean();
  }
  getDeveloperAppReports(employee_ids, appids, from_date, to_date) {
    return EmployeeReportModel.aggregate([
      {
        $match: {
          employee_id: {$in: employee_ids},
          'applications.application_id': {$in: appids},
          date: {$gte: from_date, $lte: to_date},
        },
      },
      {$project: {_id: 0, employee_id: 1, application_id: '$applications.application_id'}},
      {$unwind: '$application_id'},
      {
        $match: {
          employee_id: {$in: employee_ids},
          application_id: {$in: appids},
        },
      },
      {$group: {_id: {employee_id: '$employee_id', application_id: '$application_id'}, application_id: {$first: '$application_id'}}},
      {$project: {_id: 0, employee_id: '$_id.employee_id', application_id: 1}},
    ]);
  }

  getLastActivityTime(absentEmpIds, date) {
    let query = `
        SELECT max(id) id,employee_id,max(date) date,MAX(end_time) end_time
         FROM employee_attendance 
         WHERE employee_id IN (?) AND date <=?
         GROUP BY employee_id
        `;
    return mySql.query(query, [absentEmpIds, date]);
  }
  getEmployeeActivity(attendance_ids) {
    return EmpActivities.aggregate([
      {$match: {attendance_id: {$in: attendance_ids}, total_duration: {$ne: 0}}},
      {$sort: {attendance_id: 1, createdAt: 1}},
      {
        $group: {
          _id: '$attendance_id',
          domain_id: {$first: '$domain_id'},
          url: {$first: '$url'},
          title: {$first: '$title'},
          total_duration: {$first: '$total_duration'},
          active_seconds: {$first: '$active_seconds'},
          keystrokes: {$first: '$keystrokes'},
          application_id: {$first: '$application_id'},
        },
      },
      {$lookup: {from: 'organization_apps_webs', localField: 'application_id', foreignField: '_id', as: 'app'}},
      {$unwind: '$app'},
      {$lookup: {from: 'organization_apps_webs', localField: 'domain_id', foreignField: '_id', as: 'web'}},
      {
        $project: {
          _id: 0,
          attendance_id: '$_id',
          url: 1,
          title: 1,
          total_duration: 1,
          active_seconds: 1,
          keystrokes: 1,
          app: {
            name: 1,
          },
          web: {
            name: 1,
          },
        },
      },
    ]);
  }
  getAbsentEployeeDetails(date, employee_id, role_id) {
    let query = `
            SELECT
                e.id,
                CONCAT(u.first_name, ' ', u.last_name) AS name,
                u.a_email AS email,
                l.name AS location_name,
                d.name AS department_name
            FROM assigned_employees             AS ae
            LEFT JOIN employees                 AS e ON e.id = ae.employee_id
            LEFT JOIN employee_attendance		AS ea ON e.id = ea.employee_id AND ea.date = "${date}"
            LEFT JOIN users                     AS u ON u.id = e.user_id
            LEFT JOIN organization_locations    AS l ON l.id = e.location_id
            LEFT JOIN organization_departments  AS d ON d.id = e.department_id
            WHERE ae.to_assigned_id = ${employee_id} AND ea.id IS NULL 
            AND ae.role_id = ${role_id};
        `;
    return mySql.query(query);
  }

  // getAttandanceIds({ organization_id, empIds, from_date, to_date }) {
  //     const query = `
  //         SELECT ea.id AS attendance_id,e.department_id ,CONCAT(u.first_name," ",u.last_name) as name
  //         FROM employee_attendance ea
  //         JOIN employees e ON e.id=ea.employee_id
  //         JOIN users u ON u.id=e.user_id
  //         WHERE
  //             ea.organization_id = ${organization_id} AND
  //             ea.employee_id IN( ${empIds}) AND
  //             ea.date BETWEEN "${from_date}" AND "${to_date}"
  //     `;

  //     return mySql.query(query);
  // }

  getAttandanceIdsGroupped({organization_id, employee_ids, start_date, end_date}) {
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
    query1 += ` ea.date BETWEEN ? AND ?
                GROUP BY e.id`;

    const query = SqlString.format(query1, [organization_id, employee_ids, start_date, end_date]);
    return mySql.query(query);
  }

  getAssignedDetails({ employee_id, organization_id }) {


    let params = [employee_id, organization_id];

    let query = `select ae.to_assigned_id as superior_id,concat(u.first_name," ",u.last_name) as superior_name,
    u.email as superior_email,ae.role_id as superior_role_id,rl.name as superior_role_name
    from assigned_employees as ae
    INNER Join employees  as e ON ae.to_assigned_id = e.id 
    INNER Join users  as u ON e.user_id = u.id
    INNER Join roles  as rl ON ae.role_id = rl.id
    where ae.employee_id = ? and e.organization_id = ?  
   `


    return mySql.query(query, params);
  }

}
module.exports = new ApiModel();
