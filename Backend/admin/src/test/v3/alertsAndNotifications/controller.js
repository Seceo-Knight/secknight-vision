const _ = require('underscore');
const qs = require('qs');
const {request, assert, expect, auth, fixtures, travelTo} = require('../../helpers/common');

const {NotificationRulesModel} = require('../../../routes/v3/alertsAndNotifications/Models');

beforeEach(() => fixtures.load());

const employeesFilter = {ids: [1], departments: [1], locations: [1]};

const notificationRule = {
    id: 1,
    organization_id: 1,
    type: 'DWT',
    risk_level: 'MR',
    is_multiple_alerts_in_day: 1,
    name: 'Rule 1',
    note: '',
    is_action_notify: 1,
    include_employees: {
        ids: [{id: 1, name: 'Bob Employee', computer_id: 'Computer ID'}],
        departments: [{id: 1, name: 'php'}],
        locations: [{id: 1, name: 'Paris'}],
    },
    exclude_employees: {
        ids: [{id: 1, name: 'Bob Employee', computer_id: 'Computer ID'}],
        departments: [{id: 1, name: 'php'}],
        locations: [{id: 1, name: 'Paris'}],
    },
    conditions: [
        {
            type: 'HUR',
            cmp_operator: '<',
            cmp_argument: '20',
        },
        {
            type: 'DMN',
            cmp_operator: '=',
            cmp_argument: '5ecae946b88f0a34a1856086',
            app_domain_name: '10fastfingers.com',
        }
    ],
    recipients: [{
        user_id: 3,
        name: 'Bob Employee',
    }],
};

