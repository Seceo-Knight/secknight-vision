const moment = require('moment');
const _ = require('lodash');

const Comman = require(`${utilsFolder}/helpers/Common`);
const ZohoUtils = require(`${utilsFolder}/helpers/ZohoUtils`);

class ZohoWorkDrive {
	constructor() {
		this.initConection = ZohoUtils.initConection;
	}

	async uploadScreen(folderName, file, creds) {
		const pool = await this.initConection(creds);
		const parentId = await ZohoUtils.getOrCreateWs({ pool, folderName });

		return ZohoUtils.uploadScreen({ parentId, file, pool });
	}

	// Check folder exists on specific day
	async checkDataExists(pool, { mainFolderName, email, dayFolders }) {
		const mainFolderId = await ZohoUtils.getMainFolderId({
			pool,
			mainFolderName,
		});
		if (!mainFolderId) return null;

		const mailFolderId = await ZohoUtils.getMailFolder({
			pool,
			mainFolderId,
			email,
		});

		if (!mailFolderId) return null;

		const currDayFolders = await ZohoUtils.getDayFolders({
			pool,
			mailFolderId,
			dayFolders,
		});

		if (_.isEmpty(currDayFolders)) return null;

		return currDayFolders;
	}

	groupedByDateAndHour(dataArr) {
		return dataArr.reduce((acc, { day, hour, data, shareId }) => {
			if (!acc[day]) {
				acc[day] = {}
			}
			acc[day][hour] = { data, shareId };

			return acc;
		}, {})
	}

	groupedByDate(dataArr) {
		return dataArr.reduce((acc, { day, data, shareId }) => {
			acc[day] = { data, shareId };

			return acc;
		}, {})
	}

	// Get screenshots and filter by current date
	async getScreenshotsFlat(
		pool,
		{ totalHour, dateFoldersId, timezone, creds },
	) {
		const getHourPromises = Object.keys(dateFoldersId).map((day) => {
			const folderId = dateFoldersId[day];
			return ZohoUtils.getHourFoldersIds({ pool, day, folderId, totalHour });
		});

		const hourFolders = await Promise.all(getHourPromises);
		const screensPromises = hourFolders.reduce((acc, { day, data }) => {
			const oneDayPromises = data.map(hourFolder => {
				const { id, attributes } = hourFolder;
				const { name } = attributes;
				return ZohoUtils.getScreensData({ pool, day, hour: name, folderId: id });
			});
			return [...acc, ...oneDayPromises];
		}, []);
		const screensArr = await Promise.all(screensPromises);
		const screensData = this.groupedByDateAndHour(screensArr);

		return this.transformScreenData({
			screensData,
			timezone,
			totalHour,
			domain: creds.domain,
		});
	}

	async getScreenRecords(
		pool,
		{ totalHour, dateFoldersId, timezone, creds },
	) {
		const recordsDataPromises = Object.keys(dateFoldersId).map((day) => {
			const folderId = dateFoldersId[day];
			return ZohoUtils.getScreensData({ pool, day, folderId });
		});
		const recordsDataArr = await Promise.all(recordsDataPromises);
		const recordsData = this.groupedByDate(recordsDataArr);

		return this.transformRecordsData({
			recordsData,
			timezone,
			totalHour,
			domain: creds.domain,
		});
	}

	transformRecordsData({ recordsData, timezone, totalHour, domain }) {
		let haveScreen = false;

		const ssData = totalHour.map((hour) => {
			const actualDay = hour.format('YYYY-MM-DD');
			const actual_t = hour.format('HH');
			let transformedData = [];

			const dateScreensData = recordsData[actualDay];
			if (dateScreensData) {
				let { data, shareId } = dateScreensData;
				data = data.filter((screenRecord) => {
					const {
						name,
						created_time_in_millisecond: createdAt,
						uploaded_time_in_millisecond: updatedAt,
					} = screenRecord.attributes;
					const [prefix] = name.split('-');
					if (prefix === actual_t) {
						const link = ZohoUtils.parseUrl(screenRecord.id, shareId, domain);
						const screenData = {
							id: screenRecord.id, // required
							actual: name, // required
							timeslot: Comman.toTimezoneDateofSR_Timeslot(name, timezone),
							name: Comman.toTimezoneDateofSR(name, timezone), // required
							timeWithDate: Comman.toTimezoneDateofSRTimeWithDate(name, timezone),
							link,
							created_at: moment(createdAt).toISOString(),
							updated_at: moment(updatedAt).toISOString(),
						};
						transformedData.push(screenData);
						haveScreen = true;
						return false;
					}

					return true;
				});
			}

			const timeWithTz = moment.tz(hour, timezone);
			const t = timeWithTz.format('HH')
			const UniqSsData = _.reverse(_.uniqBy(transformedData, 'id'));

			return {
				t,
				actual_t,
				s: UniqSsData,
				pageToken: null,
			};
		});

		return haveScreen ? ssData : null;
	}

	transformScreenData({ screensData, timezone, totalHour, domain }) {
		let haveScreen = false;

		const ssData = totalHour.map((hour) => {
			const actualDay = hour.format('YYYY-MM-DD');
			const actual_t = hour.format('HH');
			let transformedData = [];
			const hourScreensData = _.get(screensData, `[${actualDay}][${actual_t}]`);

			if (hourScreensData) {
				const { data, shareId } = hourScreensData;
				transformedData = data.map((screenshot) => {
					const {
						name,
						created_time_in_millisecond: createdAt,
						uploaded_time_in_millisecond: updatedAt,
					} = screenshot.attributes;
					const link = ZohoUtils.parseUrl(screenshot.id, shareId, domain);
					return {
						id: screenshot.id, // required
						actual: name, // required
						timeslot: Comman.toTimezoneDateFormat(name, timezone, 'timeSlot'), // required
						name: Comman.toTimezoneDateofSS(name, timezone), // required
						link: link, // required
						viewLink: link,
						thumbnailLink: link,
						downloadLink: link,
						created_at: moment(createdAt).toISOString(),
						updated_at: moment(updatedAt).toISOString(),
					};
				});
				haveScreen = true;
			}

			const timeWithTz = moment.tz(hour, timezone);
			const t = timeWithTz.format('HH')
			const UniqSsData = _.reverse(_.uniqBy(transformedData, 'id'));

			return {
				t,
				actual_t,
				s: UniqSsData,
				pageToken: null,
			};
		});

		return haveScreen ? ssData : null;
	}

	async getEmployeFolderId(pool, { mainFolderName, email }) {
		const mainFolderId = await ZohoUtils.getMainFolderId({
			pool,
			mainFolderName,
		});
		const mailFolderId = await ZohoUtils.getMailFolder({
			pool,
			mainFolderId: mainFolderId,
			email: email,
		});
		return mailFolderId;
	}

	async deleteEployeeScreenshots(pool, mailFolderId) {
		await ZohoUtils.deleteFolder({
			pool, mailFolderId
		}
		);
	}

	async uploadReport(folderName, { fileName, mimetype, path }, creds) {
		const pool = await this.initConection(creds);
		const parentId = await ZohoUtils.getOrCreateWs({ pool, folderName });
		let reportLink = await ZohoUtils.uploadReport({ parentId, fileName, mimetype, path, pool });
		return reportLink
	}
}

module.exports = new ZohoWorkDrive();
