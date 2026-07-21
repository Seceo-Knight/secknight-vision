const EventEmitter = require('events').EventEmitter;
const authModel = require('../auth.model');
const redisService = require('./redis.service');
const shortnerService = require('./shortner.service');
const axios = require('axios');
const _ = require('underscore');
const Comman = require('../../../../utils/helpers/Common');
const PasswordEncodeDecoder = require('../../../../utils/helpers/PasswordEncoderDecoder');
const { ResellerModel } = require('./../reseller/Reseller.Model');
const { translate } = require('../../../../utils/messageTranslation');
const Mail = require('../../../../utils/helpers/Mail');
const { forgotPasswordMessages, roleUpateMailMessage, resellerMessage } = require('../../../../utils/helpers/LanguageTranslate');

const eventHandler = new EventEmitter();
eventHandler.setMaxListeners(0);

const startBuildProcess = async (encryptedOrgId, mode, version, organization_id, os) => {
    let buildUrl = `${process.env.BUILD_API_URL}${encryptedOrgId}`;
    buildUrl = buildUrl.replace('<<mode>>', mode).replace('<<version>>', version);

    if (os === 'mac-arm') {
        // replace default windows live pipeline name with mac pipeline name
        buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt-Mac-Arm-Auto-Live');
        buildUrl = buildUrl.replace("service.empmonitor.com", "https://service.empmonitor.com")
    }
    else if (os === 'mac-intel') {
        // replace default windows live pipeline name with mac pipeline name
        buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt-Mac-Auto-Live');
        buildUrl = buildUrl.replace("service.empmonitor.com", "https://service.empmonitor.com")
    }
    else if (os === 'linux') {
        // replace default windows pipeline name with linux pipeline name
        buildUrl = buildUrl.replace('Qt_Windows-Live', 'Qt-Linux-Auto-Live');
        buildUrl = buildUrl.replace("service.empmonitor.com", "https://service.empmonitor.com")
    }
    else buildUrl = buildUrl;
    // Make api call
    const jenkinsAxios = axios.create({
        baseURL: process.env.JENKINS_URL,
        auth: {
            username: process.env.JENKINS_AUTH_USERNAME,
            password: process.env.JENKINS_AUTH_PASSWORD
        }
    });

    const crumbIssuer = await jenkinsAxios.get('/crumbIssuer/api/json');
    await jenkinsAxios.post(`${buildUrl.split(`${process.env.JENKINS_URL}`)[1]}`, {}, {
        headers: {
            'Content-Type': 'application/xml',
            [crumbIssuer.data.crumbRequestField]: crumbIssuer.data.crumb,
            Cookie: crumbIssuer.headers['set-cookie'][0]
        }
    }
    )
        .then(data => {
            if (data && data.status === 201) {
                console.log(`--success-in build--organization_id = "${organization_id}" and encrypted_key = "${encryptedOrgId}" and OS = "${os}"`);
                console.log(data.status, '-', data.config.url);
            } else {
                console.log(`--error-(then)-in build--organization_id = "${organization_id}" and encrypted_key = "${encryptedOrgId}" and OS = "${os}"`);
                console.log(data.status, '-', data.config.url);
            }
        })
        .catch(error => {
            console.log(`--error-(catch)-in build--organization_id = "${organization_id}" and encrypted_key = "${encryptedOrgId}" and OS = "${os}"`);
            console.log(error.response.status, '-', error.response.config.url, '-', error.response.data);
        });

};

eventHandler.on('update-employee-redis-data-by-employee_id', async employee_id => {
    if (!employee_id) return console.log('No employee_id provided.');

    let is_manager = false, is_teamlead = false, is_employee = false, is_admin = false;

    const [user] = await authModel.userById_UserData(employee_id);

    if (!user) return console.log('Invalid User - NO employee with this employee_id', 401);

    let setting = JSON.parse(user.custom_tracking_rule);
    const shift = user.shift ? JSON.parse(user.shift) : '';
    delete user.password;
    delete user.custom_tracking_rule;

    if (setting.system.visibility) {
        setting.announcemnts = await authModel.getAnnouncement({ organizationId: user.organization_id, userId: user.user_id });
    }
    setting.roomId = user.room_id;
    if (user.photo_path === "/default/profilePic/user.png") {
        let photo_path = "https:/" + process.env.API_URL_DEV + 'default/profilePic/user.png';
        if (process.env.NODE_ENV === 'production') {
            photo_path = "https:/" + process.env.API_URL_PRODUCTION + 'default/profilePic/user.png'
        }
        user.photo_path = photo_path;
    }

    if (user.role && user.role.toLowerCase() === 'manager') is_manager = true;
    else if (user.role && user.role.toLowerCase() === 'employee') is_employee = true;
    else if (user.role && user.role.toLowerCase() === 'team lead') is_teamlead = true;
    else if (user.role && user.role.toLowerCase() === 'admin') is_admin = true;
    let roleData = { is_admin, is_manager, is_employee, is_teamlead };

    let permissionData = await authModel.userPermission(user.role_id, user.organization_id);
    if (permissionData.length > 0) {
        permissionData = _.pluck(permissionData, 'permission_id');
    }
    const productivityCategory = user.productivityCategory ? user.productivityCategory : 0;
    const productive_setting = user.productive_hours ? JSON.parse(user.productive_hours) : null;
    const productive_hours = productive_setting ? (productive_setting.mode == 'unlimited' ? 0 : Comman.hourToSeconds(productive_setting.hour)) : 0;
    await redisService.setAsync(user.user_id, JSON.stringify({ ...user, roomId: user.room_id, ...roleData, permissionData, setting, shift, productive_hours, productivity_data: productive_setting, productivityCategory }), 'EX', Comman.getTime(process.env.JWT_EXPIRY));
    // await redisService.setUserMetaData(user.user_id, { ...user, ...roleData, permissionData, setting, shift, productive_hours, productivity_data: productive_setting });
});


