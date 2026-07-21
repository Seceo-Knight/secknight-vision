const mySql = require('../../../database/MySqlConnection').getInstance();

const { EmployeeActivityModel } = require("../../../models/employee_activities.schema");
const report_activity_log = require("../../../models/report-activity-log.schema");
const UserActivityDataModel = require("../../../models/user_activity_data.schema");
const usersystemlogsModel = require("../../../models/user-system-logs.schema");
const employeeProductivityModel = require("../../../models/employee_productivity.schema");
const activityRequestModel = require("../../../models/activity_request.schema");
const orgAppWebModel = require("../../../models/organization_apps_web.schema");
const orgCategoriesModel = require("../../../models/organization_categories.schema");

class otherOrganizationModel {

    static async removeAllAppWebUsage(orgid) {
        // return await EmployeeActivityModel.deleteMany({ organization_id:  orgid });
    }

    static async remove_report_activity_logs(organization_id) {
        // return await report_activity_log.deleteMany({ organization_id: organization_id });
    }

    static async remove_userActivityData(organization_id) {
        // return await UserActivityDataModel.deleteMany({ adminId: organization_id });
    }

    static async remove_userSystemLogs(organization_id) {
        // return await usersystemlogsModel.deleteMany({ organization_id: organization_id });
    }

    static async remove_employeeProductivityReports(organization_id) {
        // return await employeeProductivityModel.deleteMany({ organization_id: organization_id });
    }

    static async remove_activityRequest(organization_id) {
        // return await activityRequestModel.deleteMany({ organization_id: organization_id });
    }

    static async remove_orgAppWebModel(organization_id) {
        // return await orgAppWebModel.deleteMany({ organization_id: organization_id });
    }

    static async remove_orgCategoriesModel(organization_id) {
        // return await orgCategoriesModel.deleteMany({ organization_id: organization_id });
    }

    static async getIdWithEmail(emails) {
        let placeholders = emails.map(() => '?').join(',');
        let query = `SELECT o.id, u.email, u.id as user_id
            FROM users u
            JOIN organizations o ON u.id = o.user_id
            WHERE u.email IN (${placeholders});
        `;
        return mySql.query(query, emails);
    }

    static async getAllEmployee(ids) {
        let query = `SELECT
                    e.id,u.id AS u_id, first_name, last_name, u.a_email as email, u.photo_path as photo_path, emp_code, u.contact_number as phone
                    FROM employees e
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    JOIN roles rn ON rn.id=ur.role_id
                    WHERE e.organization_id IN (${ids});`;
        return mySql.query(query);
    }

    static async deleteAllUsersTable(ids) {
        let query = `DELETE
                    FROM users
                    WHERE id IN (${ids.length > 0 ? ids : 0});`;
        return mySql.query(query);
    }

    static async get_notification_rules(ids) {
        let query = `SELECT id
                    FROM notification_rules
                    WHERE organization_id = ${ids};`;
        return mySql.query(query);
    }

    static async delete_notification_rule_recipients(ids) {
        let query = `DELETE
                    FROM notification_rule_recipients
                    WHERE notification_rule_id IN (${ids.length > 0 ? ids : 0});`;
        return mySql.query(query);
    }

    static async delete_external_teleworks(ids) {
        let query = `DELETE
                    FROM external_teleworks
                    WHERE organization_id = ${ids};`;
        return mySql.query(query);
    }

}

module.exports = otherOrganizationModel;