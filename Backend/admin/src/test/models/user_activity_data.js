const {assert} = require('../helpers/common');

const userActivityData = require('../../models/user_activity_data.schema');

describe('Store confidential data in secured format', async () => {
    it(`Stored userEmail,
               appUsage.url, appUsage.keystrokes,
               activityPerSecond.buttonClicks, activityPerSecond.keystrokes, activityPerSecond.mouseMovements`,
        async () => {
            const entity = new userActivityData({
                userId: 1,
                userEmail: 'user@exemple.com',
                adminId: 1,
                dataId: 1,
                systemTimeUtc: 'systemTimeUtc',
                date: 'date',
                time: 'time',
                appUsage: [{
                    url: 'test_url',
                    keystrokes: 'keystrokes',
                    app: 'app',
                    start: 10,
                    end: 20,
                }],
                activityPerSecond: {
                    buttonClicks: '1',
                    keystrokes: '2',
                    mouseMovements: '3',
                }
            });
            await entity.save();
            const storedEntity = await userActivityData.findOne(entity._id);

            assert.equal(storedEntity.userEmail, 'user@exemple.com');
            assert.equal(storedEntity.appUsage[0].url, 'test_url');
            assert.equal(storedEntity.appUsage[0].keystrokes, 'keystrokes');
            assert.equal(storedEntity.activityPerSecond.buttonClicks, '1');
            assert.equal(storedEntity.activityPerSecond.keystrokes, '2');
            assert.equal(storedEntity.activityPerSecond.mouseMovements, '3');

            assert.notEqual(storedEntity.get('userEmail', String, {getters: false}), 'user@exemple.com');
            assert.notEqual(storedEntity.appUsage[0].get('url', String, {getters: false}), 'test_url');
            assert.notEqual(storedEntity.appUsage[0].get('keystrokes', String, {getters: false}), 'keystrokes');
            assert.notEqual(storedEntity.activityPerSecond.get('buttonClicks', String, {getters: false}), '1');
            assert.notEqual(storedEntity.activityPerSecond.get('keystrokes', String, {getters: false}), '2');
            assert.notEqual(storedEntity.activityPerSecond.get('mouseMovements', String, {getters: false}), '3');

            entity.delete();
    });
});
