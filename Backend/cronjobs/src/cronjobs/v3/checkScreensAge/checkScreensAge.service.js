const { isEmpty } = require('underscore');

const CheckScreensAgeModel = require('./checkScreensAge.model');
const StoragesUtils = require('./utils/index');
const CheckScreensAgeHelper = require('./checkScreensAge.helper');

const ConfigFile = require("../../../../../config/config");

class CheckScreensAgeService {
	constructor() {
		this.lastDate = 0;
	}

	async getStoragesCredentials() {
		const credentials = await CheckScreensAgeModel.getStorageDetail();
		return credentials;
	}

	async checkAllStorages(storagesData) {
		try {
			if (!storagesData || !Array.isArray(storagesData) || storagesData.length === 0) {
				console.log('CRON_INFO: No storages to process');
				return;
			}

			console.log(`CRON_INFO: Processing ${storagesData.length} storage(s)`);

			const results = await Promise.allSettled(
				storagesData.map((storageData) => this.checkOneStorage(storageData)),
			);

			const failed = results.filter(r => r.status === 'rejected');
			
			if (failed.length > 0) {
				console.error(`CRON_ERROR: ${failed.length}/${storagesData.length} storage(s) failed to process`);
				failed.forEach((result, index) => {
					console.error(`CRON_ERROR: Storage failed - ${result.reason?.message || 'Unknown error'}`);
				});
			} else {
				console.log(`CRON_INFO: Successfully processed ${storagesData.length} storage(s)`);
			}
		} catch (error) {
			console.error(`CRON_ERROR: checkAllStorages failed - ${error.message}`);
		}
	}

	async checkOneStorage({
		storageType,
		credsJson,
		auto_delete_period,
		organization_id,
	}) {

		if (storageType === 'FTP' || storageType === 'SFTP') {
			auto_delete_period = auto_delete_period + 1;
		}
		const ssLastDate = CheckScreensAgeHelper.getLastDate(auto_delete_period);
		try {
			const creds = JSON.parse(credsJson);
			const StorageUtils = StoragesUtils[storageType];
			if (!StorageUtils) return;
			const conection = await StorageUtils.initConection(creds, organization_id);

			if (storageType === 'S3') {
				const bucketLcConfig = await StorageUtils.checkBucketLcConfig(
					conection,
					auto_delete_period,
				);
				if (!bucketLcConfig) return;

				await StorageUtils.createBucketLcConfig(conection, bucketLcConfig);

				return;
			}
			const mainFolderId = await StorageUtils.getMainFolderId(
				conection,
				'EmpMonitor',
				credsJson
			);
			if (!mainFolderId) return;

			if(ConfigFile.CUSTOM_DATE_EMAIL_SCREEN_FORMAT.split(",").includes(String(organization_id)) && storageType == "MO") {
				await StorageUtils.checkListFolders({ parentId: mainFolderId, drive: conection, lastDate: ssLastDate });
				return true;
			}

			const usersFoldersId = await StorageUtils.getUsersFolders(
				conection,
				mainFolderId,
				ssLastDate,
				organization_id,
			);

			if (usersFoldersId) {
				await CheckScreensAgeHelper.asyncMapper(
					usersFoldersId,
					this.checkOneUserFolder,
					{ conection, StorageUtils, ssLastDate, organization_id, storageType },
				);
			}

			await StorageUtils.checkMainFolder(conection, mainFolderId);
		} catch (error) {
			console.error(`CRON_ERROR: ${error.message}`);
		}
	}

	checkOneUserFolder = async (
		userFolderId,
		{ conection, StorageUtils, ssLastDate, organization_id, storageType },
	) => {
		try {
			let timezone;
			if (CheckScreensAgeHelper.needTimezone(storageType)) {
				timezone = await this.getTimezone(organization_id, userFolderId.name);
			}
			const outdateFoldersId = await StorageUtils.getFoldersIdByParentId({
				parentId: userFolderId,
				drive: conection,
				lastDate: ssLastDate,
				timezone,
			});

			if (!isEmpty(outdateFoldersId)) {
				await CheckScreensAgeHelper.asyncMapper(
					outdateFoldersId,
					StorageUtils.removeFile,
					conection,
				);
			}

			await StorageUtils.checkEmptyAndDelete(conection, userFolderId);
		} catch (error) {
			console.error(`CRON_ERROR: ${error.message}`);
		}
	};

	async getTimezone(organization_id, email) {
		const resEmp = await CheckScreensAgeModel.getEmployeeTz(
			organization_id,
			email,
		);
		let timezone = CheckScreensAgeHelper.getParam(resEmp)('timezone');
		if (!timezone) {
			const resOrg = await CheckScreensAgeModel.getOrganizationTz(
				organization_id,
			);
			timezone = CheckScreensAgeHelper.getParam(resOrg)('timezone');
		}

		return timezone;
	}
}

module.exports = new CheckScreensAgeService();
