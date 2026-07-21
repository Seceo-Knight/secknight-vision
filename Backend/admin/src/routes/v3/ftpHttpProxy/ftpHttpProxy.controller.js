const { logger: Logger } = require(`${loggerFolder}/Logger`);
const { sendResponse } = require(`${utilsFolder}/myService`);
const FtpHttpProxyService = require('./ftpHttpProxy.service');
const FtpHttpProxyValidation = require('./ftpHttpProxy.validation');
const InvalidStorageError = require('./errors/InvalidStorageError');

class FtpHttpProxy {
	async getFileFromFtp(req, res) {
		try {
			const { store, path } = await FtpHttpProxyValidation.validateQuery(
				req.query,
			);

			const client = await FtpHttpProxyService.initConnection(store);
			await client.download(res, path);
		} catch (error) {
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

module.exports = new FtpHttpProxy();
