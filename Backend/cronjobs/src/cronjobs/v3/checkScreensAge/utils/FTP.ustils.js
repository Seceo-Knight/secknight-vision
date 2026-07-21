const ftp = require('basic-ftp');
const { isEmpty } = require('underscore');

const { checkExpireDate, getTZOffset } = require('../checkScreensAge.helper');

class FTP {
	async initConection({ username, password, host, port, ftp_path }) {
		const client = new ftp.Client();
		// client.ftp.verbose = true;
		const getOptions = (options) => ({
			host,
			port,
			password,
			user: username,
			secure: true,
			...options,
		});
		try {
			const options = getOptions({
				secure: false,
			});
			await client.access(options);
		} catch (error) {
			const options = getOptions({
				secure: true,
				secureOptions: {
					rejectUnauthorized: false,
				},
			});
			await client.access(options);
		}

		return { client, ftp_path };
	}

	async getMainFolderId({ client, ftp_path }, mainFolderName) {
		const first = ftp_path === '/' ? '' : '/';
		const data = await client.list(ftp_path);
		const folder = data.find((file) => file.name === mainFolderName);

		return folder ? `${first}${ftp_path}${mainFolderName}` : null;
	}

	async getUsersFolders({ client }, mainPath) {
		const data = await client.list(mainPath);

		if (isEmpty(data)) return null;

		return data.map(({ name }) => {
			return {
				mainPath,
				name,
			};
		});
	}

	async getFoldersIdByParentId({
		drive,
		parentId: parentPath,
		lastDate,
		timezone,
	}) {
		const path = `${parentPath.mainPath}/${parentPath.name}`;
		const { client } = drive;
		await client.cd(path);
		const data = await client.list();
		const tzOffset = getTZOffset(timezone, lastDate);
		if (tzOffset >= 0) {
			lastDate.add(1, 'days');
		}

		return data.reduce((acc, file) => {
			const isExpiryDay = checkExpireDate(file.name, lastDate);
			if (isExpiryDay) {
				acc.push(file.name);
			}

			return acc;
		}, []);
	}

	async removeFile(folderPath, { client }) {
		return await client.removeDir(folderPath);
	}

	async checkEmptyAndDelete({ client }, { mainPath, name }) {
		const data = await client.list();
		if (isEmpty(data)) {
			await client.cd('../');
			await client.removeDir(`${mainPath}/${name}`);
		}
	}

	async checkMainFolder({ client }, folderPath) {
		await client.cd(folderPath);
		const data = await client.list();

		if (isEmpty(data)) {
			await client.cd('../');
			await client.removeDir(folderPath);
		}
	}

	checkAccess(creds) {
		const client = this.createClient();
		return this.access(client, creds);
	}
}

module.exports = new FTP();
