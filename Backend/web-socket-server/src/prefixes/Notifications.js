const sockJs = require('sockjs');
const jwtService = require('../utils/jwt.service');
const { JwtToken } = require('../utils/JwtToken');
const { logger } = require('../log/Logger');

const connectById = {};
const usersConnectsById = {};
const systemConnects = [];

const write = async (conn, message) => {
    return conn.write(JSON.stringify(message));
};

const sendToSystemConnects = async (message) => {
    if (systemConnects.length === 0) {
        setTimeout(() => {
            return sendToSystemConnects(message);
        }, 5000);
        return;
    }
    const conn = systemConnects[Math.floor(Math.random() * systemConnects.length)];
    return write(conn, message); 
};

const onData = async (conn, messageJson) => {
    const { connId } = conn;
    const message = JSON.parse(messageJson);
    switch (message.type) {
        case 'auth':
            try {
                const { user_id: userId } = JSON.parse(await jwtService.verify(message.token));
                conn.userId = userId;
                usersConnectsById[userId] = usersConnectsById[userId] || [];
                usersConnectsById[userId].push(conn);
                return sendToSystemConnects({
                    type: 'userConnected',
                    lastMessageId: message.lastMessageId,
                    userId,
                    connId
                });
            } catch (err) {
                return write(conn, {
                    type: 'error',
                    connId: conn.connId,
                    message: 'Invalid token or expired token',
                });
            }
        case 'sysAuth':
            try {
                const payload = await JwtToken.decrypt(message.token);
                if (payload != process.env.JWT_ACCESS_TOKEN_SECRET) {
                    throw 'Invalid token or expired token';
                }
                systemConnects.push(conn);
            } catch (err) {
                return write(conn, {
                    type: 'error',
                    message: 'Invalid token or expired token',
                });
            }
            break;
        case 'messages':
            if (!connectById[message.connId]) return;
            return write(connectById[message.connId], { type: 'messages', messages: message.messages });
        case 'newMessages':
            if (!usersConnectsById[message.userId]) return;
            for (const conn of usersConnectsById[message.userId]) {
                await write(conn, { type: 'newMessages', messages: message.messages });
            }
            return;
        case 'agentUninstall':
            if (!usersConnectsById[message.userId]) return;
            // logger.log(`connectedUser----`,usersConnectsById)
            for (const conn of usersConnectsById[message.userId]) {
                await write(conn, { type: 'agentUninstall', messages: message.messages, message: message.message });
            }
            return;
        case 'newReport':
            /** newReport excel implementation type for socket */
            if (!usersConnectsById[message.userId]) return;
            for (const conn of usersConnectsById[message.userId]) {
                await write(conn, { type: 'newReport', messages: message.messages, message: message.message});
            }
            return;
        case 'employeeGeolocationChange':
            if (!usersConnectsById[message.userId]) return;
            for (const conn of usersConnectsById[message.userId]) {
                await write(conn, { type: 'employeeGeolocationChange', messages: message.messages, message: message.message });
            }
            return;
        case 'usbAlert':
            if (!usersConnectsById[message.userId]) return;
            for (const conn of usersConnectsById[message.userId]) {
                await write(conn, { type: 'usbAlert', messages: message.messages, message: message.message });
            }
            return;
        case 'newReportBeforeDelete':
            /** newReport delete excel socket */
            if (!usersConnectsById[message.userId]) return;
            for (const conn of usersConnectsById[message.userId]) {
                await write(conn, { type: 'newReportBeforeDelete', messages: message.messages, message: message.message});
            }
            return;
        case 'newReportAfterDelete':
                /** newReport delete excel socket */
                if (!usersConnectsById[message.userId]) return;
                for (const conn of usersConnectsById[message.userId]) {
                    await write(conn, { type: 'newReportAfterDelete', messages: message.messages, links: message.links, message: message.message});
                }
                return;
        case 'delivered':
            if (!message.delivered || message.delivered.length === 0) return;
            return sendToSystemConnects({ ...message, userId: conn.userId });
    }
};

const onClose = (conn) => {
    if (conn.userId) {
        const index = usersConnectsById[conn.userId].indexOf(conn);
        if (~index) {
            usersConnectsById[conn.userId].splice(index, 1);
        }
    }
    const index = systemConnects.indexOf(conn);
    if (~index) {
        systemConnects.splice(index, 1);
    }
    delete connectById[conn.connId];
};

let connId = 1;
const onConnection = (conn) => {
    conn.connId = connId++;
    connectById[conn.connId] = conn;
    conn
        .on('data', (message) => onData(conn, message))
        .on('close', () => onClose(conn));
};


class Notifications {
    start(server) {
        const notifications = sockJs.createServer();
        notifications.on('connection', onConnection);
        notifications.installHandlers(server, { prefix: `/${process.env.NOTIFICATION_PREFIX}` });
    }
}

module.exports.Notifications = Notifications;