const qs = require('querystring');
const OneDriveAPI = require("one-drive-api-pools");

const ODApi = new OneDriveAPI();
const axios = require('axios');
const _ = require('underscore');
const { getParam } = require('../checkScreensAge.helper');
const _lodash = require('lodash');

const maxFileSize = 4_000_000; // 4mb
const { createReadStream, statSync } = require("fs");
const baseUrl = 'https://graph.microsoft.com/v1.0/me/drive/items/';

const { logger: Logger } = require('../../../../utils/Logger');
class OneDrive {
	async initConection(creds) {
		const body = {
			client_id: creds.onedrive_client_id,
			redirect_uri: creds.onedrive_redirect_url,
			client_secret: creds.onedrive_client_secret,
			refresh_token: creds.onedrive_refresh_token,
			grant_type: 'refresh_token',
		};

		const fetchParams = {
			method: 'POST',
			url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			data: qs.stringify(body),
		};
		const { data } = await axios(fetchParams);

		return data.access_token;
	}
	async initConectionforUpload({
		onedrive_client_id,
		onedrive_client_secret,
		onedrive_redirect_url,
		onedrive_refresh_token,
	}) {
		const creds = {
			client_id: onedrive_client_id,
			client_secret: onedrive_client_secret,
			redirect_uri: onedrive_redirect_url,
			refresh_token: onedrive_refresh_token,
		};
		const haveConnect = ODApi.checkCreds(onedrive_client_id);
		if (!haveConnect) {
			await ODApi.addConection(onedrive_client_id, creds);
		}

		return onedrive_client_id;
	}
	async getMainFolderId(accessToken, mainFolderName) {
		return this.getFolderIdByName({
			accessToken,
			folderName: mainFolderName,
			parentId: 'root',
		});
	}

	async getUsersFolders(accessToken, mainFolderId, ssLastDate) {
		return this.getFoldersIdByParentId({
			parentId: mainFolderId,
			drive: accessToken,
			lastDate: ssLastDate,
		});
	}

	async getFolderIdByName({ accessToken, folderName, parentId }) {
		const fetchParams = {
			method: 'GET',
			url: `${baseUrl}${parentId}/children?$select=id&$filter=name eq '${folderName}'`,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		};

		const { data } = await axios(fetchParams);

		return getParam(data.value)('id');
	}

	async getFoldersIdByParentId({ parentId, drive, lastDate }) {
		let foldersIds;
		const accessToken = drive;
		const query = lastDate
			? `&$filter=createdDateTime le ${lastDate.toISOString()}`
			: '';

		const fetchParams = {
			method: 'GET',
			url: `${baseUrl}${parentId}/children?$select=id,createdDateTime`,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		};
		const { data } = await axios(fetchParams);
		if (lastDate) {
			data.value = data.value.filter(x => x.createdDateTime < lastDate.toISOString())
		}
		foldersIds = data.value.map((object) => object.id);
		if (data['@odata.nextLink']) {
			const nextData = await this.reqByUrl(
				data['@odata.nextLink'],
				accessToken,
			);
			foldersIds = [...foldersIds, ...nextData];
		}

		return foldersIds;
	}

	async removeFile(fileId, accessToken) {
		const fetchParams = {
			method: 'DELETE',
			url: `${baseUrl}${fileId}`,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		};
		await axios(fetchParams);
	}

	async checkEmptyAndDelete(accessToken, fileId) {
		const fetchParams = {
			method: 'GET',
			url: `${baseUrl}${fileId}/children?$select=id`,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		};

		const { data } = await axios(fetchParams);
		if (_.isEmpty(data.value)) {
			await this.removeFile(fileId, accessToken);
		}
	}

	async checkMainFolder(accessToken, id) {
		await this.checkEmptyAndDelete(accessToken, id);
	}

	async reqByUrl(url, accessToken) {
		let foldersIds;
		const fetchParams = {
			method: 'GET',
			url,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		};

		const { data } = await axios(fetchParams);
		foldersIds = data.value.map((object) => object.id);
		if (data['@odata.nextLink']) {
			const nextData = this.reqByUrl(data['@odata.nextLink'], accessToken);
			foldersIds = [...foldersIds, ...nextData.value];
		}

		return foldersIds;
	}


	async _getFolderIdByLink(pool, url) {
		const data = await ODApi.items.getByLink(pool, { url });

		if (_.isEmpty(data.value) && data["@odata.nextLink"]) {
			return this._getFolderIdByLink(pool, data["@odata.nextLink"]);
		}

		return _.get(data, "value[0].id");
	}

