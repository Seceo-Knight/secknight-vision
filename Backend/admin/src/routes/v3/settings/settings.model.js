const mySql = require('../../../database/MySqlConnection').getInstance();
const Logger = require('../../../logger/Logger').logger;

class SettingsModel {
    async getEmployee(columns, condition) {
        let query = `SELECT ${columns}
                    FROM employees
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async updateEmployee(values, condition) {
        let query = `UPDATE employees
                    SET ${values}
                    WHERE ${condition}`

        return mySql.query(query);
    }


    async getUser(columns, condition) {
        let query = `SELECT ${columns}
                    FROM users
                    WHERE ${condition}`

        return mySql.query(query);
    }


    async getEmployeefullDetails(condition) {
        let query = `SELECT e.id ,e.department_id,e.location_id,e.tracking_rule_type,e.group_id,og.name,
                    e.custom_tracking_rule,od.name AS department_name,u.first_name,u.first_name as name,u.last_name,u.a_email as email,u.contact_number as phone,
                    u.date_join,u.status,ol.name AS location_name,e.timezone,u.password,e.emp_code,CONCAT(u.first_name, ' ',u.last_name) AS full_name,
                    ur.role_id,r.name as role_name
                    FROM employees e
                    JOIN organization_departments od ON e.department_id=od.id
                    JOIN organization_locations ol ON e.location_id=ol.id
                    JOIN users u ON e.user_id=u.id
                    JOIN user_role ur ON ur.user_id=e.user_id
                    JOIN roles r ON ur.role_id=r.id
                    LEFT JOIN organization_groups og ON og.id=e.group_id
                    WHERE ${condition}`

        return mySql.query(query);
    }

    // async getEmployeefullDetails(condition) {
    //     let query = `SELECT e.id ,e.department_id,e.location_id,e.tracking_rule_type,
    //                 e.custom_tracking_rule,od.name AS department_name,u.first_name,u.first_name as name,u.last_name,u.a_email as email,u.contact_number as phone,
    //                 u.date_join,u.status,ol.name AS location_name,e.timezone,u.password,e.emp_code,CONCAT(u.first_name, ' ',u.last_name) AS full_name,
    //                 ur.role_id,r.name as role_name
    //                 FROM employees e
    //                 JOIN organization_departments od ON e.department_id=od.id
    //                 JOIN organization_locations ol ON e.location_id=ol.id
    //                 JOIN users u ON e.user_id=u.id
    //                 JOIN user_role ur ON ur.user_id=e.user_id
    //                 JOIN roles r ON ur.role_id=r.id
    //                 WHERE ${condition}`

    //     return mySql.query(query);
    // }
    async getUser(columns, condition) {
        let query = `SELECT ${columns}
                    FROM users
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async getGroupSetting(condition) {
        let query = `SELECT rules
                    FROM organization_groups
                    WHERE ${condition}`

        return mySql.query(query);
    }

    async getOrganizationSetting(condition) {
        let query = `SELECT rules
                    FROM organization_settings
                    WHERE ${condition}`

        return mySql.query(query);
    }

    /**
      * Getting projects names based on ids
      *
      * @function getProjects
      * @memberof Settings
      * @param {*} req
      * @param {*} res
      * @return {Promise<Object>} with project names or Error.
      */
    async getProjects(project_ids, organization_id) {
        try {
            return await mySql.query(`
            SELECT id , name
            FROM projects 
            WHERE id IN (${project_ids}) AND organization_id=${organization_id}        
            `)
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return null;
        }
    }

    
    async checkIsDefaultTrackingGroup (organization_id) {
        let query = `SELECT * FROM organization_settings WHERE organization_id = ${organization_id}`;
        return mySql.query(query);
    }

    async updateTrackingGroup (rules, tracking_id, table_name, organization_id) {
        rules = JSON.stringify(rules);
        let query = `UPDATE ${table_name} set rules = ? WHERE id = ? `
        if (organization_id) query += ` AND organization_id = ${organization_id}`;
        return mySql.query(query, [rules, tracking_id]);
    }

    async checkIsCustomTrackingGroup (tracking_id) {
        let query = `SELECT * FROM organization_groups WHERE id = ${tracking_id}`;
        return mySql.query(query);
    }

    async getEmployeeDefaultGroup (organization_id) {
        let query = `SELECT id FROM employees WHERE organization_id = ${organization_id} AND tracking_rule_type = 1;`;
        return mySql.query(query);
    }

    async getEmployeeOrgGroup (organization_id, group_id) {
        let query = `SELECT id FROM employees WHERE organization_id = ${organization_id} AND group_id = ${group_id};`;
        return mySql.query(query);
    }

    async getOrganizationUninstallData (organization_id) {
        return mySql.query(`
            SELECT u.email, 
            u.a_email, 
            o.id as organization_id, 
            o.uninstall_password 
            FROM users u 
            JOIN organizations o ON o.user_id = u.id 
            WHERE o.id = ${organization_id}
        `)
    }

    async updateOrganizationUninstallData (organization_id, password) {
        let query = `
            UPDATE organizations SET uninstall_password = "${password}" WHERE id = ${organization_id}
        `;
        return mySql.query(query);
    }

    async updateAgentNotificationStatus (organization_id, status){
        let query = `
            UPDATE organizations SET agent_notification = "${status}"
            WHERE id = ${organization_id} 
        `;
        return mySql.query(query);
    }
    
    async getAgentNotificationStatus (organization_id){
        let query = `
            SELECT  agent_notification as status
            FROM organizations 
            WHERE id = ${organization_id} 
        `;
        return mySql.query(query);
    }
}

module.exports = new SettingsModel;