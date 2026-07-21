const {BaseModel} = require('../../../../models/BaseModel');
const NotificationRules = require('./NotificationRulesModel');

class NotificationRuleConditionsModel extends BaseModel {
    static get TABLE_NAME() {
        return 'notification_rule_conditions';
    }

    static get TABLE_FIELDS() {
        return [
            'notification_rule_id', 'type', 'cmp_operator', 'cmp_argument',
            'created_at', 'updated_at',
        ];
    }

    static get TYPES() {
        return {
            MNT: 'Minutes',
            HUR: 'Hours',
            ABT: 'Absent',
            DMN: 'Domain',
            APP: 'Application',
        };
    }

    static get CMD_OPERATORS() {
        return {
            '>': 'More', '>=': 'More or Equal', '<': 'Less', '<=': 'Less or Equal', '=': 'Equal',
        };
    }

    get rule() {
        if (this._rule) return Promise.resolve(this._rule);
        return NotificationRules.NotificationRulesModel.get(this.notification_rule_id).then((result) => {
            this._rule = result;
            return result;
        });
    }

    get periodInSeconds() {
        return this.cmp_argument * (this.type === 'MNT' ?  60 : 3600);
    }

    get periodOutputFormat() {
        return this.type;
    }
}

module.exports.NotificationRuleConditionsModel = NotificationRuleConditionsModel;