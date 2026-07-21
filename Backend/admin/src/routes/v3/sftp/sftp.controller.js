const SFTP_Model = require('./sftp.model')
const jwt = require('jsonwebtoken');

const { logger: Logger } = require(`${loggerFolder}/Logger`);
const { sendResponse } = require(`${utilsFolder}/myService`);

const FtpHttpProxyValidation = require('../ftpHttpProxy/ftpHttpProxy.validation');
const InvalidStorageError = require('../ftpHttpProxy/errors/InvalidStorageError');


class SFTP_Controller {
    static async getFileFromFtp(req, res, next) {
        let organization_id = '';
        try {
			const { store, path } = await FtpHttpProxyValidation.validateQuery(
				req.query,
			);
            let decodedClient = decodeStoreData(store)
			// const client = await FtpHttpProxyService.initConnection(store);
            organization_id = decodedClient.organization_id;
            await SFTP_Model.initConnection(decodedClient, decodedClient.organization_id)
			await SFTP_Model.download(req, res, path);
            // return res.json({ store, path, decodedClient})
		} catch (error) {
            SFTP_Model.deleteCreds(organization_id);
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

module.exports = SFTP_Controller;


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