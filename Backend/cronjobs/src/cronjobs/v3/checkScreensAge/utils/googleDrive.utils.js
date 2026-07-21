const { google } = require('googleapis');
const { isEmpty } = require('underscore');
const fs = require('fs');

const { getParam } = require('../checkScreensAge.helper');

const _ = require('lodash');

class GoogleDrive {
	initConection({ client_id, client_secret, refresh_token }) {
		const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
		oauth2Client.setCredentials({ access_token: '', refresh_token });
		google.options({ auth: oauth2Client });

		return google.drive({ version: 'v3', auth: oauth2Client });
	}

	getUsersFolders(drive, parentId, lastDate) {
		return this.getFoldersIdByParentId({
			parentId,
			drive,
			lastDate,
		});
	}

	async getMainFolderId(drive, name) {
		const { data } = await drive.files.list({
			pageSize: 1000,
			q: `name='${name}'`,
			pageToken: '',
			fields: 'nextPageToken, files(id)',
		});

		return getParam(data.files)('id');
	}

	parseQuery(parentId) {
		return `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`;
	}

	async getFoldersIdByParentId({ parentId, drive, lastDate, pageToken }) {
		lastDate = lastDate.toISOString();
		const simpleQuery = this.parseQuery(parentId);
		const query = lastDate
			? simpleQuery + ` and createdTime <= '${lastDate}'`
			: simpleQuery;

		const { data } = await drive.files.list({
			pageSize: 1000,
			q: query,
			pageToken: pageToken ? pageToken : '',
			fields: 'nextPageToken, files(id)',
		});
		let foldersId = data.files.map((file) => file.id);

		if (data.nextPageToken) {
			const nextPageFoldersId = await this.getFoldersIdByParentId({
				parentId,
				drive,
				lastDate,
				pageToken: data.nextPageToken,
			});
			foldersId = [...foldersId, ...nextPageFoldersId];
		}

		return foldersId;
	}

	removeFile(fileId, drive) {
		return drive.files.delete({ fileId });
	}

	async checkEmptyAndDelete(drive, fileId) {
		const { data } = await drive.files.list({
			q: this.parseQuery(fileId),
			fields: 'files(id)',
		});

		if (isEmpty(data.files)) {
			await drive.files.delete({ fileId });
		}
	}

	async checkMainFolder(drive, fileId) {
		const { data } = await drive.files.list({
			q: this.parseQuery(fileId),
			fields: 'files(id)',
		});

		if (isEmpty(data.files)) {
			await drive.files.delete({ fileId });
		}
	}

	/** Create folder */
	async createFolder(name, drive) {
		const fileMetadata = {
			name: name,
			mimeType: 'application/vnd.google-apps.folder',
		};
		const { data } = await drive.files.create({
			resource: fileMetadata,
			fields: 'id',
		});

		return data.id;
	}

	/** Get folder id by name */
	async getFolderIdByName({ folderName, drive }) {
		const { data } = await drive.files.list({
			pageSize: 1000,
			q: `name='${folderName}'`,
			pageToken: '',
			fields: 'nextPageToken, files(*)',
		});

		return _.get(data, 'files[0].id');
	}


	/** Add share permision */
	addSharePermisionToFile(fileId, drive) {
		return drive.permissions.create({
			fileId,
			resource: { role: 'reader', type: 'anyone' },
		});
	}

	/**Get google drive folder id and if folder absent create it*/
	getOrCreateFolder = async ({ folderName, drive }) => {
		let folderId = await this.getFolderIdByName({ folderName, drive });
		if (folderId) return folderId;

		folderId = await this.createFolder(folderName, drive);
		await this.addSharePermisionToFile(folderId, drive);

		return folderId;
	};

	uploadReportToDrive({ folderId, name, mimeType, drive, path }) {
		try {
			const fileMetadata = { name, parents: [folderId], };
			const content = fs.createReadStream(path + `/${name}`);
			const media = {
				mimeType,
				body: content,
			};

			return drive.files.create({ requestBody: fileMetadata, media: media });
		} catch (error) {

			//Logger.error(`uploadReportToDrive error ------${error.message}-----${error}'-------`);
		}
	}
	/** Get screens by current date */
	async getReports({ drive, folderId, condition, pageToken, limit }) {
		try {
			const query = `(${condition.trim()}) and '${folderId}' in parents and trashed = false`;
			return await drive.files.list({
				pageSize: limit,
				orderBy: 'name',
				q: query,
				pageToken: pageToken ? pageToken : '',
				fields: 'nextPageToken, files(*)',

			});
		} catch (error) {
			//Logger.error(`uploadReportToDrive error ------${error.message}-----${error}'-------`);
		}
	}
	/**Upload screenshot to google drive*/
	async uploadReport(folderName, { fileName: name, mimetype: mimeType, path }, creds) {
		try {
			const port = this.initConection(creds);

			const folderId = await ReqLimiter.reqWithCheck(port, this.getOrCreateFolder, {
				folderName,
			});
			const condition = `name contains '${name}'`;

			await ReqLimiter.reqWithCheck(port, this.uploadReportToDrive, {
				folderId,
				name,
				mimeType,
				path
			});
			const { data } = await ReqLimiter.reqWithCheck(port, this.getReports, {
				folderId,
				condition,
				pageToken: '',
				limit: 1,
			});
			return data.files[0].webContentLink;
		} catch (error) {
			// Logger.error(`upload report main function ------${error.message}-----${error}'-------`);
		}
	}

	checkAccess(creds) {
		const drive = this.initConection(creds);

		return drive.files.list();
	}
}

module.exports = new GoogleDrive();
