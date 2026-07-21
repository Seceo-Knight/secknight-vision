const {BaseModel} = require('../../../../models/BaseModel');

class NotificationRuleRecipientsModel extends BaseModel {
    static get TABLE_NAME() {
        return 'notification_rule_recipients';
    }

    static get TABLE_FIELDS() {
        return [
            'notification_rule_id', 'user_id',
            'created_at', 'updated_at',
        ];
    }
}

module.exports.NotificationRuleRecipientsModel =  NotificationRuleRecipientsModel;