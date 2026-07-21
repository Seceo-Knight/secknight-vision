const jobs = require('../');
const Mail = require('./emailHelpers');

module.exports.sendMailReJob = {
    perform: async (uuid) => {
        try {
            const { redis } = jobs;
            const args = JSON.parse(await redis.get(uuid));
            await redis.del(uuid);
            await Mail.sendEMail(args);
        } catch (err) {
            return false;
        }
    },
};