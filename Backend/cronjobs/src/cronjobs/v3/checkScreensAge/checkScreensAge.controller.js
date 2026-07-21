const CheckScreensAgeService = require('./checkScreensAge.service');
const { logger: Logger } = require("../../../utils/Logger");

class CheckScreensAgeController {
    async autoDeleteOldScreens(cb) {
        console.log('---------screenshot age check cron strted--------');
        Logger.info(`-----------Starting for Screenshot delete ${new Date()}----------------`)
        try {
            const storagesData = await CheckScreensAgeService.getStoragesCredentials();

            await CheckScreensAgeService.checkAllStorages(storagesData);
        } catch (error) {
            console.error(`CRON_ERROR: ${error.message}`);
        }
        finally {
            Logger.info(`-----------End for Screenshot delete ${new Date()}----------------`)
            cb();
        }
    }
}

module.exports = new CheckScreensAgeController();
