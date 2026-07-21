const {assert, expect, fixtures} = require('../../helpers/common');

const {
    NotificationRulesModel: NotificationModel,
    NotificationRuleConditionsModel: ConditionModel, NotificationRuleRecipientsModel: RecipientModel,
    NotificationRuleAlertsModel: AlertModel
} = require('../../../routes/v3/alertsAndNotifications/Models');

beforeEach(() => fixtures.load());

describe('Notification Rules Model', async () => {
    it('Create', async () => {
        const entity = await NotificationModel.create({
            organization_id: 1,
            name: 'Rule 1',
            note: '',
            type: 'DWT',
            risk_level: 'MR',
            is_multiple_alerts_in_day: true,
            is_action_notify: true,
            conditions: [
                {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                {type: 'DMN', cmp_operator: '=', cmp_argument: '5ecae946b88f0a34a1856086'},
            ],
            recipients: [
                {user_id: 1},
            ],
            include_employees: {},
            exclude_employees: {},
        });
        assert.equal(entity.affectedRows, 1);
        expect(entity.insertId).to.be.a('number');

        const conditions = await ConditionModel.findBy({notification_rule_id: entity.insertId});
        assert.equal(conditions.length, 2);

        const recipients = await RecipientModel.findBy({notification_rule_id: entity.insertId});
        assert.equal(recipients.length, 1);
    });

    it('Get', async () => {
        const entity = await NotificationModel.get(1);
        assert.equal(entity.id, 1);
        assert.equal(entity.organization_id, 1);
        assert.equal(entity.type, 'DWT');
        assert.equal(entity.risk_level, 'MR');
        assert.equal(entity.is_multiple_alerts_in_day, true);
    });

    it('Update', async () => {
        const result = await NotificationModel.update(
            1,
            {
                type: 'SEE',
                name: 'Rule 1 test',
                note: 'test',
                risk_level: 'HR',
                is_multiple_alerts_in_day: false,
                is_action_notify: false,
                conditions: [
                    {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                    {type: 'DMN', cmp_operator: '=', cmp_argument: '5ecae946b88f0a34a1856086'},
                    {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                    {type: 'DMN', cmp_operator: '=', cmp_argument: '5ecae946b88f0a34a1856086'},
                ],
                recipients: [
                    {user_id: 1},
                    {user_id: 2},
                    {user_id: 3},
                ],
                include_employees: {},
                exclude_employees: {},
            }
        );
        assert.equal(result.affectedRows, 1);
        assert.equal(result.changedRows, 1);

        const entity = await NotificationModel.getExtended(1);
        assert.equal(entity.type, 'SEE');
        assert.equal(entity.risk_level, 'HR');
        assert.equal(entity.is_multiple_alerts_in_day, false);
        assert.equal(entity.is_action_notify, false);

        const conditions = await ConditionModel.findBy({notification_rule_id: entity.id});
        assert.equal(conditions.length, 4);

        const recipients = await RecipientModel.findBy({notification_rule_id: entity.id});
        assert.equal(recipients.length, 3);
    });

    it('Delete', async () => {
        const result = await NotificationModel.delete(1);
        assert.equal(result.affectedRows, 1);
        const conditions = await ConditionModel.findBy({notification_rule_id: 1});
        assert.equal(conditions.length, 0);

        const recipients = await RecipientModel.findBy({notification_rule_id: 1});
        assert.equal(recipients.length, 0);
    });

    it('Find by', async () => {
        const entities = await NotificationModel.findBy({organization_id: 1});
        assert.equal(entities.length, 1);
        assert.equal(entities[0].organization_id, 1);
    });

    it('Alerts Find by', async () => {
        const entities = await AlertModel.findBy({notification_rule_id: 1, organization_id: 1});
        assert.equal(entities.length, 1);
        assert.equal(entities[0].notification_rule_id, 1);
    });
});
