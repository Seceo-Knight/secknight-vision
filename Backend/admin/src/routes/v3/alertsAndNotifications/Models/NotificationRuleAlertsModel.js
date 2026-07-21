const moment = require('moment-timezone');
const { BaseModel } = require('../../../../models/BaseModel');
const NotificationRules = require('./NotificationRulesModel');

class NotificationRuleAlertsModel extends BaseModel {
    static get TABLE_NAME() {
        return 'notification_rule_alerts';
    }

    static get TABLE_FIELDS() {
        return [
            'notification_rule_id', 'employee_attendance_id', 'employee_id',
            'subject', 'message',
            'delivered_at', 'created_at', 'updated_at',
        ];
    }

    static findBy(params) {
        const queryConditions = [];
        const validParams = this.valuesSlice(params);
        const { skip, limit } = params;
        const queryParams = [
            this.TABLE_NAME, 'notification_rules', 'employees', 'users', 'organization_departments',
            'organization_locations', 'organizations',
        ];

        Object.keys(validParams).forEach((key) => {
            if (!(key in validParams)) return;
            queryConditions.push('na.?? = ?');
            queryParams.push(key, validParams[key]);
        });
        queryConditions.push('n.?? = ?');
        queryParams.push('organization_id', params.organization_id);        
        if ('from' in params) {
            queryConditions.push('na.?? >= ?');
            queryParams.push('created_at', params.from);
        }
        if ('to' in params) {
            queryConditions.push('na.?? <= ?');
            queryParams.push('created_at', params.to);
        }
        if ('employee_id' in params) {
            queryConditions.push('e.?? = ?');
            queryParams.push('id', params.employee_id);
        }
        if ('department_id' in params) {
            queryConditions.push('d.?? = ?');
            queryParams.push('id', params.department_id);
        }
        if ('location_id' in params) {
            queryConditions.push('l.?? = ?');
            queryParams.push('id', params.location_id);
        }
        if (params.manager_id) {
            queryConditions.push('nr.?? = ?');
            queryParams.push('user_id', params.user_id);
        }

        if ('search_keyword' in params) {
            const likeParam = `%${params.search_keyword}%`;
            const serachConditions = [
                'CONCAT(u.first_name, " ", u.last_name) LIKE ?',
                'e.emp_code LIKE ?',
                'n.name LIKE ?',
                'JSON_EXTRACT(?, CONCAT("$.", n.risk_level)) LIKE ?',
                'JSON_EXTRACT(?, CONCAT("$.", n.type)) LIKE ?',
            ];
            const serachParams = [
                likeParam, likeParam, likeParam,
                JSON.stringify(NotificationRules.NotificationRulesModel.RISK_LEVELS), likeParam,
                JSON.stringify(NotificationRules.NotificationRulesModel.TYPES), likeParam,
            ];         

            queryConditions.push(`((${serachConditions.join(') OR (')}))`);
            queryParams.push(...serachParams);
        }

        const where = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

        const sortByExprs = [];
        if ('sort_by' in params) {
            const { datetime, employee, computer, policy, risk_level, behavior_rule, action } = params.sort_by;
            const sortBy = { datetime, employee, computer, policy, risk_level, behavior_rule, action };
            for (const name in sortBy) {
                if (!sortBy[name]) continue;
                sortByExprs.push(`${name} ${sortBy[name]}`);
            }
        }
        sortByExprs.push('na.id DESC');

        queryParams.push(skip || 0, limit || 10);
        let query = `
            SELECT
              na.id as id,
              na.notification_rule_id as notification_rule_id,
              na.employee_id as employee_id,
              na.created_at as datetime,
              n.name as policy,
              CONCAT(u.first_name, ' ', u.last_name) as employee,
              d.name as deportament_name,
              l.name as location_name,
              e.emp_code as computer,
              n.risk_level as risk_level,
              n.type as behavior_rule,
              IF(n.is_action_notify > 0, 'Alert, Email', 'Email') as action,
              o.timezone,
              (COUNT( na.id ) OVER()) AS total_count,na.subject,na.message
            FROM
              ?? as na
              JOIN ?? as n ON(na.notification_rule_id = n.id)
              JOIN ?? as e ON(na.employee_id = e.id)
              JOIN ?? as u ON(e.user_id = u.id)
              JOIN ?? as d ON(e.department_id = d.id)
              JOIN ?? as l ON(e.location_id = l.id) 
              JOIN ?? as o ON(n.organization_id = o.id)`;
        if (params.manager_id) {
            query += ` JOIN notification_rule_recipients as nr ON(nr.notification_rule_id = n.id) `;
        }

        query += ` ${where}
            ORDER BY
              ${sortByExprs.join(', ')}
            LIMIT
               ?, ?;
        `;
      
        return this.query(query, queryParams).then((results) => {
            if (results.length === 0) return results;
            const ids = [... new Set(results.map(row => row.notification_rule_id))];
            return this.query(`
                    SELECT
                        nr.notification_rule_id as rule_id,
                        u.id, CONCAT(u.first_name, ' ', u.last_name) as name, u.a_email as email
                    FROM
                        notification_rule_recipients nr
                        JOIN users u ON(u.id = nr.user_id)
                    WHERE
                        nr.notification_rule_id IN(?)
                `, [ids])
                .then((recipients) => {
                    // if (params.manager_id) {
                    //     recipients = recipients.filter(user => user.id == params.user_id);
                    // }
                    const recipientsByRuleId = {};
                    for (const recipient of recipients) {
                        const { rule_id, id, name, email } = recipient;
                        if (!recipientsByRuleId[rule_id]) {
                            recipientsByRuleId[rule_id] = [];
                        }
                        recipientsByRuleId[rule_id].push({ id, name, email });
                    }
                    return results.map((row) => {
                        row.risk_level = NotificationRules.NotificationRulesModel.RISK_LEVELS[row.risk_level];
                        row.behavior_rule = NotificationRules.NotificationRulesModel.TYPES[row.behavior_rule];
                        row.recipients = recipientsByRuleId[row.notification_rule_id] || [];
                        row.datetime = moment(row.datetime).tz(row.timezone).format();
                        return row;
                    });
                });
        });
    }
}

module.exports.NotificationRuleAlertsModel = NotificationRuleAlertsModel;