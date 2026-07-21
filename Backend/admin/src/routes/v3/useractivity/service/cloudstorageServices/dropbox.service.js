const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const { Dropbox } = require('dropbox');
const fetch = require('isomorphic-fetch');
const axios = require('axios');
const Comman = require(`${utilsFolder}/helpers/Common`);
const redisService = require("../../../auth/services/redis.service")

class DropboxService {
    constructor() {
        this.ssFolder = 'EmpMonitor';
        this.srFolder = 'EmpMonitorRecords';
    }

    /**Initialize Dropbox connection*/
    async initConection(creds, organization_id) {
        try {

            let token = await redisService.getAsync(`dropbox:token:${organization_id}`);
            if(token) {
                const dbx = new Dropbox({
                    accessToken: token,
                    fetch: fetch
                });
    
                // Verify connection by listing root folder
                await dbx.filesListFolder({ path: '' });
    
                return { dbx, organization_id, access_token: token };
            }
            else {
                const response = await axios.post(
                    'https://api.dropboxapi.com/oauth2/token',
                    new URLSearchParams({
                      refresh_token: creds.refresh_token,
                      grant_type: 'refresh_token'
                    }).toString(),
                    {
                      headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${Buffer.from(`${creds.app_key}:${creds.app_secret}`).toString('base64')}`
                    },
                      auth: {
                        username: creds.app_key,
                        password: creds.app_secret
                      }
                    }
                );
              
    
                const dbx = new Dropbox({
                    accessToken: response.data.access_token,
                    fetch: fetch
                });
    
                // Verify connection by listing root folder
                await dbx.filesListFolder({ path: '' });

                // expire in 3 hours 55 minutes as a single token is valid for 4 hours
                await redisService.setAsync(`dropbox:token:${organization_id}`, response.data.access_token, 'EX', 3 * 60 * 60 + 55 * 60);

                return { dbx, organization_id, access_token: response.data.access_token };
            }
        } catch (error) {
            throw error;
        }
    }

    /**Check if data exists for specific day folders*/
    async checkDataExists(connection, { mainFolderName, email, dayFolders, a_email }, customData) {
        const { dbx } = connection;
        
        try {
            // Check if main folder exists
            const mainFolderPath = `/${mainFolderName}`;
            const mainFolderExists = await this.folderExists(dbx, mainFolderPath);
            if (!mainFolderExists) return null;

            // Check if email folder exists
            const emailFolderPath = `/${mainFolderName}/${email}`;
            const emailFolderExists = await this.folderExists(dbx, emailFolderPath);
            if (!emailFolderExists) return null;

            // Check date folders
            const dateFoldersId = {};
            for (const dayFolder of dayFolders) {
                const dateFolderPath = `/${mainFolderName}/${email}/${dayFolder}`;
                const dateFolderExists = await this.folderExists(dbx, dateFolderPath);
                if (dateFolderExists) {
                    dateFoldersId[dayFolder] = dateFolderPath;
                }
            }

            if (_.isEmpty(dateFoldersId)) return null;
            return dateFoldersId;
        } catch (error) {
            console.error('Dropbox checkDataExists error:', error);
            return null;
        }
    }

    /**Get screenshots data in flat format*/
    async getScreenshotsFlat(connection, { totalHour, limit, dateFoldersId, marker, email, timezone, creds, organization_id }) {
        try {
            const { dbx } = connection;
            const screenshotsData = [];

            for (const [dateFolder, folderPath] of Object.entries(dateFoldersId)) {
                const screenshots = await this.getScreenshotsFromFolder(dbx, folderPath, limit);
                if (screenshots && screenshots.length > 0) {
                    screenshotsData.push({
                        date: dateFolder,
                        screenshots: screenshots
                    });
                }
            }

            return this.transformScreenData({
                screenshotsData,
                timezone,
                totalHour,
                dbx: dbx
            });
        } catch (error) {
            console.error('Dropbox getScreenshotsFlat error:', error);
            return null;
        }
    }

    /**Get video data in flat format*/
    async getVideoFlat(connection, { totalHour, limit, dateFoldersId, marker, email, timezone, creds, organization_id }) {
        try {
            const { dbx } = connection;
            const videoData = [];

            for (const [dateFolder, folderPath] of Object.entries(dateFoldersId)) {
                const videos = await this.getScreenshotsFromFolder(dbx, folderPath, limit);
                if (videos && videos.length > 0) {
                    videoData.push({
                        date: dateFolder,
                        screenshots: videos
                    });
                }
            }

            return this.transformScreenData({
                screenshotsData: videoData,
                timezone,
                totalHour,
                dbx: dbx
            });
        } catch (error) {
            console.error('Dropbox getVideoFlat error:', error);
            return null;
        }
    }

    /**Get screen records data*/
    async getScreenRecords(connection, { totalHour, limit, dateFoldersId, marker, email, timezone, creds }) {
        try {
            const { dbx } = connection;
            const recordsData = [];

            for (const [dateFolder, folderPath] of Object.entries(dateFoldersId)) {
                const records = await this.getScreenshotsFromFolder(dbx, folderPath, limit);
                if (records && records.length > 0) {
                    recordsData.push({
                        date: dateFolder,
                        screenshots: records
                    });
                }
            }

            return this.transformRecordsData({
                recordsData,
                timezone,
                totalHour,
                dbx: dbx
            });
        } catch (error) {
            console.error('Dropbox getScreenRecords error:', error);
            return null;
        }
    }

    /**Upload screenshot to Dropbox*/
    async uploadScreen(folderName, fileData, creds, organization_id) {
        try {
            const dbx = new Dropbox({
                accessToken: creds.access_token,
                fetch: fetch
            });
            
            const filePath = `${publicFolder}/images/profilePic/${fileData.filename}`;
            
            // Upload file to Dropbox
            const uploadPath = `/${folderName}/${fileData.filename}`;
            const uploadResult = await this.uploadFile(dbx, filePath, uploadPath);
            
            if (uploadResult) {
                // Create shared link
                const sharedLink = await this.createSharedLink(dbx, uploadPath);
                return sharedLink;
            }
            
            return null;
        } catch (error) {
            console.error('Dropbox uploadScreen error:', error);
            return null;
        }
    }

    /**Upload report to Dropbox*/
    async uploadReport(folderName, fileData, creds, organization_id) {
        try {
            const dbx = new Dropbox({
                accessToken: creds.access_token,
                fetch: fetch
            });
            
            const filePath = fileData.path;
            
            // Upload file to Dropbox
            const uploadPath = `/${folderName}/${fileData.fileName}`;
            const uploadResult = await this.uploadFile(dbx, filePath, uploadPath);
            
            if (uploadResult) {
                // Create shared link
                const sharedLink = await this.createSharedLink(dbx, uploadPath);
                return sharedLink;
            }
            
            return null;
        } catch (error) {
            console.error('Dropbox uploadReport error:', error);
            return null;
        }
    }

    /**Helper method to check if folder exists*/
    async folderExists(dbx, folderPath) {
        try {
            const response = await dbx.filesGetMetadata({
                path: folderPath
            });
            return response && response.result && response.result?.['.tag'] && response.result?.['.tag'] === 'folder';
        } catch (error) {
            return false;
        }
    }

    /**Helper method to get screenshots from folder*/
    async getScreenshotsFromFolder(dbx, folderPath, limit = 200) {
        limit = 500;
        try {
            const response = await dbx.filesListFolder({
                path: folderPath,
                recursive: false,
                include_media_info: false,
                include_deleted: false,
                include_has_explicit_shared_members: false,
                include_mounted_folders: true,
                include_non_downloadable_files: true,
                limit: limit
            });

            return response?.result?.entries || [];
        } catch (error) {
            console.error('Dropbox getScreenshotsFromFolder error:', error);
            return [];
        }
    }

    /**Helper method to upload file*/
    async uploadFile(dbx, localFilePath, dropboxPath) {
        try {
            const fileContent = fs.readFileSync(localFilePath);
            
            const response = await dbx.filesUpload({
                path: dropboxPath,
                contents: fileContent,
                mode: 'overwrite'
            });

            return response;
        } catch (error) {
            console.error('Dropbox uploadFile error:', error);
            return null;
        }
    }

    /**Helper method to create shared link*/
    async createSharedLink(dbx, filePath) {
        try {
            const response = await dbx.sharingCreateSharedLinkWithSettings({
                path: filePath,
                settings: {
                    requested_visibility: 'public',
                    audience: 'public',
                    access: 'viewer'
                }
            });

            // Convert to direct download link
            return response.url.replace('dl=0', 'raw=1');
        } catch (error) {
            console.error('Dropbox createSharedLink error:', error);
            return null;
        }
    }

    /**Transform screen data to match expected format (now with thumbnails)*/
    async transformScreenData({ screenshotsData, timezone, totalHour, dbx }) {
        const transformedData = [];

        const chunkArray = (arr, size) => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
            }
            return chunks;
        };

        for (const hour of totalHour) {
            const actual_t = moment(hour).format('HH');
            const currentDate = moment(hour).format('YYYY-MM-DD');
            const currentDayScreens = screenshotsData.find(data => data.date === currentDate);
            const hourScreenshots = [];
            const matchedScreens = [];

            if (currentDayScreens && currentDayScreens.screenshots) {
                for (const screenshot of currentDayScreens.screenshots) {
                    const [prefix] = screenshot.name.split('-');
                    if (prefix === actual_t) matchedScreens.push(screenshot);
                }
            }

            // Get thumbnails in batches of 25
            let thumbnailMap = {};
            if (matchedScreens.length > 0) {
                const batches = chunkArray(matchedScreens, 25);
                for (const batch of batches) {
                    const res = await dbx.filesGetThumbnailBatch({
                        entries: batch.map(file => ({
                            path: file.path_lower,
                            format: 'jpeg',
                            size: 'w2048h1536',
                            mode: 'strict',
                        }))
                    });
                    res?.result?.entries?.forEach(item => {
                        if (item['.tag'] === 'success') {
                            thumbnailMap[item.metadata.id] = `data:image/jpeg;base64,${item.thumbnail}`;
                        }
                    });
                }
            }

            for (const screenshot of matchedScreens) {
                let tempLink = await this.getDownloadLink(dbx, screenshot);
                const screenData = {
                    id: screenshot.id,
                    actual: screenshot.name,
                    timeslot: Comman.toTimezoneDateFormat(screenshot.name, timezone, 'timeSlot'),
                    name: Comman.toTimezoneDateofSS(screenshot.name, timezone),
                    utc: Comman.toTimezoneDateFormat(screenshot.name, timezone, 'utc'),
                    link: tempLink,
                    viewLink: tempLink,
                    thumbnailLink: thumbnailMap[screenshot.id] || tempLink,
                    downloadLink: tempLink,
                    created_at: screenshot.client_modified,
                    updated_at: screenshot.server_modified
                };
                hourScreenshots.push(screenData);
            }

            const timeWithTz = moment.tz(hour, timezone);
            const t = moment(timeWithTz).format('HH');

            const UniqSsData = _.uniqBy(hourScreenshots, 'id');
            transformedData.push({
                t,
                actual_t,
                s: UniqSsData,
                pageToken: null,
            });
        }
        return transformedData;
    }

    /**Transform records data to match expected format*/
    async transformRecordsData({ recordsData, timezone, totalHour, dbx }) {
        let haveScreen = false;
        const transformedData = [];

        for (const hour of totalHour) {
            const actual_t = moment(hour).format('HH');
            const currentDate = moment(hour).format('YYYY-MM-DD');
            const hourRecords = [];
            const currentDayRecords = recordsData.find(data => data.date === currentDate);

            if (currentDayRecords && currentDayRecords.screenshots) {
                for (const record of currentDayRecords.screenshots) {
                    const [prefix] = record.name.split('-');
                    if (prefix === actual_t) {
                        const recordData = {
                            id: record.id,
                            actual: record.name,
                            timeslot: Comman.toTimezoneDateofSR_Timeslot(record.name, timezone),
                            name: Comman.toTimezoneDateofSR(record.name, timezone),
                            timeWithDate: Comman.toTimezoneDateofSRTimeWithDate(record.name, timezone),
                            link: await this.getDownloadLink(dbx, record),
                            created_at: record.client_modified,
                            updated_at: record.server_modified,
                        };
                        hourRecords.push(recordData);
                        haveScreen = true;
                    }
                }
            }

            const timeWithTz = moment.tz(hour, timezone);
            const t = moment(timeWithTz).format('HH');

            const UniqSsData = _.uniqBy(hourRecords, 'id');
            transformedData.push({
                t,
                actual_t,
                s: UniqSsData,
                pageToken: null,
            });
        }
        return haveScreen ? transformedData : null;
    }

    /**Get download link for Dropbox file*/
    async getDownloadLink(dbx, file) {
        try {
            const response = await dbx.filesGetTemporaryLink({ path: file.path_lower });
            return response.link;
        } catch (error) {
            console.error('Dropbox getDownloadLink error:', error);
            return `https://content.dropboxapi.com/2/files/download?path=${encodeURIComponent(file.path_lower)}`;
        }
    }

    deleteCreds(organization_id) {
        return true;
    }
}

module.exports = new DropboxService();
