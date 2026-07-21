const mySql = require('../../../database/MySqlConnection').getInstance();
const Logger = require('../../../logger/Logger').logger;
const EmpKeyStrokesModel = require('../../../models/employee_keystrokes.schema');
const {EmployeeActivityModel: EmpActivities} = require('../../../models/employee_activities.schema');
class AIModel {
    /**get strorage  creds  */
    async getStorageDetail(organization_id) {
        let query = `SELECT
                    op.provider_id AS storage_type_id ,p.name,p.short_code ,opc.id AS storage_data_id,opc.creds,op.status
                    FROM organization_providers op 
                    INNER JOIN providers p ON p.id=op.provider_id
                    INNER JOIN organization_provider_credentials opc ON opc.org_provider_id =op.id
                    WHERE op.organization_id=${organization_id} AND opc.status=1`;
        return mySql.query(query);
    }

    /**get User details */
    async user(userId) {
        let query = `SELECT  e.id ,e.emp_code,u.date_join,u.contact_number as phone,u.address ,u.last_name as full_name,
        u.first_name name,e.timezone,u.email, e.location_id  ,e.department_id,u.date_join,u.photo_path , e.organization_id
                    FROM users u
                    INNER JOIN employees e ON u.id=e.user_id
                    WHERE e.id = ${userId}`;
        return mySql.query(query);
    }

    /**get attendence */
    getAttandanceIds({ employee_id, skip, limit }) {
        const query = `
            SELECT id AS attendance_id,DATE(date) as date,employee_id
            FROM employee_attendance
            WHERE employee_id = ${employee_id} 
            LIMIT ${skip},${limit} `;
        return mySql.query(query)
    }

    /**keystroke count */
    getKeyStrokesCount(attendance_ids) {
        return EmpKeyStrokesModel.countDocuments({ attendance_id: { $in: attendance_ids } })
    }

    getKeyStrokes(attendance_ids) {
        return EmpActivities.aggregate([
            {
                $match: {
                    attendance_id: { $in: attendance_ids },
                    domain_id: { $eq: null },
                    application_id: { $ne: null },
                    keystrokes: { $nin: ["", null] }
                }
            },
            {
                $lookup: {
                    from: "organization_apps_webs",
                    let: { application_id: "$application_id" },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: ["$_id", "$$application_id"] } },
                        },
                        { $project: { name: 1, _id: 0 } }
                    ],
                    as: "app"
                }
            },
            { $unwind: "$app" },
            { $sort: { start_time: -1 } },
            {
                $project: {
                    _id: 0,
                    app_name: "$app.name",
                    keystrokes: 1
                }
            }
        ]);
    }

    getAttandanceCount(employee_id) {
        const query = `
            SELECT count(id) as count 
            FROM employee_attendance
            WHERE employee_id = ${employee_id}`;
        return mySql.query(query)
    }

    getEmployeeId(skip, limit) {
        const query = `
            SELECT id AS employee_id 
            FROM employees
            LIMIT ${skip},${limit}`;
        return mySql.query(query)
    }

    addkeystrokePrediction(app_id, app_name, employee_id, keystrokes, sentiment) {
        let query = `
        INSERT INTO keystroke_prediction ( app_id, app_name, employee_id, keystrokes, sentiment)
        VALUES(${app_id},' ${app_name}', ${employee_id},' ${keystrokes}', '${sentiment}')`;
        return mySql.query(query);
    }
}
module.exports = new AIModel;
