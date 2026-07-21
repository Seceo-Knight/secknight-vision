const SockJsClient = require('sockjs-client');
const { JwtToken } = require('../utils/jwt/JwtToken');
const NotificationRuleAlertsModel = require('../routes/v3/alertsAndNotifications/Models');

let client, initServerUrl, transport;

const mockMessages = [];
const mockState = { shouldFailOnce: false, shouldFail: false };

class Mock {
    static reset() {
        mockMessages.splice(0, mockMessages.length);
    }

    static messages() {
        return mockMessages;
    }

    static lastMessage() {
        return mockMessages.length ? mockMessages[mockMessages.length - 1] : undefined;
    }

    static shouldFailOnce() {
        mockState.shouldFailOnce = true;
    }

    static shouldFail(shouldFail) {
        mockState.shouldFail = shouldFail;
    }
}

if (process.env.NODE_ENV === 'test') {
    transport = {
        async start() {
        },
        async send(message) {
            let shouldFail = false;
            if (mockState.shouldFailOnce) {
                mockState.shouldFailOnce = false;
                shouldFail = true;
            }
            if (mockState.shouldFail) {
                shouldFail = true;
            }
            if (!shouldFail) {
                const { messages: [msg] } = message;
                mockMessages.push({
                    recipients: ['eQW4odWupNAHqmgTnzQIqf:APA91bEDy9TRuKn_fPhPbesbkt7gteJgNQUq3MDVFi5afw19HHmQJzz' +
                        'rHQsYAFdtHIaIxaAj3T6-BS8OZrKzW5WDfFNe8f062POOpK-YMirMXwImB-Ayhzh-LoU9ZeEyoqM4rW6vg1KJ'],
                    message: { params: { notification: { title: msg.title, body: msg.message } } }
                });
            }
            if (shouldFail) {
                throw 'Error';
            }
            return { success: 1 };
        },
    };
} else {
    transport = {
        async start(serverUrl) {
            initServerUrl = serverUrl;
            client = new SockJsClient(serverUrl);
            console.log(`Start listen notification server on ${serverUrl}`);

            client.onopen = async () => {
                const auth = {
                    type: 'sysAuth',
                    token: await JwtToken.create(process.env.JWT_ACCESS_TOKEN_SECRET),
                };
                return transport.send(auth);
            };
            client.onmessage = (e) => {
                return onMessage(JSON.parse(e.data));
            };
            client.onclose = () => {
                setTimeout(() => {
                    this.start(initServerUrl);
                }, 5000);
            };
        },
        async send(message) {
            const payload = JSON.stringify(message);
            await client.send(payload);
            return { success: 1 };
        },
    };
}

const onMessage = async (message) => {
    const { type, userId, lastMessageId, connId } = message;
    switch (type) {
        case 'userConnected':
            const messages = await NotificationRuleAlertsModel.NotificationRuleAlertsModel.query(
                `SELECT
                    a.id, 'EmpMonitor' as title, a.message,a.subject,
                    n.risk_level, n.name as rule,a.employee_id,
                    a.created_at, a.delivered_at,n.type
                 FROM
                    notification_rule_alerts a
                    JOIN notification_rules n ON(n.id = a.notification_rule_id)
                    JOIN notification_rule_recipients r ON(r.notification_rule_id = a.notification_rule_id)
                 WHERE
                    a.delivered_at IS NULL
                    AND n.is_action_notify AND r.user_id = ? AND a.id > ? AND a.created_at >= NOW() - INTERVAL 1 DAY
                 ORDER BY id DESC LIMIT 30`,
                [userId, lastMessageId],
            );
            return transport.send({ type: 'messages', messages, connId });
        case 'delivered':
            return await NotificationRuleAlertsModel.NotificationRuleAlertsModel.query(
                `UPDATE
                    notification_rule_alerts a
                    JOIN notification_rule_recipients r ON(r.notification_rule_id = a.notification_rule_id)
                 SET delivered_at = NOW()
                 WHERE r.user_id = ? AND a.id IN(?);`,
                [userId, message.delivered],
            );
    }
};

class WebSocketNotification {
    static start(serverUrl = process.env.WEB_SOCKET_SERVER_URL) {
        transport.start(serverUrl);
    }

    static async sendMessage({ alertId }) {
        const alerts = await NotificationRuleAlertsModel.NotificationRuleAlertsModel.query(
            `SELECT
                a.id, 'EmpMonitor' as title, a.message,a.subject,
                n.risk_level, n.name as rule,a.employee_id,
                a.created_at, a.delivered_at, r.user_id as userId, n.type
             FROM
               notification_rule_alerts a
               JOIN notification_rules n ON(n.id = a.notification_rule_id)
               JOIN notification_rule_recipients r ON(r.notification_rule_id = a.notification_rule_id)
             WHERE a.id = ?`,
            [alertId],
        );
        for (const alert of alerts) {
            const { userId, ...message } = alert;
            await transport.send({ type: 'newMessages', messages: [message], userId });
        }
    }

    static async sendReportMessage({ message, userId }) {
        await transport.send({ type: "newReport", messages: [message], userId, message });
    }
    
    /** send ws for before file delete notification */
    static async sendReportBeforeDeleteMessage({ message, userId }) {
        await transport.send({ type: "newReportBeforeDelete", messages: [message], userId, message });
    }
    
    /** send ws for file delete notification */
    static async sendReportAfterDeleteMessage({ message, userId, links }) {
        await transport.send({ type: "newReportAfterDelete", messages: [message], userId, links, message });
    }
}

if (process.env.NODE_ENV === 'test') {
    WebSocketNotification.Mock = Mock;
}

module.exports.WebSocketNotification = WebSocketNotification;
