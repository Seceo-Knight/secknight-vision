const ZWDApi = require('zoho-wd-pools');
const _ = require('underscore');
const _lodash = require('lodash');
const fs = require('fs');

const CheckScreensAgeHelper = require('../checkScreensAge.helper');

const Api = new ZWDApi();
const zObjPaths = {
	name: 'attributes.name',
	ws: '[0].relationships.workspaces.links.related',
	folders: 'relationships.folders.links.related',
	files: 'relationships.files.links.related',
	resourceId: '[0].attributes.resource_id',
	customData: '[0].attributes.custom_data',
	linkName: 'attributes.link_name',
};
class ZohoWorkDrive {
	async initConection({
		team_id,
		zoho_client_id,
		zoho_client_secret,
		zoho_refresh_token,
		domain,
	}) {
		await Api.addConection(team_id, {
			clientId: zoho_client_id,
			clientSecret: zoho_client_secret,
			refreshToken: zoho_refresh_token,
			domain,
		});

		return team_id;
	}

	async getMainFolderId(pool, mainFolderName) {
		const wSpaces = await Api.ws.all(pool, { teamId: pool });
		const mainFolder = this.finderByName(wSpaces, mainFolderName);

		return _.property('id')(mainFolder);
	}

	async getUsersFolders(pool, folderId) {
		const mailFolders = await Api.files.list(pool, { folderId });

		return _.map(mailFolders, (folder) => ({
			id: folder.id,
			name: folder.attributes.name,
		}));
	}

	finderByName(data, name) {
		return data.find((file) => {
			const fileName = _.property('name')(file.attributes);

			return fileName === name;
		});
	}

	async getFoldersIdByParentId({ parentId, drive, lastDate, timezone }) {
		const { id } = parentId;
		const pool = drive;
		const dayFoldersPromise = Api.files.list(pool, { folderId: id });
		const tzOffset = CheckScreensAgeHelper.getTZOffset(timezone, lastDate);

		const dayFolders = await dayFoldersPromise;
		let deletedFoldersIds = [];

		const prevDayFolder = dayFolders.find((folder, index) => {
			const name = _.property('name')(folder.attributes);
			const isPrevDay = CheckScreensAgeHelper.checkPrevDay(name, lastDate);
			if (isPrevDay) {
				dayFolders.splice(index, 1);
				return true;
			}

			return false;
		});
		if (prevDayFolder) {
			if (tzOffset < 0) {
				deletedFoldersIds = await this.getExpiredHourFoldersIds(
					prevDayFolder.id,
					tzOffset,
					pool,
				);
			} else {
				deletedFoldersIds.push(prevDayFolder.id);
			}
		}

		const dayFoldersIds = dayFolders.reduce((acc, folder) => {
			const name = _.property('name')(folder.attributes);
			const isExpiryDay = CheckScreensAgeHelper.checkExpireDate(name, lastDate);
			if (isExpiryDay) {
				acc.push(folder.id);
			}

			return acc;
		}, []);

		return [...dayFoldersIds, ...deletedFoldersIds];
	}

	async getExpiredHourFoldersIds(folderId, tzOffset, pool) {
		const hourFolders = await Api.files.list(pool, { folderId });
		const lastNeededhour = CheckScreensAgeHelper.findNextDayHour(tzOffset);

		return hourFolders.reduce((acc, hourFolder) => {
			const hourStr = _.property('name')(hourFolder.attributes);
			const hour = parseInt(hourStr, 10);
			if (hour < lastNeededhour) {
				acc.push(hourFolder.id);
			}

			return acc;
		}, []);
	}

	async removeFile(fileId, pool) {
		await Api.files.toTrash(pool, { fileId });
		await Api.folder.delete(pool, { folderId: fileId });
	}

	async checkEmptyAndDelete(pool, { id: folderId }) {
		const files = await Api.files.list(pool, { folderId });

		if (_.isEmpty(files)) {
			await Api.files.toTrash(pool, { fileId: folderId });
			await Api.folder.delete(pool, { folderId });
		}
	}

	async checkMainFolder(pool, folderId) {
		const files = await Api.files.list(pool, { folderId });

		if (_.isEmpty(files)) {
			await Api.ws.delete(pool, {
				wsId: folderId,
			});
		}
	}


	async getOrCreateWs({ pool, folderName }) {
		const wSpaces = await Api.ws.all(pool, {
			teamId: pool,
		});

		let mainFolder = wSpaces.find((folder) => {
			const name = _lodash.get(folder, zObjPaths.name);

			return name === folderName;
		});
		if (!mainFolder) {
			mainFolder = await Api.ws.create(pool, {
				teamId: pool,
				name: folderName,
				isPublicTeam: true,
				description: 'EmpMonitor service for saving Employee avatars',
			});
		}

		return mainFolder.id;
	}

	async uploadReportZip({ parentId, fileName: name, mimetype: contentType, path, pool }) {
		console.log(parentId, name, contentType, path)
		const content = fs.createReadStream(path + `/${name}`);
		const data = await Api.files.upload(pool, {
			parentId,
			contentType,
			name: `${name}`,
			overrideNameExist: true,
			readableStream: content
		});
		const resourceId = _lodash.get(data, zObjPaths.resourceId);
		const share = await Api.share.createDownLoad(pool, {
			resourceId,
			name: resourceId,
			requestUserData: false,
		});
		const domain = Api.getDomain(pool);

		return this.parseUrl(resourceId, share.id, domain);
	}

	async uploadReport(folderName, { fileName, mimetype, path }, creds) {
		const pool = await this.initConection(creds);
		console.log(pool, 'pool')
		const parentId = await this.getOrCreateWs({ pool, folderName });
		console.log(parentId, 'parentId');
		let reportLink = await this.uploadReportZip({ parentId, fileName, mimetype, path, pool });
		console.log(reportLink, 'reportLink');
		// return reportLink
	}

	async checkAccess({ team_id, zoho_client_id, zoho_client_secret, zoho_refresh_token, domain }) {
		const pool = `$${team_id}-${_lodash.now()}`;
		await Api.addConection(pool, {
			clientId: zoho_client_id,
			clientSecret: zoho_client_secret,
			refreshToken: zoho_refresh_token,
			domain,
		});

		return Api.ws.all(pool, { teamId: team_id });
	}
}

module.exports = new ZohoWorkDrive();
