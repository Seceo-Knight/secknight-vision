const moment = require("moment");
const ODUtils = require(`${utilsFolder}/helpers/OneDriveUtils`);
const _ = require("lodash");

const Comman = require(`${utilsFolder}/helpers/Common`);

class OneDrive {
	async uploadScreen(folderName, { originalname, filename, size }, creds) {
		const pool = await ODUtils.initConection(creds);
		const parentId = await ODUtils.findOrCreateFolder({
			pool,
			folderName,
			itemId: "root",
		});
		const path = `${publicFolder}/images/profilePic/${filename}`;
		const name = filename;

		const { webUrl, id } = await ODUtils.uploadFile({
			pool,
			size,
			parentId,
			path,
			name,
		});

		let checkPick = await this.checkProfileFolder(pool, { mainFolderName: 'EmpMonitorProfilePic' });
		let publicUrl;
		if (checkPick) {
			let profileList = await ODUtils.getAllFolderChildrensPic({
				pool,
				name,
				itemId: checkPick,
			})

			if (profileList && profileList.data.length) {
				publicUrl = profileList.data.find(item => {
					return item.name === name;
				})
			}
		}

		publicUrl = publicUrl ? publicUrl['@microsoft.graph.downloadUrl'] : null

		return publicUrl || webUrl;
	}

	initConection(creds) {
		return ODUtils.initConection(creds);
	}

	async checkDataExists(pool, { mainFolderName, email, dayFolders }, customData) {
		if (customData?.type == "CUSTOM_DATE_EMAIL_SCREEN_FORMAT") {
			this.customType = "CUSTOM_DATE_EMAIL_SCREEN_FORMAT";
			const mainFolderId = await ODUtils.getFolderIdFromCashe({
				pool,
				folderName: mainFolderName,
				itemId: "root",
				ttl: 3600,
			});
			if (!mainFolderId) return null;

			let emailFolderId = [];

			for (const days of dayFolders) {
				const emailFolderIds = await ODUtils.getDateFoldersId({
					pool,
					dayFolders: [days],
					itemId: mainFolderId,
				});
				if (!emailFolderIds) return null;
				emailFolderId.push(emailFolderIds);
			}

			if (emailFolderId.length === 0) return null;

			let singleEmailFolderId = [];
			for (const emailsList of emailFolderId) {
				const emailFolderIds = await ODUtils.getDateFoldersId({
					pool,
					dayFolders: [email],
					itemId: emailsList[Object.keys(emailsList)[0]],
				});
				if (!emailFolderIds) return null;
				singleEmailFolderId.push({ [Object.keys(emailsList)[0]]: emailFolderIds[email] });
			}

			if (singleEmailFolderId.length === 0) return null;
			return singleEmailFolderId;
		}
		else {
			this.customType = null;
			const mainFolderId = await ODUtils.getFolderIdFromCashe({
				pool,
				folderName: mainFolderName,
				itemId: "root",
				ttl: 3600,
			});
			if (!mainFolderId) return null;

			const emailFolderId = await ODUtils.getFolderIdFromCashe({
				pool,
				folderName: email,
				itemId: mainFolderId,
				ttl: 1200,
			});
			if (!emailFolderId) return null;

			const dateFoldersId = await ODUtils.getDateFoldersId({
				pool,
				dayFolders,
				itemId: emailFolderId,
			});

			if (_.isEmpty(dateFoldersId)) return null;

			return dateFoldersId;
		}
	}

	async getScreenshotsFlat(pool, { totalHour, dateFoldersId, timezone }) {
		if (this.customType == "CUSTOM_DATE_EMAIL_SCREEN_FORMAT") {
			let tempDateFolderId = {}
			dateFoldersId.map(i => {
				tempDateFolderId = {...tempDateFolderId, ...i}
			})
			const screensData = await Promise.all(
				Object.keys(tempDateFolderId).map((folderName) => {
					return ODUtils.getAllFolderChildrens({
						pool,
						folderName,
						itemId: tempDateFolderId[folderName],
					})
				}
				)
			).then(ODUtils.parseScreensObj);

			return this.transformScreenData({
				screensData,
				timezone,
				totalHour,
			});
		}
		else {
			const screensData = await Promise.all(
				Object.keys(dateFoldersId).map((folderName) => {
					return ODUtils.getAllFolderChildrens({
						pool,
						folderName,
						itemId: dateFoldersId[folderName],
					})
				}
				)
			).then(ODUtils.parseScreensObj);

			return this.transformScreenData({
				screensData,
				timezone,
				totalHour,
			});
		}
	}
	async getScreenRecords(pool, { totalHour, dateFoldersId, timezone }) {
		const screenRecords = await Promise.all(
			Object.keys(dateFoldersId).map((folderName) =>
				ODUtils.getAllFolderChildrens({
					pool,
					folderName,
					itemId: dateFoldersId[folderName],
				})
			)
		).then(ODUtils.parseScreensObj);

		return this.transformRecordsData({
			screenRecords,
			timezone,
			totalHour,
		});
	}

