const ftp = require('basic-ftp');
const PromiseFtp = require('promise-ftp');

class FTPUtils {
	/**get ftp client*/
	initConection(creds) {
		const client = this.createClient();
		// client.ftp.verbose = true;
		return this.access(client, creds);
	}

	createClient() {
		return new ftp.Client(600_000); // ten minutes
	}

	async access(client, { username, password, host, port }) {
		const getOptions = (options) => ({
			host,
			port,
			password,
			user: username,
			...options,
		});

		try {
			const options = getOptions({
				secure: true,
			});
			await client.access(options);
		} catch (error) {
			console.log('err', error)
			const options = getOptions({
				secure: true,
				secureOptions: {
					rejectUnauthorized: false,
				},
			});
			console.log('options', options)

			await client.access(options);
		}

		return client;
	}

	async initConectionForPromiseFtp({ username, password, host, port }) {
		const client = new PromiseFtp();
		await client.connect({
			host: host,
			port,
			user: username,
			password: password,
			secure: true,
			secureOptions: { rejectUnauthorized: false },
			autoReconnect: true,
		});
		return client;
	}
}

module.exports = new FTPUtils();
