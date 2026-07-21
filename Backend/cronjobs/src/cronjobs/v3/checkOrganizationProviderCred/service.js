const { Mailer } = require('./../../../messages/Mailer');
const getHtmlTemplate = require('./template');
const S3Utils = require(`../checkScreensAge/utils/s3.utils`);
const GDUtils = require(`../checkScreensAge/utils/googleDrive.utils`);
const ODUtils = require(`../checkScreensAge/utils/oneDrive.utils`);
const ZohoUtils = require(`../checkScreensAge/utils/zohoWorkDrive.utils`);
const FTPUtils = require(`../checkScreensAge/utils/FTP.ustils`);
const SFTPUtils = require(`../checkScreensAge/utils/sftp.utils`);

const ConfigFile = require('../../../../../config/config');

const checkStorages = {
    S3: (creds) => S3Utils.checkS3CorsPolicy(creds),
    GD: (creds) => GDUtils.checkAccess(creds),
    MO: (creds) => ODUtils.checkAccess(creds),
    ZH: (creds) => ZohoUtils.checkAccess(creds),
    FTP: (creds) => FTPUtils.checkAccess(creds),
    SFTP: (creds) => SFTPUtils.checkAccess(creds),
}

class Service {
    checkAccessToStorage(type, creds) {
        return checkStorages[type](creds);
    }

    sendMail(email, resellerData) {
        // resellerData = resellerData ? JSON.parse(resellerData?.details): null;
        // let empAdminEmail = process.env.EMP_ADMIN_EMAIL;
        // if (resellerData) {
        //     if (resellerData && resellerData.admin_email && resellerData.admin_email !== 'null') empAdminEmail = resellerData.admin_email;
        // }
        // return Mailer.sendMail({
        //     from: empAdminEmail,
        //     to: email,
        //     bcc: ConfigFile.AUTO_EMAIL_REPORT_BCC,
        //     subject: 'Regards storage credentials expiry.',
        //     text: 'Regards storage credentials expiry.',
        //     html: getHtmlTemplate({ resellerData: resellerData }),
        // });
    }
}

module.exports = new Service;