	transformRecordsData({ screenRecords, timezone, totalHour }) {
		let haveScreen = false;

		const srData = totalHour.map((hour) => {
			const actual_t = moment(hour).format("HH");
			const transformedData = [];
			let currentDayScreens = screenRecords[moment(hour).format("YYYY-MM-DD")];
			if (currentDayScreens) {
				currentDayScreens = currentDayScreens.filter((screenshot) => {
					const [prefix] = screenshot.name.split("-");
					if (prefix === actual_t) {
						const screenData = {
							id: screenshot.id, // required
							actual: screenshot.name, // required
							timeslot: Comman.toTimezoneDateofSR_Timeslot(
								screenshot.name,
								timezone
							),
							name: Comman.toTimezoneDateofSR(screenshot.name, timezone), // required
							timeWithDate: Comman.toTimezoneDateofSRTimeWithDate(
								screenshot.name,
								timezone
							),
							link: screenshot["@microsoft.graph.downloadUrl"], // required
							created_at: screenshot.createdDateTime,
							updated_at: screenshot.lastModifiedDateTime,
						};
						transformedData.push(screenData);
						haveScreen = true;
						return false;
					}

					return true;
				});
			}

			const timeWithTz = moment.tz(hour, timezone);
			const t = moment(timeWithTz).format("HH");

			const UniqSsData = _.uniqBy(transformedData, "id");
			return {
				t,
				actual_t,
				s: UniqSsData,
				pageToken: null,
			};
		});

		return haveScreen ? srData : null;
	}

	transformScreenData({ screensData, timezone, totalHour }) {
		return totalHour.map((hour) => {
			const actual_t = moment(hour).format("HH");
			const transformedData = [];
			let currentDayScreens = screensData[moment(hour).format("YYYY-MM-DD")];
			if (currentDayScreens) {
				currentDayScreens = currentDayScreens.filter((screenshot) => {
					const [prefix] = screenshot.name.split("-");
					if (prefix === actual_t) {
						const screenData = {
							id: screenshot.id, // required
							actual: screenshot.name, // required
							timeslot: Comman.toTimezoneDateFormat(
								screenshot.name,
								timezone,
								"timeSlot"
							), // required
							name: Comman.toTimezoneDateofSS(screenshot.name, timezone), // required
							link: screenshot["@microsoft.graph.downloadUrl"], // required
							viewLink: screenshot["@microsoft.graph.downloadUrl"],
							thumbnailLink: screenshot["@microsoft.graph.downloadUrl"],
							downloadLink: screenshot["@microsoft.graph.downloadUrl"],
							created_at: screenshot.createdDateTime,
							updated_at: screenshot.lastModifiedDateTime,
						};
						transformedData.push(screenData);

						return false;
					}

					return true;
				});
			}

			const timeWithTz = moment.tz(hour, timezone);
			const t = moment(timeWithTz).format("HH");

			const UniqSsData = _.uniqBy(transformedData, "id");
			return {
				t,
				actual_t,
				s: UniqSsData,
				pageToken: null,
			};
		});
	}

	async getEmployeFolderId(pool, { mainFolderName, email }) {
		const mainFolderId = await ODUtils.getFolderIdFromCashe({
			pool,
			folderName: mainFolderName,
			itemId: "root",
			ttl: 3600,
		});
		if (!mainFolderId) return null;

		const emailFolderId = await ODUtils.getFolderIdFromCashe({
			pool,
			folderName: email,
			itemId: mainFolderId,
			ttl: 1200,
		});
		if (!emailFolderId) return null;

		return emailFolderId;
	}

	async deleteEployeeScreenshots(pool, itemId) {
		// _deleteEmployeeFolder
		await ODUtils._deleteEmployeeFolder(pool, itemId);
	}



	/**
	 * Checking profile pic folder in one drive 
	 *
	 * @function checkProfileFolder
	 * @memberof OneDrive
	 * @param {object} pool
	 * @param {String} mainFolderName
	 * @returns {Object} -profile pic folder id  .
	 */
	async checkProfileFolder(pool, { mainFolderName }) {
		const mainFolderId = await ODUtils.getFolderIdFromCashe({
			pool,
			folderName: mainFolderName,
			itemId: "root",
			ttl: 3600,
		});
		if (!mainFolderId) return null;
		return mainFolderId;
	}

	async uploadReport(folderName, { fileName, mimetype, size, path }, creds) {
		const pool = await ODUtils.initConection(creds);
		const parentId = await ODUtils.findOrCreateFolder({
			pool,
			folderName,
			itemId: "root",
		});
		path = `${path}/${fileName}`;
		const name = fileName;

		const { webUrl, id } = await ODUtils.uploadReport({
			pool,
			size,
			parentId,
			path,
			name,
		});

		return webUrl;
	}
}

module.exports = new OneDrive();
