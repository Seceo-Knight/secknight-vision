const mySql = require("../../../database/MySqlConnection").getInstance();

class UninstallAgentModel {
    getOrganizationData(organization_id, employee_id) {
        return mySql.query(`
            SELECT u.email, 
            u.a_email,
            o.id as organization_id, 
            o.uninstall_password,o.agent_notification as status
            FROM users u 
            JOIN organizations o ON o.user_id = u.id
            WHERE o.id = ${organization_id};
        `);
    }

    getExpiryFromAdmin(admin_email) {
        return mySql.query(`
            SELECT 
                u.email, JSON_EXTRACT(os.rules, '$.pack') AS pack
            FROM users u 
            JOIN organizations o ON o.user_id = u.id
            JOIN organization_settings os ON os.organization_id = o.id
            WHERE u.email = '${admin_email}' OR u.a_email = '${admin_email}';
        `);
    }
    
    getEmployeeTimeZone(user_email) {
        return mySql.query(`
            SELECT e.timezone 
            FROM employees e 
            JOIN users u ON u.id = e.user_id
            WHERE u.email = '${user_email}' OR u.a_email = '${user_email}';
        `);
    }

     async agentUninstalledLogs(employee_id,message,org_id) {
        return mySql.query(`
        INSERT INTO agent_uninstalled(employee_id,action_message,organization_id)
        VALUES(${employee_id},'${message}',${org_id}) 
        `)
    }
    async getAdminId(organization_id){
        return mySql.query(`SELECT user_id as admin_id FROM organizations WHERE id=${organization_id}`)
    }
}

module.exports = new UninstallAgentModel;