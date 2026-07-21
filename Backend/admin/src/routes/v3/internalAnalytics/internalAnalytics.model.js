const mySql = require('../../../database/MySqlConnection').getInstance();
const EmployeeSystemLogsModel = require('../../../models/employee_system_logs.schema');

class Model {
    getAutoEmailReportConcise(currentDate) {
        return mySql.query(`
            SELECT 
                er.organization_id, 
                u.email,
                u.a_email,
                CASE 
                    WHEN er.frequency = 1 THEN 'Daily'
                    WHEN er.frequency = 2 THEN 'Weekly'
                    WHEN er.frequency = 3 THEN 'Monthly'
                    ELSE er.frequency
                END AS frequency_label, 
                COUNT(er.id) AS total_count,
                JSON_EXTRACT(os.rules, '$.pack.expiry') as expiry_date
            FROM email_reports er
            JOIN organizations o ON o.id = er.organization_id
            JOIN organization_settings os on os.organization_id = o.id
            JOIN users u ON u.id = o.user_id
            WHERE JSON_EXTRACT(os.rules, '$.pack.expiry') >= "${currentDate}"
            GROUP BY organization_id, frequency;
        `)
    }


    getAutoEmailReportCount(currentDate) {
        return mySql.query(`
            SELECT 
                COUNT(*) AS total_count
            FROM email_reports er
            JOIN organizations o ON o.id = er.organization_id
            JOIN organization_settings os ON os.organization_id = o.id
            JOIN users u ON u.id = o.user_id
            WHERE JSON_EXTRACT(os.rules, '$.pack.expiry') >= "${currentDate}";
        `);        
    }

    getAlertReportConcise(currentDate) {
        return mySql.query(`
            SELECT 
                o.id, u.email, u.a_email, count(nr.id) as total_count
                FROM notification_rules nr
                JOIN organizations o ON o.id = nr.organization_id
                JOIN organization_settings os ON os.organization_id = o.id
                JOIN users u ON u.id = o.user_id
                WHERE JSON_EXTRACT(os.rules, '$.pack.expiry') >= "${currentDate}"
                GROUP BY nr.organization_id;
        `);
    }

    getAlertReportCount(currentDate) {
        return mySql.query(`
            SELECT COUNT(*) AS total_count
            FROM notification_rules nr
            JOIN organizations o ON o.id = nr.organization_id
            JOIN organization_settings os ON os.organization_id = o.id
            JOIN users u ON u.id = o.user_id
            WHERE JSON_EXTRACT(os.rules, '$.pack.expiry') >= "${currentDate}";
        `);
    }

    async getSystemLogs({ organization_id, employee_id, limit, skip }) {
        let query = {};
        
        // Build MongoDB query
        if (organization_id) query.organization_id = organization_id;
        if (employee_id) query.employee_id = employee_id;

        return EmployeeSystemLogsModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip || 0)
            .limit(limit || 100)
            .lean();
    }

    async getSystemLogsCount({ organization_id, employee_id }) {
        let query = {};
        
        if (organization_id) query.organization_id = organization_id;
        if (employee_id) query.employee_id = employee_id;

        return EmployeeSystemLogsModel.countDocuments(query);
    }

    getEmployeesByIds(employeeIds) {
        if (!employeeIds || employeeIds.length === 0) {
            return Promise.resolve([]);
        }

        const placeholders = employeeIds.map(() => '?').join(',');
    
        const query = `
            SELECT 
                e.id,
                u.first_name,
                u.last_name,
                u.a_email AS email,
                e.organization_id
            FROM employees e
            JOIN users u ON u.id = e.user_id
            WHERE e.id IN (${placeholders})
        `;
    
        return mySql.query(query, employeeIds);
    }
}

module.exports = new Model();