describe('Alerts and Notifications Controller', async () => {
    describe('Create', async () => {
        it('with exists domain', async () => {
            const response = await auth.loginAsAdmin(request
                .post('/api/v3/alerts-and-notifications')
                .send({
                    name: 'Rule 1',
                    type: 'DWT',
                    risk_level: 'MR',
                    is_multiple_alerts_in_day: true,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '  10fastfingers.com '},
                    ],
                    recipients: [
                        {user_id: 1},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity created.');
            expect(response.body.data.id).to.be.a('number');
            const entity = await NotificationRulesModel.getExtended(response.body.data.id);
            const condition = entity.conditions.find(c => c.type === 'DMN');
            assert.equal(condition.cmp_argument, '5ecae946b88f0a34a1856086');
            assert.equal(condition.app_domain_name, '10fastfingers.com');
        });
        it('with a new domain', async () => {
            let response = await auth.loginAsAdmin(request
                .post('/api/v3/alerts-and-notifications')
                .send({
                    name: 'Rule 1',
                    type: 'DWT',
                    risk_level: 'MR',
                    is_multiple_alerts_in_day: true,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'DMN', cmp_operator: '=', cmp_argument: 'faceBook.com'},
                    ],
                    recipients: [
                        {user_id: 1},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity created.');
            let entity = await NotificationRulesModel.getExtended(response.body.data.id);
            let condition = entity.conditions.find(c => c.type === 'DMN');
            const newId = condition.cmp_argument;
            assert.equal(condition.app_domain_name, 'facebook.com');

            response = await auth.loginAsAdmin(request
                .post('/api/v3/alerts-and-notifications')
                .send({
                    name: 'Rule 1',
                    type: 'DWT',
                    risk_level: 'MR',
                    is_multiple_alerts_in_day: true,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'DMN', cmp_operator: '=', cmp_argument: 'faCeBook.com'},
                    ],
                    recipients: [
                        {user_id: 1},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity created.');
            entity = await NotificationRulesModel.getExtended(response.body.data.id);
            condition = entity.conditions.find(c => c.type === 'DMN');
            assert.equal(condition.cmp_argument, newId);
            assert.equal(condition.app_domain_name, 'facebook.com');
        });

        it('with exists app', async () => {
            const response = await auth.loginAsAdmin(request
                .post('/api/v3/alerts-and-notifications')
                .send({
                    name: 'Rule 1',
                    type: 'DWT',
                    risk_level: 'MR',
                    is_multiple_alerts_in_day: true,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'APP', cmp_operator: '=', cmp_argument: ' Google Chrome   '},
                    ],
                    recipients: [
                        {user_id: 1},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity created.');
            expect(response.body.data.id).to.be.a('number');
            const entity = await NotificationRulesModel.getExtended(response.body.data.id);
            const condition = entity.conditions.find(c => c.type === 'APP');
            assert.equal(condition.cmp_argument, '5ed0fd12eed03b3a32ed560d');
            assert.equal(condition.app_domain_name, 'google chrome');
        });
        it('with a new app', async () => {
            let response = await auth.loginAsAdmin(request
                .post('/api/v3/alerts-and-notifications')
                .send({
                    name: 'Rule 1',
                    type: 'DWT',
                    risk_level: 'MR',
                    is_multiple_alerts_in_day: true,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'APP', cmp_operator: '=', cmp_argument: '   FireFox  '},
                    ],
                    recipients: [
                        {user_id: 1},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity created.');
            let entity = await NotificationRulesModel.getExtended(response.body.data.id);
            let condition = entity.conditions.find(c => c.type === 'APP');
            const newId = condition.cmp_argument;
            assert.equal(condition.app_domain_name, 'firefox');

            response = await auth.loginAsAdmin(request
                .post('/api/v3/alerts-and-notifications')
                .send({
                    name: 'Rule 1',
                    type: 'DWT',
                    risk_level: 'MR',
                    is_multiple_alerts_in_day: true,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'APP', cmp_operator: '=', cmp_argument: ' FirefoX '},
                    ],
                    recipients: [
                        {user_id: 1},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity created.');
            entity = await NotificationRulesModel.getExtended(response.body.data.id);
            condition = entity.conditions.find(c => c.type === 'APP');
            assert.equal(condition.cmp_argument, newId);
            assert.equal(condition.app_domain_name, 'firefox');
        });
    });

    it('Get', async () => {
        const response = await auth.loginAsAdmin(request.get('/api/v3/alerts-and-notifications?id=1'));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entity returned.');
        const entity = response.body.data;
        expect(_.omit(entity, 'created_at')).to.eql(notificationRule);
    });

    describe('Update', async () => {
        it('with exists domain', async () => {
            const response = await auth.loginAsAdmin(request
                .put('/api/v3/alerts-and-notifications')
                .send({
                    id: 1,
                    name: 'Rule 1',
                    type: 'SEE',
                    risk_level: 'LR',
                    is_multiple_alerts_in_day: false,
                    is_action_notify: false,
                    note: 'new note',
                    include_employees: employeesFilter,
                    exclude_employees: employeesFilter,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '   10fastfingers.com   '},
                    ],
                    recipients: [
                        {user_id: 2},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity updated.');
            assert.equal(response.body.data.id, 1);
            const entity = await NotificationRulesModel.getExtended(1);
            expect(_.omit(entity, 'created_at')).to.eql({
                ...notificationRule,
                type: 'SEE',
                risk_level: 'LR',
                is_multiple_alerts_in_day: 0,
                name: 'Rule 1',
                note: 'new note',
                is_action_notify: 0,
                conditions: [
                    {type: 'HUR', cmp_operator: '<', cmp_argument: '20'},
                    {
                        type: 'DMN',
                        cmp_operator: '=',
                        cmp_argument: '5ecae946b88f0a34a1856086',
                        app_domain_name: '10fastfingers.com',
                    }
                ],
                recipients: [{
                    user_id: 2,
                    name: 'Bob Organizer',
                }],
            });
        });
        it('with a new domain', async () => {
            let response = await auth.loginAsAdmin(request
                .put('/api/v3/alerts-and-notifications')
                .send({
                    id: 1,
                    name: 'Rule 1',
                    type: 'SEE',
                    risk_level: 'LR',
                    is_multiple_alerts_in_day: false,
                    is_action_notify: false,
                    note: 'new note',
                    include_employees: employeesFilter,
                    exclude_employees: employeesFilter,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '  faceBook.com  '},
                    ],
                    recipients: [
                        {user_id: 2},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity updated.');
            assert.equal(response.body.data.id, 1);
            let entity = await NotificationRulesModel.getExtended(1);
            let condition = entity.conditions.find(c => c.type === 'DMN');
            const newId = condition.cmp_argument;
            assert.equal(condition.app_domain_name, 'facebook.com');

            response = await auth.loginAsAdmin(request
                .put('/api/v3/alerts-and-notifications')
                .send({
                    id: 1,
                    name: 'Rule 1',
                    type: 'SEE',
                    risk_level: 'LR',
                    is_multiple_alerts_in_day: false,
                    is_action_notify: false,
                    note: 'new note',
                    include_employees: employeesFilter,
                    exclude_employees: employeesFilter,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '  FaCeBook.com '},
                    ],
                    recipients: [
                        {user_id: 2},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity updated.');
            assert.equal(response.body.data.id, 1);
            entity = await NotificationRulesModel.getExtended(1);
            condition = entity.conditions.find(c => c.type === 'DMN');
            assert.equal(condition.cmp_argument, newId);
            assert.equal(condition.app_domain_name, 'facebook.com');
        });

        it('with exists app', async () => {
            const response = await auth.loginAsAdmin(request
                .put('/api/v3/alerts-and-notifications')
                .send({
                    id: 1,
                    name: 'Rule 1',
                    type: 'SEE',
                    risk_level: 'LR',
                    is_multiple_alerts_in_day: false,
                    is_action_notify: false,
                    note: 'new note',
                    include_employees: employeesFilter,
                    exclude_employees: employeesFilter,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'APP', cmp_operator: '=', cmp_argument: '   Google Chrome   '},
                    ],
                    recipients: [
                        {user_id: 2},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity updated.');
            assert.equal(response.body.data.id, 1);
            const entity = await NotificationRulesModel.getExtended(1);
            expect(_.omit(entity, 'created_at')).to.eql({
                ...notificationRule,
                type: 'SEE',
                risk_level: 'LR',
                is_multiple_alerts_in_day: 0,
                name: 'Rule 1',
                note: 'new note',
                is_action_notify: 0,
                conditions: [
                    {type: 'HUR', cmp_operator: '<', cmp_argument: '20'},
                    {
                        type: 'APP',
                        cmp_operator: '=',
                        cmp_argument: '5ed0fd12eed03b3a32ed560d',
                        app_domain_name: 'google chrome',
                    }
                ],
                recipients: [{
                    user_id: 2,
                    name: 'Bob Organizer',
                }],
            });
        });
        it('with a new domain', async () => {
            let response = await auth.loginAsAdmin(request
                .put('/api/v3/alerts-and-notifications')
                .send({
                    id: 1,
                    name: 'Rule 1',
                    type: 'SEE',
                    risk_level: 'LR',
                    is_multiple_alerts_in_day: false,
                    is_action_notify: false,
                    note: 'new note',
                    include_employees: employeesFilter,
                    exclude_employees: employeesFilter,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'APP', cmp_operator: '=', cmp_argument: '  FireFox  '},
                    ],
                    recipients: [
                        {user_id: 2},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity updated.');
            assert.equal(response.body.data.id, 1);
            let entity = await NotificationRulesModel.getExtended(1);
            let condition = entity.conditions.find(c => c.type === 'APP');
            const newId = condition.cmp_argument;
            assert.equal(condition.app_domain_name, 'firefox');

            response = await auth.loginAsAdmin(request
                .put('/api/v3/alerts-and-notifications')
                .send({
                    id: 1,
                    name: 'Rule 1',
                    type: 'SEE',
                    risk_level: 'LR',
                    is_multiple_alerts_in_day: false,
                    is_action_notify: false,
                    note: 'new note',
                    include_employees: employeesFilter,
                    exclude_employees: employeesFilter,
                    conditions: [
                        {type: 'HUR', cmp_operator: '<', cmp_argument: 20},
                        {type: 'APP', cmp_operator: '=', cmp_argument: '  FiReFox '},
                    ],
                    recipients: [
                        {user_id: 2},
                    ],
                }));
            assert.equal(response.body.code, 200);
            assert.equal(response.body.message, 'Entity updated.');
            assert.equal(response.body.data.id, 1);
            entity = await NotificationRulesModel.getExtended(1);
            condition = entity.conditions.find(c => c.type === 'APP');
            assert.equal(condition.cmp_argument, newId);
            assert.equal(condition.app_domain_name, 'firefox');
        });
    });

    it('Delete', async () => {
        const response = await auth.loginAsAdmin(request
            .delete('/api/v3/alerts-and-notifications')
            .send({id: 1}));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entity deleted.');
        assert.equal(response.body.data.id, 1);
        try {
            await NotificationRulesModel.get(1);
        } catch (e) {
            assert.equal(e.message, 'Record Not Found');
        }
    });

    it('Find by', async () => {
        const response = await auth.loginAsAdmin(request
            .get('/api/v3/alerts-and-notifications/find-by'));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entities returned.');
        assert.equal(response.body.data.length, 1);
        const entity = response.body.data[0];
        expect(_.omit(entity, 'created_at')).to.eql(notificationRule);
    });

    it('Alerts Find by', async () => {
        const params = {
            from: '2020-01-01',
            to: '2030-01-01',
            employee_id: 1,
            department_id: 1,
            location_id: 1,
            search_keyword: 'daily',
            sort_by: {
                datetime: 'DESC',
                employee: 'DESC',
                computer: 'DESC',
                policy: 'DESC',
                risk_level: 'DESC',
                behavior_rule: 'DESC',
                action: 'DESC',
            },
            skip: 0,
            limit: 1,
        };
        const response = await auth.loginAsAdmin(request
            .get(`/api/v3/alerts-and-notifications/alerts/find-by?${qs.stringify(params)}`));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Entities returned.');
        assert.equal(response.body.data.length, 1);
        const entity = response.body.data[0];

        assert.equal(entity.id, 1);
        assert.equal(entity.employee_id, 1);
        assert.equal(entity.behavior_rule, 'When daily work time is less or greater than specified hours/minutes.');
        assert.equal(entity.employee, 'Bob Employee');
        assert.equal(entity.risk_level, 'Moderate');
    });
});
