const { createClient } = require("webdav");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

const Comman = require(`${utilsFolder}/helpers/Common`);

let webdavConnections = {};

class webdavServices {
    constructor() {
        this.client;
        this.domain = this.getDomain();
    }

    getDomain() {
        const {
            NODE_ENV: env,
            API_URL_LOCAL: localDomain,
            API_URL_DEV: devDomain,
            API_URL_PRODUCTION: prodDomain,
        } = process.env;

        switch (env) {
            case 'production':
                return `${process.env.IS_HTTP_HTTPS}://${prodDomain}/api/v3`;
            case 'development':
                return `${process.env.IS_HTTP_HTTPS}://${devDomain}/api/v3`;
            default:
                return `${process.env.IS_HTTP_HTTPS}://${localDomain}/api/v3`;
        }
    }

    async initConection(storage, organization_id) {
        const baseUrl = storage.baseUrl || storage.url || `${storage.host || ''}${storage.port ? `:${storage.port}` : ''}`;
        const clientPath = storage.webdav_path || storage.basePath || storage.path || '/';

        // If we have a cached entry, validate it against incoming creds and a simple probe.
        if (Object.prototype.hasOwnProperty.call(webdavConnections, `Storage_${organization_id}`)) {
            const entry = webdavConnections[`Storage_${organization_id}`];
            const sameCreds =
                entry.baseUrl === baseUrl &&
                (entry.username || '') === (storage.username || '') &&
                (entry.password || '') === (storage.password || '') &&
                (entry.clientPath || '/') === (clientPath || '/');

            if (sameCreds) {
                // Quick probe to ensure cached client is still valid for the path.
                try {
                    await entry.client.getDirectoryContents(entry.clientPath);
                    this.client = entry.client;
                    this.clientPath = entry.clientPath;
                    return this.client;
                } catch (err) {
                    // Cached client appears invalid; remove and recreate below.
                    try { delete webdavConnections[`Storage_${organization_id}`]; } catch (e) {}
                }
            } else {
                // Credentials or path changed — remove cached client so we re-create with new creds.
                try { delete webdavConnections[`Storage_${organization_id}`]; } catch (e) {}
            }
        }

        const options = {};
        if (storage.username) options.username = storage.username;
        if (storage.password) options.password = storage.password;

        const client = createClient(baseUrl, options);

        webdavConnections[`Storage_${organization_id}`] = {
            client,
            baseUrl,
            username: storage.username || '',
            password: storage.password || '',
            clientPath,
        };
        this.client = client;
        this.clientPath = clientPath;

        // Probe the connection to validate credentials/path. If probe fails, remove cached entry and propagate error.
        try {
            await this.client.getDirectoryContents(this.clientPath);
            return this.client;
        } catch (err) {
            try { delete webdavConnections[`Storage_${organization_id}`]; } catch (e) {}
            throw err;
        }
    }

    parseLink(pathLocation, encodedCreds) {
        return `${this.domain}/webdav-http-proxy?path=${encodeURIComponent(pathLocation)}&store=${encodedCreds}`;
    }

    encodeCreds(creds, expiresIn) {
        return jwt.sign(
            {
                creds,
            },
            process.env.FTP_HTTP_PROXY_KEY,
            { expiresIn },
        );
    }

    deleteCreds(organization_id) {
        if (Object.keys(webdavConnections).includes(`Storage_${organization_id}`)) {
            delete webdavConnections[`Storage_${organization_id}`];
        }
    }

    /**
     * Uploads a file to WebDAV.
     * @param {String} folderName - target folder relative to clientPath
     * @param {Object} file - file object { path, filename, originalname, size }
     * @param {Object} creds - storage credentials/config
     * @param {String|Number} organization_id
     */
    async uploadScreen(folderName, file, creds, organization_id) {
        await this.initConection(creds, organization_id);

        const remoteFolder = path.posix.join(this.clientPath, folderName);
        const remotePath = path.posix.join(remoteFolder, file.filename || file.originalname);

        try {
            // ensure folder exists - create directory if needed
            // webdav client does not throw on mkdir if exists in many implementations, but guard it
            try {
                await this.client.getDirectoryContents(remoteFolder);
            } catch (err) {
                // try to create directory
                try {
                    await this.client.createDirectory(remoteFolder);
                } catch (e) {
                    // ignore if cannot create and let upload attempt possibly fail afterwards
                }
            }

            const stream = fs.createReadStream(file.path);
            await this.client.putFileContents(remotePath, stream, { overwrite: true });

            const encodedCreds = this.encodeCreds({ ...creds, organization_id }, '1h');
            return this.parseLink(remotePath, encodedCreds);
        } catch (err) {
            // rethrow for caller to handle
            throw err;
        }
    }

