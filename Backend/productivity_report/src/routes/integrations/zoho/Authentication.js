const axios = require('axios');
const moment = require('moment');

const sendResponse = require('../../../utils/myService').sendResponse;
const Zoho = require('../../shared/integrations/Zoho');
const ZohoValidation = require('../../../rules/validation/Zoho');
const ZohoHelper = require('./ZohoHelper');

class Authentication {
    async authenticate(req, res) {
        let redirect_uri;

        if (process.env.NODE_ENV === 'development') {
            redirect_uri = process.env.WEB_DEV;
        } else if (process.env.NODE_ENV === 'production') {
            redirect_uri = process.env.WEB_PRODUCTION;
        } else {
            redirect_uri = process.env.WEB_LOCAL;
        }
        let url = `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoProjects.bugs.ALL,ZohoProjects.tasklists.ALL,ZohoProjects.users.ALL,ZohoProjects.portals.ALL,ZohoProjects.projects.ALL,ZohoProjects.tasks.ALL&client_id=${process.env.ZOHO_CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${redirect_uri}/add-zoho-portal&prompt=consent`
        sendResponse(res, 200, url, 'Authenticate URL', null);
    }

    async accessToken(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        let {
            code,
            name,
            integration_id
        } = req.body;
        name = 'Zoho projects';

        let redirect_uri;

        if (process.env.NODE_ENV === 'development') {
            redirect_uri = process.env.WEB_DEV;
        } else if (process.env.NODE_ENV === 'production') {
            redirect_uri = process.env.WEB_PRODUCTION;
        } else {
            redirect_uri = process.env.WEB_LOCAL;
        }

        const validate = ZohoValidation.tokenValidation({
            code,
            name,
            integration_id
        });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let integration = await Zoho.checkZohointegrationData(integration_id, admin_id, manager_id);
        if (!integration) return sendResponse(res, 400, null, 'Unable To Add Integration Data.', null);
        if (integration.length > 0) return sendResponse(res, 400, null, 'Already Integrated.', null);


        let code_url = `https://accounts.zoho.com/oauth/v2/token?code=${code}&redirect_uri=${redirect_uri}/add-zoho-portal&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=authorization_code`;
        axios.post(code_url)
            .then(async (response) => {
                if (response.data.error) return sendResponse(res, 400, null, 'Invalid Code', null);

                let inserted = await Zoho.addZohointegrationData(name, response.data.access_token, response.data.refresh_token, admin_id, manager_id, integration_id);
                if (!inserted) return sendResponse(res, 400, null, 'Unable To Add Integration Data.', null);
                req.body.integration_data_id = inserted.insertId;
                req.body.name = name;
                req.body.status = 1;
                return sendResponse(res, 200, req.body, 'Authentication Successfully Done.', null);
            })
            .catch((error) => {
                return sendResponse(res, 400, null, 'Unable To Get Access Token', error);
            })
    }

    async regenarateAccessToken(req, res) {
        let refresh_token = '1000.b37c072105520aae9171987b17347d14.a281aa16bca1105caa4b0df022a6bbe2';
        let url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refresh_token}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`;
        axios.post(url)
            .then((response) => {
                return sendResponse(res, 200, response.data, 'Successfully Access Token Updated.', null);
            })
            .catch((error) => {
                return sendResponse(res, 400, null, 'Failed To Update Access Token', error);
            })
    }

    async checkaccessToken(manager_id, admin_id) {
        const current_time = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        const last_one_hour = moment().utc().subtract(58, "minutes").format('YYYY-MM-DD HH:mm:ss');

        //Chech token valid or not, if invalid get new access token
        const integration_data = await Zoho.zohointegrationData(admin_id, manager_id);
        if (!integration_data) return null;
        if (integration_data.length === 0) return null;

        if (!moment(integration_data[0].updated_at).isBetween(last_one_hour, current_time, null, '[]')) {
            let access_token = await ZohoHelper.regenarateToken(integration_data[0].refresh_token);
            if (!access_token) return null;
            let updated_token = await Zoho.updateIntegrationData(admin_id, manager_id, access_token);
            if (!updated_token) return null;
            return access_token
        } else {
            return integration_data[0].access_token;
        }
    }
}

module.exports = new Authentication;