const {request, assert, expect, auth, fixtures} = require('../../helpers/common');

const actionsTracker = require('../../../routes/v3/services/actionsTracker');
const {UserActionsLogModel} = require('../../../routes/v3/logs/UserActionsLogModel');

beforeEach(() => fixtures.load());

describe('Actions tracker', async () => {
    it('Put action description to log', async () => {
        const request = {
            decoded: { user_id: 2 },
            method: 'POST',
            baseUrl: 'baseUrl',
            connection: { remoteAddress: 'localhost' },
        };
        const result = await actionsTracker(
            request,
            'Message ?, (!), %i',
            [1, [1,2,3], '12test'],
        );

        assert.equal(result.user_id, 2);
        assert.equal(result.action, 'Message 1, (1,2,3), 12');
        assert.equal(result.method, 'POST');
        assert.equal(result.path, 'baseUrl');
        assert.equal(result.ip, 'localhost');

        await UserActionsLogModel.deleteMany({_id: result._id});
    });
});
