const moment = require('moment');

const service = require('./service');
const model = require('./model');
const logger = require("../../../utils/Logger")

class CheckOrganizationProviderCred {
    async checkOrganizationProviderCredIsExpired(cb) {
        try {
            console.log('---------------------start for checkOrganizationProviderCredIsExpired---------------------');
            let providerDatas = await model.checkIsExpired();
            providerDatas = providerDatas.filter(i => { 
                const expiryDate = JSON.parse(i.rules).expiry;
                const diff = moment().add(1, 'days').diff(expiryDate, 'days');
                if (diff < 0) return true;
            });
            providerDatas.map(async data => {
                const creds = JSON.parse(data.creds);
                try {
                    const isAccessed = await service.checkAccessToStorage(data.short_code, {
                        client_id: creds.client_id,
                        client_secret: creds.client_secret,
                        refresh_token: creds.refresh_token
                    });
                } catch (error) {
                    logger.logger.error(`Storage Creds Expired for ${data.organization_id} ${data.email} --- ${error.message}`);
                    // //! Marking as invalid or expired storage credentials and sending alert email to organization
                    // await model.updateIsExpired(data.organization_provider_cred);
                    // let [resellerData] = await model.getReseller(data.organization_id);
                    // await service.sendMail(data.email, resellerData);
                }
            })
        } catch (error) {
            console.log(error?.message ?? error);
        }
        return cb();
    }
}

module.exports = new CheckOrganizationProviderCred;