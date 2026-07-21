const jobs = require('../index');
const uniqid = require('uniqid');

exports.sendMailBackground = async (arguments) => {
    const { queue, redis } = jobs;
    const uuid = `sendMailReport:${uniqid()}`;
    await redis.set(uuid, JSON.stringify(arguments));
    await queue.enqueue('sendMailReJob', uuid);
}