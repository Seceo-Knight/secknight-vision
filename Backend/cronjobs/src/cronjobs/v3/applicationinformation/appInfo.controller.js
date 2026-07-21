const Redis = require("../../../database/redisConnection");
const AppInfoModel = require('./appinfo.model');
const { logger: Logger } = require("../../../utils/Logger");

class AppInfoController {
    async applicationInformation(cb) {
        try {
            Logger.info(`-----------End for setting data on redis ${new Date()}----------------`)
            console.info('-----setting application information ----');

            const applicationInfoData = await AppInfoModel.applicationInformation();
            await Redis.setAsync('app-info', JSON.stringify(applicationInfoData));
            return;
        } catch (err) {
            console.log('----error occured while setting app information----', err);
        }
        finally {
            Logger.info(`-----------End for setting data on redis ${new Date()}----------------`)
            cb()
        }
    }
}

module.exports = new AppInfoController;