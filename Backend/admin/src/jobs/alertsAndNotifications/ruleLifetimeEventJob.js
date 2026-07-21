const handlers = require('./rules/handlers');
const models = require('../../routes/v3/alertsAndNotifications/Models/NotificationRulesModel');


const handleRuleLifetimeEvent = async (rule, eventType) => {
    const handler = handlers[rule.type];
    switch (eventType) {
        case 'created':
            await handler.ruleCreated(rule);
            break;
        case 'updated':
            await handler.ruleUpdated(rule);
            break;
        case 'deleted':
            await handler.ruleDeleted(rule);
            break;
    }
};

module.exports.ruleLifetimeEventJob = {
    perform: async (ruleId, eventType) => {
        const rule = eventType === 'deleted' ? { id: ruleId } : await models.NotificationRulesModel.get(ruleId);
        await handleRuleLifetimeEvent(rule, eventType);
    },
};