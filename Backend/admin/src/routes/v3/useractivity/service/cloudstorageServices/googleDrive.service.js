const fs = require('fs');
const GDUtils = require(`${utilsFolder}/helpers/GoogleDriveUtils`);
const moment = require('moment');
const _ = require('lodash');

const { logger: Logger } = require('../../../../../logger/Logger');
// const { logger: Logger } = require('../../../../../../logger/Logger');

const ReqLimiter = require('@ya_myn/request-limiter').getInstance('google', {
    clientName: 'drive',
    maxRepeatAttempts: 18,
    maxOneTimeReq: 6,
    maxAttempts: Number(process.env.MAXIMUM_ATTEMPTS) || 27
});

const Comman = require(`${utilsFolder}/helpers/Common`);

class GoogleDrive {
    /**Get googleapis instance*/
    initConection(creds) {
        const { client_id: port } = creds;

        if (!ReqLimiter.existClient(port)) {
            ReqLimiter.haveConnect(port);

            const drive = GDUtils.initConection(creds)

            ReqLimiter.setClient(port, drive);
        }

        return port;
    }

    /**Check folder exists on specific day */
    async checkDataExists(port, { mainFolderName, email, dayFolders }) {
        await ReqLimiter.checkEmpPort(port);

        const mailFolderId = await this.getMailFolderId(port, email, mainFolderName);
        if (!mailFolderId) return mailFolderId;

        const getFoldersResult = await Promise.all(
            dayFolders.map((day) =>
                ReqLimiter.reqWithCheck(port, this.getIdWithDate, {
                    parentId: mailFolderId,
                    folderName: day,
                })
            )
        );

        const dateFoldersId = {};
        getFoldersResult.forEach((folder) => {
            if (folder.id) {
                dateFoldersId[folder.name] = folder.id;
            }
        });
        if (_.isEmpty(dateFoldersId)) return null;

        return dateFoldersId;
    }

    async getMailFolderId(port, email, mainFolderName) {
        const cacheKey = `${mainFolderName}_${email}`;
        let mailFolderId = ReqLimiter.getFromCashe(port, cacheKey);
        if (!mailFolderId) {
            const mainFolderId = await this.getMainFolderId(port, mainFolderName);
            if (!mainFolderId) return null;

            mailFolderId = await ReqLimiter.reqWithCheck(port, this.getFolderIdByParentId, {
                parentId: mainFolderId,
                folderName: email,
            });
            ReqLimiter.setToCashe(port, { key: cacheKey, data: mailFolderId });
        }

        return mailFolderId;
    }

    async getMainFolderId(port, mainFolderName) {
        let mainFolderId = ReqLimiter.getFromCashe(port, mainFolderName)

        if (!mainFolderId) {
            mainFolderId = await ReqLimiter.reqWithCheck(port, this.getFolderIdByName, {
                folderName: mainFolderName,
            });
            ReqLimiter.setToCashe(port, { key: mainFolderName, data: mainFolderId });
        }

        return mainFolderId;
    }

    getIdWithDate = async (creds) => {
        const id = await this.getFolderIdByParentId(creds);

        return { id, name: creds.folderName };
    };

    getFilesByHour({ port, totalHour, marker, limit, dateFoldersId }) {
        const screensPromises = totalHour.map((time) => {
            const folderId = dateFoldersId[moment(time).format('YYYY-MM-DD')];
            if (!folderId) {
                return { data: { files: [] } };
            }

            const conditionTime = moment(time).format('HH-YYYY-MM-DD');
            const condition = `name contains ' ${conditionTime}'`;

            return ReqLimiter.reqWithCheck(port, this.getFiles, {
                folderId,
                condition,
                limit,
                pageToken: marker
            });
        });

        return Promise.all(screensPromises);
    }

    /**Get screenshots and sorted by current date */
    async getScreenshotsFlat(port, creds) {
        const screenshotsFlat = await this.getFilesByHour({ port, ...creds });
        ReqLimiter.freeEmpPort(port);

        return this.transformScreenData({ screenshotsFlat, ...creds });
    }

    async getScreenRecords(port, creds) {
        const screenRecords = await this.getFilesByHour({ port, ...creds });
        ReqLimiter.freeEmpPort(port);

        return this.transformRecordsData({ screenRecords, ...creds });
    }

    /**Transform screenData in convenient format */
    transformScreenData({ screenshotsFlat, timezone, totalHour }) {
        return screenshotsFlat.map(({ data }, index) => {
            const transformedData = data.files.map((elem) => ({
                id: elem.id,
                actual: elem.name,
                timeslot: Comman.toTimezoneDateFormat(elem.name, timezone, 'timeSlot'),
                name: Comman.toTimezoneDateFormat(elem.name, timezone, 'time'),
                link: elem.webContentLink.replace(/&amp;/g, '&'),
                viewLink: elem.webViewLink,
                thumbnailLink: elem.thumbnailLink,
                created_at: elem.createdTime,
                updated_at: elem.modifiedTime,
            }));
            const actual_t = moment(totalHour[index]).format('HH'); //remove this
            const timeWithTz = moment.tz(totalHour[index], timezone);
            const t = moment(timeWithTz).format('HH');
            const UniqSsData = _.uniqBy(transformedData, 'id');

            return {
                t,
                actual_t,
                s: UniqSsData,
                pageToken: data.nextPageToken ? data.nextPageToken : null,
            };
        });
    }

