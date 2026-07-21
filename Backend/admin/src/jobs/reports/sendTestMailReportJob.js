const jobs = require('../');
const { ReportBuilder } = require('../../routes/v3/reports/emailreport/testemail/ReportBuilder');

module.exports.sendTestMailReportJob = {
    perform: async (uuid) => {
        try {
            const { redis } = jobs;
            const args = JSON.parse(await redis.get(uuid));
            await redis.del(uuid);
            const reportBuilder = new ReportBuilder(args);
            console.log('-------------', uuid);
            try {
                await reportBuilder.sendMail();
                await reportBuilder.finalize();
            } catch (err) {
                await reportBuilder.finalize();
                logger.error(e);
                return false;
            }
        } catch (e) {
            console.log('------------', e);
            logger.error(e);
            return false;
        }
    },
};