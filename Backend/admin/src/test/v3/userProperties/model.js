const {assert, expect, fixtures} = require('../../helpers/common');
const {UserPropertiesModel} = require('../../../routes/v3/userProperties/UserPropertiesModel');

beforeEach(() => fixtures.load());

describe('User Properties Model', async () => {
    it('Set', async () => {
        let result = await UserPropertiesModel.set(1, [
            {name: 'prop1', value: 'value1'},
            {name: 'prop2', value: {sub1: 'val1', sub2: 'val2'}},
        ]);
        assert.equal(result.affectedRows, 2);
        const {prop1, prop2} = await UserPropertiesModel.get(1, ['prop1', 'prop2']);
        assert.equal(prop1, 'value1');
        assert.deepEqual(prop2, {sub1: 'val1', sub2: 'val2'});

        result = await UserPropertiesModel.set(1, [
            {name: 'prop1', value: 'value21'},
            {name: 'prop2', value: {sub1: 'val21', sub2: 'val22'}},
        ]);
        assert.equal(result.affectedRows, 4);
        const {prop1: prop21, prop2: prop22} = await UserPropertiesModel.get(1, ['prop1', 'prop2']);
        assert.equal(prop21, 'value21');
        assert.deepEqual(prop22, {sub1: 'val21', sub2: 'val22'});
    });

    it('Get', async () => {
        const {firebaseToken} = await UserPropertiesModel.get(1, ['firebaseToken']);
        assert.equal(firebaseToken, 'eQW4odWupNAHqmgTnzQIqf:APA91bEDy9TRuKn_fPhPbesbkt7gteJgNQUq3MDVFi5afw19HHmQJzzrHQsYAFdtHIaIxaAj3T6-BS8OZrKzW5WDfFNe8f062POOpK-YMirMXwImB-Ayhzh-LoU9ZeEyoqM4rW6vg1KJ');
    });

    it('Delete', async () => {
        const result = await UserPropertiesModel.delete(1, ['firebaseToken']);
        assert.equal(result.affectedRows, 1);
        const {firebaseToken} =  await UserPropertiesModel.get(1, ['firebaseToken']);
        expect(firebaseToken).to.be.a('undefined');
    });
});
