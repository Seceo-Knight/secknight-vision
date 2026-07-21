const jwt = require('jsonwebtoken');
const FtpReducer = require('./connectReducer');
const InvalidStorageError = require('./errors/InvalidStorageError');

class FtpHttpProxyService {
	decodeStoreData(store) {
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
	initConnection(store) {
		const creds = this.decodeStoreData(store);

		return FtpReducer.getClient(creds, 1);
	}
}

module.exports = new FtpHttpProxyService();
