const {request, assert, expect, auth, fixtures} = require('../../helpers/common');
const {UserPropertiesModel} = require('../../../routes/v3/userProperties/UserPropertiesModel');
const {Firebase} = require('../../../messages/Firebase');

beforeEach(() => fixtures.load());

const validFirebaseToken = 'eQW4odWupNAHqmgTnzQIqf:APA91bEDy9TRuKn_fPhPbesbkt7gteJgNQUq3MDVFi5afw19' +
    'HHmQJzzrHQsYAFdtHIaIxaAj3T6-BS8OZrKzW5WDfFNe8f062POOpK-YMirMXwImB-Ayhzh-LoU9ZeEyoqM4rW6vg1KJ';

const firbaseLastMessage = () => {
    try {
        const {recipients, message} = Firebase.Mock.lastMessage();
        const [recipient] = recipients;
        const {title, body} = message.params.notification;
        return {recipient, title, body};
    } catch (e) {
        return;
    }
};

describe('User Properties Controller', async () => {
    it('Set', async () => {
        let response = await auth.loginAsAdmin(request
            .post('/api/v3/user-properties')
            .send({
                properties: [
                    {name: 'prop1', value: 'value1'},
                    {name: 'prop2', value: {sub1: 'val1', sub2: 'val2'}},
                ],
            }));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Properties set.');
        expect(response.body.data.properties).to.be.a('array');

        response = await auth.loginAsAdmin(request
            .post('/api/v3/user-properties')
            .send({
                properties: [
                    {name: 'prop1', value: 'value21'},
                    {name: 'prop2', value: {sub1: 'val21', sub2: 'val22'}},
                ],
            }));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Properties set.');
        expect(response.body.data.properties).to.be.a('array');
    });

    it('Get', async () => {
        const response = await auth.loginAsAdmin(request.get('/api/v3/user-properties?names[]=firebaseToken'));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Properties returned.');
        const {properties: {firebaseToken}} = response.body.data;
        assert.equal(firebaseToken, validFirebaseToken);
    });

    it('Delete', async () => {
        const response = await auth.loginAsAdmin(request
            .delete('/api/v3/user-properties')
            .send({names: ['firebaseToken']}));
        assert.equal(response.body.code, 200);
        assert.equal(response.body.message, 'Properties deleted.');
        const {firebaseToken} =  await UserPropertiesModel.get(1, ['firebaseToken']);
        expect(firebaseToken).to.be.a('undefined');
    });

    describe('Set firebase token', async () => {
        it('Set valid token', async () => {
            const newToken = `valid-${validFirebaseToken}`;
            const response = await auth.loginAsAdmin(request
                .post('/api/v3/user-properties')
                .send({
                    properties: [
                        {name: 'firebaseToken', value: newToken},
                        {name: 'prop2', value: {sub1: 'val1', sub2: 'val2'}},
                    ],
                }));
            assert.equal(response.body.code, 200);
            const {recipient, title, body} = firbaseLastMessage();
            assert.equal(recipient, newToken);
            assert.equal(title, 'EmpMonitor');
            assert.equal(
                body,
                'You\'re successfully subscribed to EmpMonitor notifications.',
            );
        });
        it('Set invalid token', async () => {
            Firebase.Mock.shouldFailOnce();
            const newToken = `invalid-${validFirebaseToken}`;
            const response = await auth.loginAsAdmin(request
                .post('/api/v3/user-properties')
                .send({
                    properties: [
                        {name: 'firebaseToken', value: newToken},
                        {name: 'prop2', value: {sub1: 'val1', sub2: 'val2'}},
                    ],
                }));
            assert.equal(response.body.code, 422);
            assert.equal(response.body.message, 'Validation Failed.');
            assert.equal(response.body.error, 'Firebase token invalid.');
        });
    });
});