    transformRecordsData({ screenRecords, timezone, totalHour }) {
        return screenRecords.map(({ data }, index) => {
            const transformedData = data.files.map((elem) => ({
                id: elem.id,
                actual: elem.name,
                timeslot: Comman.toTimezoneDateofSR_Timeslot(elem.name, timezone),
                name: Comman.toTimezoneDateofSR(elem.name, timezone),
                timeWithDate: Comman.toTimezoneDateofSRTimeWithDate(elem.name, timezone),
                link: elem.webContentLink.replace(/&amp;/g, '&'),
                viewLink: elem.webViewLink,
                thumbnailLink: elem.thumbnailLink,
                created_at: elem.createdTime,
                updated_at: elem.modifiedTime,
            }));
            const actual_t = moment(totalHour[index]).format('HH'); //remove this
            const timeWithTz = moment.tz(totalHour[index], timezone);
            const t = moment(timeWithTz).format('HH');
            const UniqSsData = _.uniqBy(transformedData, 'id');

            return {
                t,
                actual_t,
                s: UniqSsData,
                pageToken: data.nextPageToken ? data.nextPageToken : null,
            };
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

    /**Upload screenshot to google drive*/
    async uploadScreen(folderName, { filename: name, mimetype: mimeType }, creds) {
        const port = this.initConection(creds);

        const folderId = await ReqLimiter.reqWithCheck(port, this.getOrCreateFolder, {
            folderName,
        });

        const condition = `name contains '${name}'`;
        await ReqLimiter.reqWithCheck(port, this.uploadScreenshotToDrive, {
            folderId,
            name,
            mimeType,
        });

        const data = await ReqLimiter.reqWithCheck(port, this.getFiles, {
            folderId,
            condition,
            pageToken: '',
            limit: 1,
        });

        return _.get(data, 'data.files[0].webContentLink');
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

    /** Get folder id by parent folder id */
    async getFolderIdByParentId({ parentId, folderName, drive }) {
        const pageToken = '';
        const { data } = await drive.files.list({
            pageSize: 1000,
            q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
            pageToken: pageToken ? pageToken : '',
            fields: 'nextPageToken, files(*)',
        });
        return _.get(data, 'files[0].id');
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

    /** Add share permision */
    addSharePermisionToFile(fileId, drive) {
        return drive.permissions.create({
            fileId,
            resource: { role: 'reader', type: 'anyone' },
        });
    }

    /** Upload screenshot to drive */
    uploadScreenshotToDrive({ folderId, name, mimeType, drive }) {

        const fileMetadata = { name, parents: [folderId], };
        const content = fs.createReadStream(`${publicFolder}/images/profilePic/${name}`);
        const media = {
            mimeType,
            body: content,
        };

        return drive.files.create({ requestBody: fileMetadata, media: media });
    }

    /** Get screens by current date */
    async getFiles({ drive, folderId, condition, pageToken, limit }) {
        const query = `(${condition.trim()}) and '${folderId}' in parents and trashed = false`;
        let findMore = true;
        let finalScreenshots = [];
        let count = 0;

        while (findMore) {
            count++;
            let { data } = await drive.files.list({
                pageSize: 1000,
                orderBy: 'name',
                q: query,
                pageToken: pageToken ? pageToken : '',
                fields: 'nextPageToken, files(*)',

            });
            if (data?.files) finalScreenshots.push(...data.files);
            if (data?.nextPageToken) {
                pageToken = data.nextPageToken;
            }
            else {
                findMore = false;
                return {
                    config: {
                        url: 'https://www.googleapis.com/drive/v3/files',
                        method: 'GET',
                        retry: true,
                        responseType: 'json'
                    },
                    data: { files: finalScreenshots },
                    headers: {
                    },
                    status: 200,
                    statusText: 'OK',
                    request: {
                        responseURL: 'https://www.googleapis.com/drive/v3/files'
                    }
                };
            }
        }
    }


    /** Get Employee folder id */
    async getEmployeFolderId(port, { mainFolderName, email }) {
        // const mailFolderId = await this.getMailFolderId(port, email, mainFolderName);
        const mailFolderId = await this.getMailFolderIdForDelete(port, email, mainFolderName);
        if (!mailFolderId) return mailFolderId;
        return mailFolderId;
    }
    /**Delete Employee Folder */
    async deleteEmployeeFolder({ drive, fileId }) {
        await drive.files.delete({ fileId });
    }

    async deleteEployeeScreenshots(port, fileId) {
        ReqLimiter.reqWithCheck(port, this.deleteEmployeeFolder, {
            fileId
        })

    }

    /**
    * @function getMailFolderIdForDelete
    * @param {object} port
    * @param {string} email 
    * @param {string}  mainFolderName
    * @returns {String} mail folder id
    * @memberof GoogleDrive
    */
    async getMailFolderIdForDelete(port, email, mainFolderName) {

        const mainFolderId = await this.getMainFolderId(port, mainFolderName);
        if (!mainFolderId) return null;
        let mailFolderId = await ReqLimiter.reqWithCheck(port, this.getFolderIdByParentId, {
            parentId: mainFolderId,
            folderName: email,
        });
        return mailFolderId;
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
            Logger.error(`upload report main function ------${error.message}-----${error}'-------`);
        }
    }

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

            Logger.error(`uploadReportToDrive error ------${error.message}-----${error}'-------`);
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
            Logger.error(`uploadReportToDrive error ------${error.message}-----${error}'-------`);
        }
    }
}

module.exports = new GoogleDrive();
