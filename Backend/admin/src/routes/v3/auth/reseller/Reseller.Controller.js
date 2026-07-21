
const { ResellerValidation } = require('./Reseller.Validation');
const { settingMessages, resellerMessage } = require('../../../../utils/helpers/LanguageTranslate');
const { translate } = require('../../../../utils/messageTranslation');
const { ResellerModel } = require('./Reseller.Model');
const moment = require('moment');
const event = require('../services/event.service');
const defaultSettings = require('./../default.settings.json');
const PasswordEncoderDecoder = require('../../../../utils/helpers/PasswordEncoderDecoder');
const actionsTracker = require('../../services/actionsTracker');
const passwordService = require('../services/password.service');
const redis = require('../services/redis.service');
const jwtService = require('../services/jwt.service');
const authModel = require('../auth.model');
const Common = require('../../../../utils/helpers/Common');
const configFile = require("../../../../../../config/config");
const _ = require('underscore');

class ResellerController {
    /**
     * register client information
     *
     * @function addClient
     * @memberof ResellerController
     * @param {*} req
     * @param {*} res
     * @return  add or Error.
     */
    static async registerClient(req, res) {
        let { user_id, organization_id, language = 'en', is_employee, is_teamlead, is_manager } = req.decoded;
        try {
            const { error, value } = ResellerValidation.validateClientRegister(req.body);
            let { first_name, last_name, email, username, password, contact_number, date_join, address, timezone, expiry_date, total_allowed_user_count, notes, reseller_id_client, reseller_number_client  } = value;
            if (error) {
                return res.json({ code: 404, data: null, message: translate(settingMessages, "2", language), error: error.details[0].message });
            }

            if(is_employee || is_teamlead || is_manager) {
                let [orgDetails] = await ResellerModel.getOrganizationDetails(organization_id);
                if(!orgDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });
                user_id = orgDetails.user_id
            }

            //reseller details
            const [reseller] = await ResellerModel.getReseller({ user_id });
            if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            // user exist check
            let [user] = await ResellerModel.getUser({ email, username });
            if (user) return res.json({ code: 400, data: null, message: translate(resellerMessage, "5", language), err: "Already present." });

            // client exist check
            let [clients] = await ResellerModel.clientStats({ resellerId: reseller.reseller_id, email, username });
            if (clients) return res.json({ code: 400, data: null, message: translate(resellerMessage, "5", language), err: "Already present." });

            // reseller org details
            const [resellerOrgDetails] = await ResellerModel.getResellerOrganizationDetails(organization_id);
            if (!resellerOrgDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            // validate expiry date of the client and reseller
            if (moment(new Date(resellerOrgDetails.expiry_date)).format("YYYY-MM-DD") < moment(expiry_date).format("YYYY-MM-DD")) {
                return res.json({ code: 400, data: null, message: translate(resellerMessage, "INVALID_EXPIRY_DATE", language), err: null });
            }

            //validate the reseller licencse
            let [clientLicUsed] = await ResellerModel.getClientLicUsed(reseller.reseller_id);
            const availableLicToSell = resellerOrgDetails.total_allowed_user_count - (clientLicUsed.sold_lic + resellerOrgDetails.current_user_count);
            if (!(total_allowed_user_count <= availableLicToSell)) return res.json({ code: 400, data: null, message: translate(resellerMessage, "INSUFFICIENT_LIC", language), err: null });


            timezone = timezone || 'Asia/Kolkata';
            defaultSettings.pack.expiry = moment(expiry_date).format("YYYY-MM-DD");
            date_join = moment(date_join).format('YYYY-MM-DD');

            if(organization_id == 7129 || organization_id == 1) {
                defaultSettings.system.visibility = "true";
            }

            //password encrypt
            password = await PasswordEncoderDecoder.encryptText(password, process.env.CRYPTO_PASSWORD);

            const adminNewData = await ResellerModel.insertAdminDetails({ username, password, first_name, last_name, email, contact_number, date_join, address });
            const organizationData = await ResellerModel.insertOrganisation(adminNewData.insertId, timezone, total_allowed_user_count, reseller.reseller_id, notes, reseller_id_client, reseller_number_client );
            const adminSettingData = await ResellerModel.insertOrganizationSetting(organizationData.insertId, defaultSettings);

            let clientStats = await ResellerModel.clientStats({ resellerId: reseller.reseller_id, email, username });
            clientStats = clientStats.map(x => {
                x.expiry = JSON.parse(x.expiry);
                return x;
            });

            // start build process for the QT app for this org
            /* Stoping event to auto create build for Silah reseller as its using custom agent */
            if(organization_id !== 7129) event.emit('organization-created', organizationData.insertId);
            event.emit('organization-register-mail', { organization_id: organizationData.insertId, email, password, first_name, username, language, is_client: true })
            actionsTracker(req, 'client added (?) .', [{ created_by: user_id, username, email, reseller_id: reseller.reseller_id }]);

            return res.json({ code: 200, data: clientStats[0], message: translate(resellerMessage, "3", language), error: null });
        } catch (err) {
            console.log('-------', err);
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
    }

    /**
     * clientAuth - function to auth for the client
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    static async clientAuth(req, res, next) {
        try {
            const { error, value } = ResellerValidation.validateClientAuthParams(req.body);
            if (error) {
                return res.json({ code: 404, data: null, message: "Validation failed.", error: error.details[0].message });
            }

            let { username, password } = value;

            const [adminData] = await ResellerModel.getResellerClient(username);
            if (!adminData) {
                return res.json({ code: 400, error: null, message: 'No User with the given user name or removed.', data: null });
            }

            const { decoded } = await passwordService.decrypt(adminData.password, process.env.CRYPTO_PASSWORD);
            if (decoded != password) return res.status(400).json({ code: 400, error: 'Invalid', message: 'Password is invalid.', data: null });

            let {
                first_name, last_name, email,
                address, phone, product_id, begin_date,
                expire_date, timezone
            } = adminData;

            // restrict user login package expired
            let now = moment().format("YYYY-MM-DD");
            let expire_time = moment(new Date(expire_date)).format("YYYY-MM-DD");
            if (!(now <= expire_time)) return res.status(400).json({ code: 400, data: null, message: 'Access Denied Due To Package Expired.', error: 'Expired' });

            let setting = JSON.parse(adminData.rules);
            const productive_hours = setting.productiveHours ? (setting.productiveHours.mode == 'unlimited' ? 0 : Common.hourToSeconds(setting.productiveHours.hour)) : 0;
            const adminJsonData = {
                organization_id: adminData.organization_id,
                user_id: adminData.id,
                first_name: first_name, last_name: last_name,
                username: username, email: email, contact_number: phone, address: address,
                product_id: product_id, begin_date: begin_date,
                expire_date: expire_date, is_manager: false, is_teamlead: false, is_client: true,
                is_employee: false, is_admin: true, language: adminData.language, weekday_start: adminData.weekday_start,
                timezone: adminData.timezone ? adminData.timezone : timezone, productive_hours,
                productivity_data: setting.productiveHours
            };

            const payload = { user_id: adminJsonData.user_id };
            await redis.setAsync(adminJsonData.user_id, JSON.stringify({ ...adminJsonData, permissionData: Array.from(Array(25).keys()).map(item => item + 1) }), 'EX', Common.getTime(req.body?.expiryDays || process.env.JWT_EXPIRY));
            // await redis.setUserMetaData(adminJsonData.user_id, { ...adminJsonData, permissionData: Array.from(Array(25).keys()).map(item => item + 1) });

            const feature = await authModel.dashboardFeature();
            let accessToken;
            if (req.body?.expiryDays) accessToken = await jwtService.generateTokenWithCustomExpiryDays(payload, req.body?.expiryDays || '90d');
            else accessToken = await jwtService.generateAccessToken(payload);
            actionsTracker(req, 'Admin user %i logged in successfully.', [adminJsonData.user_id]);
            let pre_expire = moment(new Date(expire_date)).subtract(5, 'days').format("YYYY-MM-DD")
            let is_expire = moment(now).isBetween(new Date(pre_expire), new Date(expire_date), null, '[]');
            let feedback = is_expire ? 0 : 3;

            if (is_expire) {
                const feedbackData = await authModel.getFeedback(pre_expire, expire_date, adminJsonData.organization_id,)
                let skip;
                let rated;
                if (feedbackData && feedbackData.length !== 0) {
                    skip = feedbackData.find(i => {
                        return i.rated_at == now && i.status == 1
                    })
                    rated = feedbackData.find(i => {
                        return i.question_id != 0 && i.status == 0
                    })
                    if (rated && rated.length !== 0) {
                        feedback = 1;
                    } else if (skip && skip.length !== 0) {
                        feedback = 2;
                    }
                }
            }
            return res.status(200).json({
                code: 200,
                data: accessToken,
                username: adminJsonData.username,
                email: adminJsonData.email,
                is_admin: adminJsonData.is_admin,
                is_client: adminJsonData.is_client,
                is_manager: adminJsonData.is_manager,
                is_teamlead: adminJsonData.is_teamlead,
                is_employee: adminJsonData.is_employee,
                organization_id: adminJsonData.organization_id,
                user_id: adminData.id,
                expire_date,
                feature: feature,
                role: 'Admin',
                language: adminData.language,
                weekday_start: adminData.weekday_start,
                feedback,
                message: 'token',
                error: null
            });
        } catch (error) {
            console.log('Catch error ---', error);
            return res.status(400).json({ code: 400, error: 'Error in auth', message: error.message, data: null, });
        }
    }


    /**
     * clientAuthReseller - function to auth to any reseller account
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
    */

    static async clientAuthReseller(req, res, next) {
        try {
            if (!configFile.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').includes(`${req.decoded.organization_id}`)) return res.status(404).json({ code: 404, data: null, message: "Validation failed.", error: "Not an authorized users" });
            const [getResellerDetails] = await ResellerModel.getResellerOrgDetails(req?.decoded?.organization_id);
            const { error, value } = ResellerValidation.clientAuthReseller(req.body);
            if (error) {
                return res.json({ code: 404, data: null, message: "Validation failed.", error: error.details[0].message });
            }
            let { organization_id: reseller_organization_id } = value;

            const [adminData] = await ResellerModel.getResellerClientOrganizationId(reseller_organization_id);
            if (!adminData) return res.status(400).json({ code: 400, error: null, message: 'No User with the given user name or removed.', data: null });
            let {
                first_name, last_name, email,
                address, phone, product_id, begin_date,
                expire_date, timezone, username, reseller_id
            } = adminData;
            if (reseller_id !== getResellerDetails?.reseller_id) return res.status(400).json({ code: 404, data: null, message: "No valid user found.", error: null });
            // restrict user login package expired
            let now = moment().format("YYYY-MM-DD");
            let expire_time = moment(new Date(expire_date)).format("YYYY-MM-DD");
            if (!(now <= expire_time)) return res.status(400).json({ code: 400, data: null, message: 'Access Denied Due To Package Expired.', error: 'Expired' });

            let setting = JSON.parse(adminData.rules);
            const productive_hours = setting.productiveHours ? (setting.productiveHours.mode == 'unlimited' ? 0 : Common.hourToSeconds(setting.productiveHours.hour)) : 0;
            const adminJsonData = {
                organization_id: adminData.organization_id,
                user_id: adminData.id,
                first_name: first_name, last_name: last_name,
                username: username, email: email, contact_number: phone, address: address,
                product_id: product_id, begin_date: begin_date,
                expire_date: expire_date, is_manager: false, is_teamlead: false, is_client: true,
                is_employee: false, is_admin: true, language: adminData.language, weekday_start: adminData.weekday_start,
                timezone: adminData.timezone ? adminData.timezone : timezone, productive_hours,
                productivity_data: setting.productiveHours
            };

            const payload = { user_id: adminJsonData.user_id };
            await redis.setAsync(adminJsonData.user_id, JSON.stringify({ ...adminJsonData, permissionData: Array.from(Array(25).keys()).map(item => item + 1) }), 'EX', Common.getTime(req.body?.expiryDays || process.env.JWT_EXPIRY));
            // await redis.setUserMetaData(adminJsonData.user_id, { ...adminJsonData, permissionData: Array.from(Array(25).keys()).map(item => item + 1) });

            const feature = await authModel.dashboardFeature();
            let accessToken;
            if (req.body?.expiryDays) accessToken = await jwtService.generateTokenWithCustomExpiryDays(payload, req.body?.expiryDays || '90d');
            else accessToken = await jwtService.generateAccessToken(payload);
            actionsTracker(req, 'Admin user %i logged in successfully.', [adminJsonData.user_id]);
            let pre_expire = moment(new Date(expire_date)).subtract(5, 'days').format("YYYY-MM-DD")
            let is_expire = moment(now).isBetween(new Date(pre_expire), new Date(expire_date), null, '[]');
            let feedback = is_expire ? 0 : 3;

            if (is_expire) {
                const feedbackData = await authModel.getFeedback(pre_expire, expire_date, adminJsonData.organization_id,)
                let skip;
                let rated;
                if (feedbackData && feedbackData.length !== 0) {
                    skip = feedbackData.find(i => {
                        return i.rated_at == now && i.status == 1
                    })
                    rated = feedbackData.find(i => {
                        return i.question_id != 0 && i.status == 0
                    })
                    if (rated && rated.length !== 0) {
                        feedback = 1;
                    } else if (skip && skip.length !== 0) {
                        feedback = 2;
                    }
                }
            }
            return res.status(200).json({
                code: 200,
                data: accessToken,
                username: adminJsonData.username,
                email: adminJsonData.email,
                is_admin: adminJsonData.is_admin,
                is_client: adminJsonData.is_client,
                is_manager: adminJsonData.is_manager,
                is_teamlead: adminJsonData.is_teamlead,
                is_employee: adminJsonData.is_employee,
                organization_id: adminJsonData.organization_id,
                user_id: adminData.id,
                expire_date,
                feature: feature,
                role: 'Admin',
                language: adminData.language,
                weekday_start: adminData.weekday_start,
                feedback,
                message: 'token',
                error: null,
            });
        }
        catch (error) {
            return res.status(400).json({ code: 400, error: 'Error in auth', message: error.message, data: null, });
        }
    }

    /**
     * clientEmployeeAuthReseller - function to auth to any reseller account
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */

    static async clientEmployeeAuthReseller(req, res, next) {
            try {
                // if (!configFile.SILAH_CUSTOM_MAIL_TEMPLATE.split(',').includes(`${req.decoded.organization_id}`)) return res.status(404).json({ code: 404, data: null, message: "Validation failed.", error: null });
                const [getResellerDetails] = await ResellerModel.getResellerOrgDetails(req?.decoded?.organization_id);
                const { error, value } = ResellerValidation.clientAuthReseller(req.body);
                if (error) {
                    return res.json({ code: 404, data: null, message: "Validation failed.", error: error.details[0].message });
                }
                let { organization_id: reseller_organization_id } = value;
    
                let assignedReseller = await ResellerModel.assignResellerEmployee(req.decoded.employee_id);
                let assignedResellerIds = _.pluck(assignedReseller, 'reseller_organization_id');
                if(!assignedResellerIds.includes(+reseller_organization_id)) return res.json({ code: 404, data: null, message: "Not a valid access", error: null });
    
                const [adminData] = await ResellerModel.getResellerClientOrganizationId(reseller_organization_id);
                if (!adminData) return res.status(400).json({ code: 400, error: null, message: 'No User with the given user name or removed.', data: null });   
                let {
                    first_name, last_name, email,
                    address, phone, product_id, begin_date,
                    expire_date, timezone, username, reseller_id
                } = adminData;
                // if(reseller_id !== getResellerDetails?.reseller_id)  return res.status(400).json({ code: 404, data: null, message: "No valid user found.", error: null });
                // restrict user login package expired
                let now = moment().format("YYYY-MM-DD");
                let expire_time = moment(new Date(expire_date)).format("YYYY-MM-DD");
                if (!(now <= expire_time)) return res.status(400).json({ code: 400, data: null, message: 'Access Denied Due To Package Expired.', error: 'Expired' });
    
                let setting = JSON.parse(adminData.rules);
                const productive_hours = setting.productiveHours ? (setting.productiveHours.mode == 'unlimited' ? 0 : Common.hourToSeconds(setting.productiveHours.hour)) : 0;
                const adminJsonData = {
                    organization_id: adminData.organization_id,
                    user_id: adminData.id,
                    first_name: first_name, last_name: last_name,
                    username: username, email: email, contact_number: phone, address: address,
                    product_id: product_id, begin_date: begin_date,
                    expire_date: expire_date, is_manager: false, is_teamlead: false, is_client: true,
                    is_employee: false, is_admin: true, language: adminData.language, weekday_start: adminData.weekday_start,
                    timezone: adminData.timezone ? adminData.timezone : timezone, productive_hours,
                    productivity_data: setting.productiveHours
                };
    
                const payload = { user_id: adminJsonData.user_id };
                await redis.setAsync(adminJsonData.user_id, JSON.stringify({ ...adminJsonData, permissionData: Array.from(Array(25).keys()).map(item => item + 1) }), 'EX', Common.getTime(req.body?.expiryDays || process.env.JWT_EXPIRY));
                // await redis.setUserMetaData(adminJsonData.user_id, { ...adminJsonData, permissionData: Array.from(Array(25).keys()).map(item => item + 1) });
    
                const feature = await authModel.dashboardFeature();
                let accessToken;
                if (req.body?.expiryDays) accessToken = await jwtService.generateTokenWithCustomExpiryDays(payload, req.body?.expiryDays || '90d');
                else accessToken = await jwtService.generateAccessToken(payload);
                actionsTracker(req, 'Admin user %i logged in successfully.', [adminJsonData.user_id]);
                let pre_expire = moment(new Date(expire_date)).subtract(5, 'days').format("YYYY-MM-DD")
                let is_expire = moment(now).isBetween(new Date(pre_expire), new Date(expire_date), null, '[]');
                let feedback = is_expire ? 0 : 3;
    
                if (is_expire) {
                    const feedbackData = await authModel.getFeedback(pre_expire, expire_date, adminJsonData.organization_id,)
                    let skip;
                    let rated;
                    if (feedbackData && feedbackData.length !== 0) {
                        skip = feedbackData.find(i => {
                            return i.rated_at == now && i.status == 1
                        })
                        rated = feedbackData.find(i => {
                            return i.question_id != 0 && i.status == 0
                        })
                        if (rated && rated.length !== 0) {
                            feedback = 1;
                        } else if (skip && skip.length !== 0) {
                            feedback = 2;
                        }
                    }
                }
                return res.status(200).json({
                    code: 200,
                    data: accessToken,
                    username: adminJsonData.username,
                    email: adminJsonData.email,
                    is_admin: adminJsonData.is_admin,
                    is_client: adminJsonData.is_client,
                    is_manager: adminJsonData.is_manager,
                    is_teamlead: adminJsonData.is_teamlead,
                    is_employee: adminJsonData.is_employee,
                    organization_id: adminJsonData.organization_id,
                    user_id: adminData.id,
                    expire_date,
                    feature: feature,
                    role: 'Admin',
                    language: adminData.language,
                    weekday_start: adminData.weekday_start,
                    feedback,
                    message: 'token',
                    error: null
                });
            }
            catch (error) {
                console.log(error);
                return res.status(400).json({ code: 400, error: 'Error in auth', message: error.message, data: null, });
            }
    }
}

module.exports.ResellerController = ResellerController;