const _ = require('lodash');
const utils = require('util');

const OrganizationModel = require('./organization.model');
const sendResponse = require('../../../utils/myService').sendResponse;
const joiValidation = require('./organization.validation')
const actionsTracker = require('../services/actionsTracker');
const organizationValidation = require('./organization.validation');
const organizationModel = require('./organization.model');
const EventService = require('../auth/services/event.service');
const { organizationMessages, organizationDetailsMessages } = require("../../../utils/helpers/LanguageTranslate");
const redis = require('../auth/services/redis.service');
const passwordService = require('../auth/services/password.service');
const multer = require('multer');
const fs = require('fs');

const speakeasy = require('speakeasy');
const {QRCodeCanvas} = require('@loskir/styled-qr-code-node');
const configFile = require('../../../../../config/config');
const qrOptions = require("./qrOption.json");

const hourToSeconds = (hours) => {
    const data = hours.split(":");
    return ((+data[0] * 3600) + (+data[1] * 60));
}

// multer setup
const storage = multer.diskStorage({
    destination: __dirname.split('src')[0] + 'public/logo/',
    filename: (req, file, callback) => {
        const { organization_id } = req.decoded;
        callback(null, new Date().getTime() + file.originalname.toLowerCase().split(' ').join('-'));
    },
});
const upload = multer({
    storage,
    fileFilter: (req, file, callback) => {
        if ((file.mimetype).includes('jpeg') || (file.mimetype).includes('png') || (file.mimetype).includes('jpg')) {
            callback(null, true);
        } else {
            callback(null, false);
            return callback(new Error('Only images allowed!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5mb allowed
}).single('file');

// promisify the upload
const fileUpload = utils.promisify(upload);
class OrganizationController {

    async getRoles(req, res) {
        try {
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;
            // let employee_id = req.decoded.employee_id || null;
            let employee_id = null;
            actionsTracker(req, 'Organisation role requested.');
            
            if(configFile?.SHOW_ALL_ROLE_NON_ADMIN?.split(",").includes(`${organization_id}`)){
                const roles = await OrganizationModel.getRoles(organization_id, null);
                return sendResponse(res, 200, roles, organizationMessages.find(x => x.id === "4")[language] || organizationMessages.find(x => x.id === "4")["en"], null);
            }

            if((req.decoded.is_manager || req.decoded.is_teamlead) || configFile?.SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN?.split(",").includes(`${organization_id}`)) {
                const roles = await OrganizationModel.getRoles(organization_id, req.decoded.employee_id);
                return sendResponse(res, 200, roles, organizationMessages.find(x => x.id === "4")[language] || organizationMessages.find(x => x.id === "4")["en"], null);
            }
            
            const roles = await OrganizationModel.getRoles(organization_id, employee_id);
            return sendResponse(res, 200, roles, organizationMessages.find(x => x.id === "4")[language] || organizationMessages.find(x => x.id === "4")["en"], null);
        } catch (err) {
            return sendResponse(res, 400, null, organizationMessages.find(x => x.id === "5")[language] || organizationMessages.find(x => x.id === "5")["en"], err);
        }
    }

    async getOrganizationFeature(req, res) {
        const organization_id = req.decoded.organization_id;
        const group_id = req.query.group_id || 0;
        const language = req.decoded.language;

        actionsTracker(req, 'Organisation feature requested.');
        try {
            let get_feature;
            if (group_id == 0 || group_id == "0") {
                get_feature = await OrganizationModel.getOrganizationFeature(organization_id);
            } else {
                get_feature = await OrganizationModel.getGroupFeature(organization_id, group_id);
            }
            if (get_feature.length > 0) {
                let data = JSON.parse(get_feature[0].rules);
                data.manual_clock_in = data.manual_clock_in ? data.manual_clock_in : 0
                if (data.tracking.projectBased != undefined) {
                    if (data.tracking.projectBased.length > 0) {
                        let projectIdsArray = data.tracking.projectBased;
                        const projectNamesArray = projectIdsArray.length > 0 ? await OrganizationModel.getProjects(projectIdsArray, organization_id) : [];
                        data.tracking.projectBased = projectNamesArray.length ? projectNamesArray : [];
                    }
                }
                /**For agent uninstall passcode*/
                data.agentUninstallCode = data.agentUninstallCode ? passwordService.decrypt(data.agentUninstallCode, process.env.CRYPTO_PASSWORD).decoded : "";
                return sendResponse(res, 200, {
                    data: { feature: data },
                    ack: { true: 1, false: 0 }
                }, 'Fetched', null);
            } else {
                return sendResponse(res, 400, null, organizationMessages.find(x => x.id === "6")[language] || organizationMessages.find(x => x.id === "6")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, organizationMessages.find(x => x.id === "7")[language] || organizationMessages.find(x => x.id === "7")["en"], null);
        }
    }

    /**
     * Updates settings for organization and group settings
     *
     * @function updateSettigFeatures
     * @memberof OrganizationController
     * @param {*} req
     * @param {*} res
     * @return {Promise<Object>} with updated settings or Error.
     */
    async updateSettigFeatures(req, res) {
        const { organization_id: organizationId, user_id, language } = req.decoded;
        let geoLocationArray = []
        const validate = joiValidation.updateSettingFeatures(req.body);
        if (validate.error) return res.json({ code: 404, data: null, message: organizationMessages.find(x => x.id === "2")[language] || organizationMessages.find(x => x.id === "2")["en"], error: validate.error.details[0].message });
        geoLocationArray = validate.value.track_data.tracking.geoLocation

        const trackData = validate.value.track_data;
        geoLocationArray = validate.value.track_data.tracking.geoLocation

        const groupId = validate.value.group_id;
        geoLocationArray = geoLocationArray.filter((location, index, self) =>
            index !== self.findIndex((t) => (
                t.lon === location.lon && t.lat === location.lat
            ))
        )
        if (geoLocationArray.length > 0) return res.json({ code: 400, data: null, message: organizationMessages.find(x => x.id === "20")[language] || settingMessages.find(x => x.id === "20")["en"], error: "Duplicate Locations are not allowed." })

        try {
            let data;
            if (groupId == 0) {
                const [orgSetting] = await OrganizationModel.getOrganizationFeature(organizationId);
                if (!orgSetting) {
                    return sendResponse(res, 400, null, organizationMessages.find(x => x.id === "11")[language] || organizationMessages.find(x => x.id === "11")["en"], null);
                }
                data = JSON.parse(orgSetting.rules);
            } else {
                const [groupSetting] = await OrganizationModel.getGroupFeature(organizationId, groupId);
                if (!groupSetting) {
                    return sendResponse(res, 400, null, organizationMessages.find(x => x.id === "12")[language] || organizationMessages.find(x => x.id === "12")["en"], null);
                }
                data = JSON.parse(groupSetting.rules);
            }
            // data = _.merge(data, trackData);
            let newtrackdata = trackData
            newtrackdata.agentUninstallCode = newtrackdata.agentUninstallCode ? passwordService.encrypt(newtrackdata.agentUninstallCode, process.env.CRYPTO_PASSWORD).encoded : "";
            newtrackdata.pack = data.pack;
            newtrackdata.logoutOptions = data.logoutOptions

            if (newtrackdata.tracking.projectBased) {
                let inputarr = newtrackdata.tracking.projectBased
                let outputarr = []
                inputarr.map(({ id }) => outputarr.push(id))
                newtrackdata.tracking.projectBased = outputarr
            }
            const dataJson = JSON.stringify(newtrackdata);
            const update_feature = groupId == 0 ?
                await OrganizationModel.updateFeature(dataJson, organizationId) :
                await OrganizationModel.updateGroupFeature(dataJson, organizationId, groupId);
            if (update_feature.affectedRows == 0) {
                return sendResponse(res, 400, null, organizationMessages.find(x => x.id === "14")[language] || organizationMessages.find(x => x.id === "14")["en"], 'Nothing get changed');
            }
            else {
                if (groupId == 0) {
                    const productive_hours = trackData.productiveHours ?
                        (trackData.productiveHours.mode == 'unlimited' ? 0 :
                            hourToSeconds(trackData.productiveHours.hour)) : 0;

                    const userMetaData = await redis.getUserMetaData(user_id);
                    userMetaData.data.productive_hours = productive_hours;
                    userMetaData.data.productiveHours = { hour: "00:00", mode: "unlimited" };
                    await redis.setUserMetaData(user_id, userMetaData.data);
                }
            }

            const update_emp_track_rule = groupId == 0 ?
                await OrganizationModel.updateEmpTrackRule(dataJson, organizationId) :
                await OrganizationModel.updateEmpGroupTrackRule(dataJson, organizationId, groupId);

            if (newtrackdata.tracking.projectBased != null && newtrackdata.tracking.projectBased.length > 0) {
                let projectIdsArray = newtrackdata.tracking.projectBased;
                const projectNamesArray = await OrganizationModel.getProjects(projectIdsArray, organizationId);
                newtrackdata.tracking.projectBased = projectNamesArray.length ? projectNamesArray : [];
            }
            /**For agent uninstall passcode*/
            newtrackdata.agentUninstallCode = newtrackdata.agentUninstallCode ? passwordService.decrypt(newtrackdata.agentUninstallCode, process.env.CRYPTO_PASSWORD).decoded : "";

            if (update_emp_track_rule) {
                actionsTracker(req, 'Organisation feature updated.');
                sendResponse(res, 200, newtrackdata, organizationMessages.find(x => x.id === "15")[language] || organizationMessages.find(x => x.id === "15")["en"], null);
            }

            const employees = groupId == 0 ?
                await organizationModel.employees(organizationId) :
                await organizationModel.groupEmployees(organizationId, groupId);
            await Promise.all(employees.map((employee) => {
                return EventService.emit('update-employee-redis-data-by-employee_id', employee.id);
            }));
        } catch (err) {
            console.log(err)
            return sendResponse(res, 400, null, organizationMessages.find(x => x.id === "16")[language] || organizationMessages.find(x => x.id === "16")["en"], err);
        }
    }
    async updateOrgnizationDetails(req, res, next) {
        try {
            const { organization_id, user_id, is_admin } = req.decoded;


            const { timezone, email, language, weekday_start } = await organizationValidation.updateOrgnizationDetails().validateAsync(req.body);
            if (email && is_admin == true) {
                const [user] = await OrganizationModel.getUser(email, user_id);
                if (user) return res.json({ code: 400, data: null, message: organizationMessages.find(x => x.id === "17")[language] || organizationMessages.find(x => x.id === "17")["en"], error: null });

                await OrganizationModel.updateProfileData(user_id, email);
            }
            const [orgDetails] = await organizationModel.getOrgDetails(organization_id);
            await organizationModel.updateOrgnizationDetails(organization_id, timezone, language, weekday_start);
            if (language && language !== orgDetails.language) {
                const userMetaData = await redis.getUserMetaData(user_id);
                userMetaData.data.language = language;
                await redis.setUserMetaData(user_id, userMetaData.data);
            }

            return res.json({ code: 200, data: req.body, message: organizationMessages.find(x => x.id === "18")[language] || organizationMessages.find(x => x.id === "18")["en"], error: null });

        } catch (err) {
            console.log('-----', err);
            next(err);
        }

    }
    async orgDetails(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            const language = req.decoded.language;

            const [orgDetails] = await organizationModel.getOrgDetails(organization_id);
            return res.json({ code: 200, data: orgDetails, error: null, message: organizationMessages.find(x => x.id === "19")[language] || organizationMessages.find(x => x.id === "19")["en"] });
        } catch (err) {
            next(err);
        }

    }

    /**
     * orgGetUploadLogo - function to upload organization logo
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async orgGetUploadLogo(req, res, next) {
        const { organization_id, language } = req.decoded;

        try {
            const [{ logo }] = await organizationModel.getOrgDetails(organization_id);

            if (!logo) {
                return res.json({ code: 404, data: null, error: null, message: organizationDetailsMessages.find(x => x.id === "NO_DATA")[language] || organizationDetailsMessages.find(x => x.id === "NO_DATA")["en"] });

            }
            // link generation of logo
            let apiUrlStr = process.env.NODE_ENV == 'development' ? process.env.API_URL_DEV : process.env.API_URL_PRODUCTION;
            const logoPath = logo.split('/public/')[1];;
            const logoLink = `https://${apiUrlStr}/` + logoPath;

            return res.json({ code: 200, data: logoLink, error: null, message: organizationMessages.find(x => x.id === "19")[language] || organizationMessages.find(x => x.id === "19")["en"] });
        } catch (err) {
            next(err);
        }
    }

    /**
     * orgUploadLogo - function to upload organization logo
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async orgUploadLogo(req, res, next) {
        const { organization_id, language } = req.decoded;
        console.log(multer.limit)

        try {
            // file upload
            await fileUpload(req, res);
            if (req.file == undefined) {
                return res.json({ code: 400, message: 'please upload file.', error: "please upload file.", data: null });
            }

            const [{ logo }] = await organizationModel.getOrgDetails(organization_id);

            // file related variables
            const file = req.file;
            const logoFilePath = file.path;

            // delete the already exists logo of an organization
            if (logo) {
                fs.unlink(logo, err => {
                    if (err) console.log(err);
                    else console.log('----deleted-----')
                });
            }

            // update organization logo details
            await organizationModel.updateLogoPath(logoFilePath, organization_id);

            // link generation of logo
            let apiUrlStr = process.env.NODE_ENV == 'development' ? process.env.API_URL_DEV : process.env.API_URL_PRODUCTION;
            const logoPath = logoFilePath.split('/public/')[1];
            const logoLink = `https://${apiUrlStr}/` + logoPath;

            return res.json({ code: 200, data: logoLink, error: null, message: organizationMessages.find(x => x.id === "19")[language] || organizationMessages.find(x => x.id === "19")["en"] });
        } catch (err) {
            // multer error handle
            if (err instanceof multer.MulterError) {
                if (err.code == 'LIMIT_FILE_SIZE') {
                    return res.json({
                        code: 404, data: null,
                        error: 'File Size is too large. Allowed file size is 5MB',
                        message: organizationMessages.find(x => x.id === "16")[language] || organizationMessages.find(x => x.id === "16")["en"]
                    });
                }
            }
            next(err);
        }
    }

    async updateProductTourStatus (req, res, next) {
        try {
            let { is_admin, organization_id, language} = req.decoded;
            let response = await organizationModel.updateProductTourStatus(organization_id);
            return res.json({ code: 200, data: response, error: null, message: organizationMessages.find(x => x.id === "18")[language] || organizationMessages.find(x => x.id === "18")["en"] });
        }
        catch (err) {
            next(err);
        }
    }

    
    async update2FAStatus(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            let { status, type = 'authenticator', secret } = req.body;
            if (![0, 1, '0', '1'].includes(status)) return res.json({ code: 404, data: null, error: null, message: organizationDetailsMessages.find(x => x.id === "VALIDATION_FAILED")[language] || organizationDetailsMessages.find(x => x.id === "VALIDATION_FAILED")["en"] });
            if (!['authenticator', 'email'].includes(type) && [1, '1'].includes(status)) return res.json({ code: 404, data: null, error: null, message: organizationDetailsMessages.find(x => x.id === "VALIDATION_FAILED")[language] || organizationDetailsMessages.find(x => x.id === "VALIDATION_FAILED")["en"] });

            let mfa_config = {
                type: type,
                secret: secret
            }
            if([0, '0'].includes(status)) mfa_config = {};

            let response = await organizationModel.update2FAStatus(organization_id, status, JSON.stringify(mfa_config));
            return res.json({ code: 200, data: response, error: null, message: organizationMessages.find(x => x.id === "18")[language] || organizationMessages.find(x => x.id === "18")["en"] });
        } catch (error) {
            next(error);
        }
    }

    async get2FAStatus(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            let response = await organizationModel.get2FAStatus(organization_id);
            response.mfa_config = response.mfa_config ? JSON.parse(response.mfa_config) : null;
            return res.json({ code: 200, data: response, error: null, message: organizationMessages.find(x => x.id === "18")[language] || organizationMessages.find(x => x.id === "18")["en"] });
        } catch (error) {
            next(error);
        }
    }

    async getMFAConfig(req, res, next) {
        try {
            let { organization_id, language, email } = req.decoded;
            let mfaSecret = speakeasy.generateSecret({
                name: `EmpMonitor: ${email}`,
            });
            qrOptions.data = mfaSecret.otpauth_url;
            const qrCode = new QRCodeCanvas(qrOptions);
            let base64URl = await qrCode.toDataUrl();
            return res.json({ code: 200, data: { qrCode: base64URl, secret: mfaSecret.base32 }, error: null, message: organizationMessages.find(x => x.id === "18")[language] || organizationMessages.find(x => x.id === "18")["en"] });
        } catch (error) {
            next(error);
        }
    }

    async verifyMFA(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;
            const { otp, secret } = await organizationValidation.verifyMFA(req.body);
            const verified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: otp,
                window: 0
            });
            return res.json({ code: 200, data: { verified }, error: null, message: organizationMessages.find(x => x.id === "19")[language] || organizationMessages.find(x => x.id === "19")["en"] });
        }
        catch (error) {
            next(error);
        }
    }
    
}
const updateRedis = async (organizationId, groupId) => {
    const employees = groupId == 0 ?
        await organizationModel.employees(organizationId) :
        await organizationModel.groupEmployees(organizationId, groupId);
    await Promise.all(employees.map((employee) => {
        return EventService.emit('update-employee-redis-data-by-employee_id', employee.id);
    }));
};
const updateCustomSettingsRedis = async (employee_id) => {
    return EventService.emit('update-employee-redis-data-by-employee_id', employee_id);
};


module.exports = new OrganizationController;

// (async () => {
//     const employees = await organizationModel.employees(1);
//     console.log('-----------', employees);
//     let i = employees.length;
//     while (i > 0) {
//         i--;
//         EventService.emit('update-employee-redis-data-by-employee_id', employees[i].id);
//         // await new Promise((resolve) => setTimeout(resolve, 1000));
//     }
// })()