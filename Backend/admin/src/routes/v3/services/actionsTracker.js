const { UserActionsLogModel } = require('../logs/UserActionsLogModel');

const parseMessage = (message, params) => {
    const vars = [...params];
    return message.replace(/(\?|\%i|\!)/g, (matched) => {
        switch (matched) {
            case '?': return JSON.stringify(vars.shift());
            case '!': return vars.shift();
            case '%i': return parseInt(vars.shift());
            default: return '';
        }
    });
};

const actionsTracker = async (req, action, actionParams = []) => {
    const userId = req.decoded && req.decoded.user_id;
    return UserActionsLogModel.insert({
        user_id: userId,
        action: parseMessage(action, actionParams),
        method: req.method,
        path: req.baseUrl,
        ip: req.connection.remoteAddress,
    });
};

module.exports = actionsTracker;
