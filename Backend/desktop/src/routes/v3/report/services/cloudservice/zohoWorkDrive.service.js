const moment = require('moment');
const _ = require('lodash');

const ZohoUtils = require('../../../../../utils/helpers/ZohoUtils');

/**
 * ZohoWorkDrive
 * @description class to handle Zoho work drive attachment upload
 * @class
 */
class ZohoWorkDrive {
	constructor() {
		this.initConection = ZohoUtils.initConection;
	}

	/**
	 * uploadAttachments
	 * @description Function to upload the attachmentes
	 * @memberof ZohoWorkDrive
	 * 
	 * @param {*} folderName 
	 * @param {*} filename 
	 * @param {*} creds 
	 * @param {*} filePath 
	 * @param {*} originalName 
	 * @param {*} fileMimetype 
	 * @returns String
	 * @author Amit Verma <amitverma@globussoft.in>
	 */
	async uploadAttachments(folderName, filename, creds, filePath, originalName, fileMimetype) {
		const pool = await this.initConection(creds);
		const parentId = await ZohoUtils.getOrCreateWs({ pool, folderName });
		
		return ZohoUtils.uploadScreen({ parentId, filename, filePath, originalName, fileMimetype, pool });
	}
}

module.exports = new ZohoWorkDrive();
