const WebDAV_Model = require('./webdav.model')
const jwt = require('jsonwebtoken');

const { logger: Logger } = require(`${loggerFolder}/Logger`);
const { sendResponse } = require(`${utilsFolder}/myService`);

const FtpHttpProxyValidation = require('../ftpHttpProxy/ftpHttpProxy.validation');
const InvalidStorageError = require('../ftpHttpProxy/errors/InvalidStorageError');

class WebDAV_Controller {
    static async getFileFromFtp(req, res, next) {
        let organization_id = '';
        try {
            const { store, path } = await FtpHttpProxyValidation.validateQuery(
                req.query,
            );
            let decodedClient = decodeStoreData(store)
            organization_id = decodedClient.organization_id;
            await WebDAV_Model.initConnection(decodedClient, decodedClient.organization_id)
            await WebDAV_Model.download(req, res, path);
        } catch (error) {
            WebDAV_Model.deleteCreds(organization_id);
            if (error instanceof InvalidStorageError) {
                return sendResponse(res, error.code, null, error.message, null);
            }
            if (error.isJoi) {
                return sendResponse(
                    res,
                    400,
                    null,
                    `${error.name} - ${error.details[0].message}`,
                    null,
                );
            }

            Logger.error(`-V3---error-----${error}------${__filename}----`);
            return sendResponse(res, 500, null, 'Failed to get file', error);
        }
    }
}

module.exports = WebDAV_Controller;


function decodeStoreData(store) {
    try {
        const { creds } = jwt.verify(store, process.env.FTP_HTTP_PROXY_KEY);

        return creds;
    } catch (error) {
        const options = InvalidStorageError.getOptions(
            error.name === 'TokenExpiredError',
        );
        throw new InvalidStorageError(options);
    }
}