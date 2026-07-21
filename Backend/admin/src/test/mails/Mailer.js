const {assert} = require('../helpers/common');
const {Mailer} = require('../../messages/Mailer');

describe('messages', async () => {
    it('Mailer verify', async () => {
        await Mailer.verify().then(() => {
            assert.isOk(true);
        });
    });
    it('Send mail', async () => {
        await Mailer.sendMail({
            from: 'from@test.com',
            to: 'to@test.com',
            subject: 'Test subject',
            text: 'Test message',
        });

        const {from, to, subject, text} = Mailer.Mock.lastMessage();
        assert.equal(from, 'from@test.com');
        assert.equal(to, 'to@test.com');
        assert.equal(subject, 'Test subject');
        assert.equal(text, 'Test message');
    });
});