	async _getFolderId({ pool, folderName, itemId }) {
		const query = encodeURI(`?$select=id&$filter=name eq '${folderName}'`);

		const data = await ODApi.items.listChildren(pool, { itemId, query });
		if (_.isEmpty(data.value) && data["@odata.nextLink"]) {
			return this._getFolderIdByLink(pool, data["@odata.nextLink"]);
		}

		return _lodash.get(data, "value[0].id");
	}

	async _createFolder({ pool, folderName, itemId }) {
		const folder = await ODApi.items.createFolder(pool, {
			rootItemId: itemId,
			name: folderName,
		});

		return folder.id;
	}

	async findOrCreateFolder(creds) {
		const folderId = await this._getFolderId(creds);
		if (folderId) return folderId;

		return this._createFolder(creds);
	}


	uploadReportZip({ pool, size, parentId, path, name }) {
		const content = createReadStream(path);
		if (size < maxFileSize) {
			return ODApi.items.uploadSimple(pool, {
				parentId,
				readableStream: content,
				filename: name,
			});
		}
		var file = statSync(path);
		return ODApi.items.uploadSession(pool, {
			parentId,
			readableStream: content,
			fileSize: file.size,
			filename: name,
		});
	}

	async uploadReport(folderName, { fileName, mimetype, size, path }, creds) {
		try {
			const pool = await this.initConectionforUpload(creds);
			const parentId = await this.findOrCreateFolder({
				pool,
				folderName,
				itemId: "root",
			});
			path = `${path}/${fileName}`;
			const name = fileName;
			const { webUrl, id } = await this.uploadReportZip({
				pool,
				size,
				parentId,
				path,
				name,
			});

			return webUrl;

		} catch (error) {
			Logger.error(`Uploading report ------${err.message}-----${err}'-------`);
		}
	}

	async checkAccess({ onedrive_client_id, onedrive_client_secret, onedrive_redirect_url, onedrive_refresh_token }) {
		const creds = { client_id: onedrive_client_id, client_secret: onedrive_client_secret, redirect_uri: onedrive_redirect_url, refresh_token: onedrive_refresh_token, };

		const pool = `$${onedrive_client_id}-${_lodash.now()}`;
		await ODApi.addConection(pool, creds);
		await ODApi.items.listChildren(pool, { itemId: "root" });
	}

	async checkListFolders({ parentId, drive, lastDate }) {
		if (!lastDate) return false;

		const response = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children?$filter=folder ne null`, {
			headers: {
				Authorization: `Bearer ${drive}`
			}
		});

		const childrenFolders = response.data.value;
		for (const folder of childrenFolders) {
			const folderDate = folder.name;
			if (folderDate == lastDate.format("YYYY-MM-DD")) {
				await axios.delete(`https://graph.microsoft.com/v1.0/me/drive/items/${folder.id}`, {
					headers: {
						Authorization: `Bearer ${drive}`
					}
				});

				console.log(`Folder ${folder.name} deleted successfully.`);
				break; // Assuming there is only one matching folder
			}
		}
	}

	async initPoolConnect(creds) {
		const haveConnect = ODApi.checkCreds(creds.onedrive_client_id);
		if (!haveConnect) {
			await ODApi.addConection(creds.onedrive_client_id, {
				client_id: creds.onedrive_client_id,
				client_secret: creds.onedrive_client_secret,
				redirect_uri: creds.onedrive_redirect_url,
				refresh_token: creds.onedrive_refresh_token,
			});
			return creds.onedrive_client_id;
		}
		return creds.onedrive_client_id;
	}

	async getDriveMainFolderId (pool, mainFolderName) {
		let parentFolderData = await this.getUsersFolderList(pool, 'root');
		parentFolderData = parentFolderData.find(i => i.name === mainFolderName);
		return parentFolderData.id;
	}

	async getUsersFolderList(pool, itemId) {
		let condition = true;
		let nextToken = "";
		let accountData = {
			value: [],
		}

		while (condition) {
			let apiConfig = {
				itemId,
				query: '',
			}
			if (nextToken) apiConfig.query = nextToken;
			let tempResponse = await ODApi.items.listChildren(pool, apiConfig);

			if (tempResponse['@odata.count'] !== tempResponse.value.length && tempResponse['@odata.nextLink']) {
				nextToken = `?${tempResponse['@odata.nextLink']?.split('?')[1]}`;
				accountData.value = [...accountData.value, ...tempResponse['value']]
			} else if (accountData.value.length == 0) {
				accountData = tempResponse;
				condition = false;
			} else if (accountData.value.length) {
				accountData.value = [...accountData.value, ...tempResponse['value']];
				condition = false;
				nextToken = "";
			}
		}

		return accountData.value;
	}

	async deleteFolder(pool, folderId) {
		let apiConfig = {
			itemId: folderId,
			query: '',
		}
		await ODApi.items.delete(pool, apiConfig);
	}
}

module.exports = new OneDrive();
