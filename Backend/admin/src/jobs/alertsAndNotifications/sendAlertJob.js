const jobs = require('../');
const handlers = require('./rules/handlers');
const Notification = require('../../routes/v3/alertsAndNotifications/Models/NotificationRulesModel');
const NotificationAlert = require('../../routes/v3/alertsAndNotifications/Models/NotificationRuleAlertsModel');
const { logger } = require('../../logger/Logger');
const mySql = require('../../database/MySqlConnection').getInstance();

module.exports.sendAlertJob = {
    perform: async (ruleId, conditionId, empId, attendanceId = 0, messageParams = {}) => {
        try {
            const rule = await Notification.NotificationRulesModel.get(ruleId);
            const alertHandler = new handlers[rule.type].AlertHandler({
                rule,
                conditionId,
                empId,
                attendanceId,
                messageParams
            });

            const key = `alert-sent.${ruleId}.${conditionId}.${empId}.${attendanceId}`;

            // Should be counted multiple times per day?
            if (!rule.is_multiple_alerts_in_day && await jobs.redis.get(key)) return;
            await jobs.redis.set(key, 1, 'EX', 86400);

            const query = `SELECT id
                        FROM notification_rule_alerts
                        WHERE notification_rule_id = ? AND employee_id = ? AND employee_attendance_id = ?
                        AND created_at BETWEEN SUBTIME(NOW(), '00:00:04') AND NOW();`;
            const alertData = await mySql.query(query, [ruleId, empId, attendanceId]);
            if (alertData.length > 0) return

            const { en: subject } = await alertHandler.getSubject();
            const { en: message } = await alertHandler.getMessage();
            const { insertId } = await NotificationAlert.NotificationRuleAlertsModel.create({
                notification_rule_id: ruleId, employee_attendance_id: attendanceId,
                employee_id: empId,
                subject: subject,
                message: message,
            });

            await alertHandler.send({ alertId: insertId });
        } catch (e) {
            console.log('--------------', e);
            logger.error(e);
            return false;
        }
    },
};