    async checkDataExists(connection, { mainFolderName, email, dayFolders, a_email }) {
        let response = [];
        for (const dayFolder of dayFolders) {
            const p = path.posix.join(this.clientPath, mainFolderName, email, dayFolder);
            try {
                const data = await this.client.getDirectoryContents(p);
                response.push({
                    date: dayFolder,
                    isDataAvailable: 'd',
                    email: email,
                });
            } catch (err) {
                response.push({
                    date: dayFolder,
                    isDataAvailable: false,
                    email: email,
                });
            }
        }
        response = response.filter(i => i.isDataAvailable === 'd');
        return response.length === 0 ? false : response;
    }

    async getScreenshotsFlat(connection, { totalHour, limit, dateFoldersId, marker: pageToken, email, timezone, creds, organization_id }) {
        let screenshotList = [];
        for (const dateFolder of dateFoldersId) {
            const dir = path.posix.join(this.clientPath, 'EmpMonitor', dateFolder.email, dateFolder.date);
            let tempList = [];
            try {
                tempList = await this.client.getDirectoryContents(dir);
            } catch (e) {
                tempList = [];
            }
            tempList = tempList.map(i => {
                const name = i.basename || path.posix.basename(i.filename || '');
                return {
                    name,
                    pathLocation: dir,
                    modifiedAt: i.lastmod || i.etag || null,
                };
            });
            screenshotList = [...screenshotList, ...tempList];
        }
        let result = {};
        for (const tHours of totalHour) {
            const day = moment(tHours).format('YYYY-MM-DD');
            if (Object.keys(result).includes(day)) {
                result[day] = [...result[day], ...screenshotList.filter(i => i.name && i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')))];
            } else {
                result[day] = screenshotList.filter(i => i.name && i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')));
            }
        }

        return this.transformScreenData({
            creds,
            screenshots: result,
            timezone,
            totalHour,
            organization_id
        });
    }

    async getVideoFlat(connection, { totalHour, limit, dateFoldersId, marker: pageToken, email, timezone, creds, organization_id }) {
        let videoList = [];
        for (const dateFolder of dateFoldersId) {
            const dir = path.posix.join(this.clientPath, 'EmpMonitor_Video', dateFolder.email, dateFolder.date);
            let tempList = [];
            try {
                tempList = await this.client.getDirectoryContents(dir);
            } catch (e) {
                tempList = [];
            }
            tempList = tempList.map(i => {
                const name = i.basename || path.posix.basename(i.filename || '');
                return {
                    name,
                    pathLocation: dir,
                    modifiedAt: i.lastmod || i.etag || null,
                };
            });
            videoList = [...videoList, ...tempList];
        }
        let result = {};
        for (const tHours of totalHour) {
            const day = moment(tHours).format('YYYY-MM-DD');
            if (Object.keys(result).includes(day)) {
                result[day] = [...result[day], ...videoList.filter(i => i.name && i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')))];
            } else {
                result[day] = videoList.filter(i => i.name && i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')));
            }
        }

        return this.transformScreenData({
            creds,
            screenshots: result,
            timezone,
            totalHour,
            organization_id
        });
    }

    transformScreenData({ creds, screenshots, timezone, totalHour, organization_id }) {
        let haveScreen = false;
        const encodedCreds = this.encodeCreds({ ...creds, organization_id }, '1h');
        const ssData = totalHour.map((hour) => {
            const actual_t = moment(hour).format('HH');
            const transformedData = [];
            if (Object.keys(screenshots).includes(moment(hour).format('YYYY-MM-DD'))) {
                screenshots[moment(hour).format('YYYY-MM-DD')] = screenshots[moment(hour).format('YYYY-MM-DD')].filter((screen) => {
                    const [prefix] = screen.name.split('-');
                    if (prefix === actual_t) {
                        const pathLocation = `${screen.pathLocation}/${screen.name}`;
                        const screenData = {
                            id: pathLocation,
                            actual: screen.name,
                            name: Comman.toTimezoneDateFormat(screen.name, timezone, 'time'),
                            timeslot: Comman.toTimezoneDateFormat(
                                screen.name,
                                timezone,
                                'timeSlot',
                            ),
                            utc: Comman.toTimezoneDateFormat(screen.name, timezone, 'utc'),
                            viewLink: this.parseLink(pathLocation, encodedCreds),
                            link: this.parseLink(pathLocation, encodedCreds),
                            thumbnailLink: this.parseLink(pathLocation, encodedCreds),
                            created_at: screen.modifiedAt,
                            updated_at: screen.modifiedAt,
                        };
                        transformedData.push(screenData);
                        haveScreen = true;
                        return false;
                    }

                    return true;
                });
            }

            const timeWithTz = moment.tz(hour, timezone);
            const t = moment(timeWithTz).format('HH');

            return {
                t,
                actual_t,
                s: transformedData,
                count: transformedData.length,
                pageToken: null,
            };
        });

        return haveScreen ? ssData : null;
    }

    async getScreenRecords(connection, { totalHour, limit, dateFoldersId, marker: pageToken, email, timezone, creds, organization_id }) {
        let recordList = [];
        for (const dateFolder of dateFoldersId) {
            const dir = path.posix.join(this.clientPath, 'EmpMonitorRecords', dateFolder.email, dateFolder.date);
            let tempList = [];
            try {
                tempList = await this.client.getDirectoryContents(dir);
            } catch (e) {
                tempList = [];
            }
            tempList = tempList.map(i => {
                const name = i.basename || path.posix.basename(i.filename || '');
                return {
                    name,
                    pathLocation: dir,
                    modifiedAt: i.lastmod || i.etag || null,
                };
            });
            recordList = [...recordList, ...tempList];
        }
        let result = {};
        for (const tHours of totalHour) {
            const day = moment(tHours).format('YYYY-MM-DD');
            if (Object.keys(result).includes(day)) {
                result[day] = [...result[day], ...recordList.filter(i => i.name && i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')))];
            } else {
                result[day] = recordList.filter(i => i.name && i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')));
            }
        }

        return this.transformRecordsData({
            creds,
            screenRecords: result,
            timezone,
            totalHour,
            organization_id
        });
    }

    transformRecordsData({ creds, screenRecords, timezone, totalHour, organization_id }) {
        const encodedCreds = this.encodeCreds({ ...creds, organization_id }, '1h');
        let data = totalHour.map((hour) => {
            const actual_t = moment(hour).format('HH');
            const transformedData = [];
            if (Object.keys(screenRecords).includes(moment(hour).format('YYYY-MM-DD'))) {
                screenRecords[moment(hour).format('YYYY-MM-DD')] = screenRecords[moment(hour).format('YYYY-MM-DD')].filter((screen) => {
                    const [prefix] = screen.name.split('-');
                    if (prefix === actual_t) {
                        const pathLocation = `${screen.pathLocation}/${screen.name}`;
                        const screenData = {
                            id: pathLocation,
                            actual: screen.name,
                            timeslot: Comman.toTimezoneDateofSR_Timeslot(screen.name, timezone),
                            name: Comman.toTimezoneDateofSR(screen.name, timezone),
                            timeWithDate: Comman.toTimezoneDateofSRTimeWithDate(screen.name, timezone),
                            link: this.parseLink(pathLocation, encodedCreds),
                            created_at: screen.modifiedAt,
                            updated_at: screen.modifiedAt,
                        };
                        transformedData.push(screenData);
                        return false;
                    }

                    return true;
                });
            }

            const timeWithTz = moment.tz(hour, timezone);
            const t = moment(timeWithTz).format('HH');

            return {
                t,
                actual_t,
                s: transformedData,
                pageToken: null,
            };
        });

        return data.map(i => {
            i.s = i.s.filter(s => {
                let actual = s.actual.split(".mp4")[0].slice(3,22);
                return moment.utc(moment(actual, "YYYY-MM-DD HH-mm-ss").format("YYYY-MM-DD HH:mm:ss")).isBetween(totalHour[0], totalHour[1]);
            });
            return i;
        });
    }

    async getEmployeFolderId(connection, { mainFolderName, email, creds }) {
        // For WebDAV, folders are path-based. Return the path if it exists.
        await this.initConection(creds, creds.organization_id);
        const folderPath = path.posix.join(this.clientPath, mainFolderName, email);
        try {
            const exists = await this.client.getDirectoryContents(folderPath);
            return folderPath;
        } catch (err) {
            return null;
        }
    }

    async deleteEployeeScreenshots(conection, Key) {
        // Key is expected to be the full remote path to delete
        try {
            await this.initConection(conection, conection.organization_id);
        } catch (err) {
            // ignore init errors here; client may already be initialized
        }

        try {
            await this.client.deleteFile(Key);
        } catch (err) {
            // Some webdav servers may require deleting directories differently
            try {
                await this.client.deleteFile(Key.replace(/\/$/, ''));
            } catch (e) {
                throw err;
            }
        }
    }
}

module.exports = new webdavServices();

