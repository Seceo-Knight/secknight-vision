const {request, assert, expect, auth, fixtures, travelTo} = require('../../../../helpers/common');

const {Mailer} = require('../../../../../messages/Mailer');
const {queue, worker} = require('../../../../../jobs');

beforeEach(() => fixtures.load());

const perform = async (queued) => {
    await worker.perform(queued);
    await queue.del(queued.class, queued.args);
    await queue.delDelayed(queued.class, queued.args);
};

const lastEnqueued = async () => {
    const enqueued = await queue.queued(0, 10000);
    return enqueued.pop();
};

describe('Report', async () => {
    describe('Test Email', async () => {
        it('Request test email filtered by organization', async () => {
            await travelTo(new Date('2030-09-01 00:00:00'), async () => {
                const response = await auth.loginAsEmployee(request
                    .post('/api/v3/report/test-email')
                    .send({
                        name: 'User report',
                        frequency: 3, // Monthly
                        recipients: ['admin@example.com'],
                        content: {
                            productivity: 1,
                            timesheet: 1,
                            apps_usage: 1,
                            websites_usage: 1,
                            keystrokes: 1
                        },
                        filter_type: 1,
                        user_ids: [],
                        department_ids: [],
                    }));
                const enqueued = await lastEnqueued();
                assert.equal(response.body.code, 200);
                assert.equal(response.body.message, 'Test mail sent.');
                assert.equal(enqueued.class, 'sendTestMailReportJob');
                await perform(enqueued);

                const {from, to: [to], subject, text, attachments} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'admin@example.com');
                assert.equal(subject, 'User report');
                assert.equal(text, 'User report');
                assert.equal(attachments.length, 4);
            });
        });
    });
});