eventHandler.on('organization-created', async organization_id => {
    // Create encrypted key based or org Id
    const encryptedOrgId = shortnerService.shorten(+process.env.SHORTNER_DEFAULT_ADDED_VALUE + organization_id);

    const appInfos = await authModel.getInfo();
    let winVersion, macVersion, linuxVersion;

    for (let i = 0; i < appInfos.length; i += 2) {
        if (appInfos[i].operating_system === 'Windows') {
            winVersion = appInfos[i].c_version;
        } else if (appInfos[i].operating_system === 'Mac') {
            macVersion = appInfos[i].c_version;
        } else {
            linuxVersion = appInfos[i].c_version;
        }
    }

    // Windows BUILD API CALL
    await startBuildProcess(encryptedOrgId, 'personal', winVersion, organization_id, "windows");
    await startBuildProcess(encryptedOrgId, 'office', winVersion, organization_id, "windows");
    // MAC ARM BUILD API CALL
    await startBuildProcess(encryptedOrgId, 'personal', macVersion, organization_id, "mac-arm");
    await startBuildProcess(encryptedOrgId, 'office', macVersion, organization_id, "mac-arm");
    // MAC INTEL BUILD API CALL
    await startBuildProcess(encryptedOrgId, 'personal', macVersion, organization_id, "mac-intel");
    await startBuildProcess(encryptedOrgId, 'office', macVersion, organization_id, "mac-intel");
    // Linux BUILD API CALL
    await startBuildProcess(encryptedOrgId, 'personal', linuxVersion, organization_id, "linux");
    await startBuildProcess(encryptedOrgId, 'office', linuxVersion, organization_id, "linux");
});

// event to send org register mail
eventHandler.on('organization-register-mail', async ({ organization_id, email, password, first_name, username, language, is_client }) => {
    email = email.toLowerCase();
    let logo, facebook, copyright_year, twitter, skype_email, brand_name, support_mail, reseller, admin_email, facebookHide, footerHide, twitterHide;

    const decriptedPass = await PasswordEncodeDecoder.decryptText(password, process.env.CRYPTO_PASSWORD);

    /** gettting reseller details */
    const [resellerDetails] = await ResellerModel.getResellerDetails(organization_id);
    reseller = resellerDetails.details;
    reseller = reseller ? JSON.parse(reseller) : reseller;
    logo = reseller ? (reseller.logo || process.env.EMPLOGO) : process.env.EMPLOGO
    facebook = reseller ? (getResellerData(reseller, "facebook") || null) : process.env.FACEBOOK;
    copyright_year = reseller ? (reseller.copyright_year || process.env.COPYRIGHT_YEAR) : process.env.COPYRIGHT_YEAR
    twitter = reseller ? (getResellerData(reseller, "twitter") || null) : process.env.TWITTER;
    skype_email = reseller ? (getResellerData(reseller, "skype_email") || null) : process.env.SKYPE_EMAIL;
    brand_name = reseller ? (reseller.brand_name || process.env.BRAND_NAME) : process.env.BRAND_NAME;
    support_mail = reseller ? (getResellerData(reseller, "support_mail") || null) : process.env.SUPPORT_EMAIL;
    admin_email = reseller ? (reseller.admin_email || process.env.EMP_SUPPORT_EMAIL) : process.env.EMP_SUPPORT_EMAIL
    facebookHide = facebook ? "" : "hidden";
    twitterHide = twitter ? "" : "hidden";
    footerHide = twitter || facebook ? "" : "hidden"
    findMoreLink = reseller ? reseller.domain : findMoreLink;

    //adding client login prefix with domain
    if (
        process.env.RESELLER_CLIENT_LOGIN_PREFIX &&
        process.env.RESELLER_CLIENT_LOGIN_PREFIX.length &&
        process.env.RESELLER_CLIENT_LOGIN_PREFIX != ''
    ) {
        findMoreLink = `${findMoreLink}${process.env.RESELLER_CLIENT_LOGIN_PREFIX}`;
    }

    // template message and subject for the mail
    let templateMessage = forgotPasswordMessages[language || "en"];
    delete templateMessage["message"]
    delete templateMessage["subject"]
    let { subject, ...mailMessage } = roleUpateMailMessage[language || "en"]
    subject = translate(resellerMessage, "CLIENT_REGISTER_SUBJECT", language).replace("{{brandName}}", brand_name);

    Mail.sendEMail({
        footerHide, facebookHide, twitterHide, logo,
        facebook, copyright_year, twitter, skype_email,
        brand_name, support_mail,
        admin_email, ...mailMessage, subject, findMoreLink,
        email, name: first_name, password: decriptedPass, role: 'M', username, is_client
    })
        .then(() => console.log('-----mail----send-----'))
        .catch(e => console.log('client register err', e));
});

/**
 * getResellerData
 * @description function to get the Reseller data
 * @param {*} resellerDataObj 
 * @param {*} nodeName 
 */
function getResellerData(resellerDataObj, nodeName) {
    if (
        resellerDataObj &&
        resellerDataObj[nodeName] &&
        resellerDataObj[nodeName].length &&
        resellerDataObj[nodeName] != 'null'

    ) {
        return resellerDataObj[nodeName];
    }
    return null;
}

module.exports = eventHandler;