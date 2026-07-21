const SftpClient = require("ssh2-sftp-client");

const fs  = require("fs");
const path = require("path");
const moment = require('moment-timezone');

const jwt = require('jsonwebtoken');
const Comman = require(`${utilsFolder}/helpers/Common`);

let sftpConnections = {};

class sftpServices {
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
                return `https://${prodDomain}/api/v3`;
            case 'development':
                return `https://${devDomain}/api/v3`;
            default:
                return `http://${localDomain}/api/v3`;
        }
    }
    
    async initConection(storage, organization_id) {
        if(Object.keys(sftpConnections).includes(`Storage_${organization_id}`)) {
            this.client = sftpConnections[`Storage_${organization_id}`]
            this.clientPath = storage.ftp_path;
            return this.client;
        }
        const sftp = new SftpClient();

        let connectionData = {
            host: storage.host,
            port: storage.port,
            username: storage.username,
        };

        if(storage.pemPath) connectionData.privateKey = Buffer.from(storage.pemPath.replace(/\\n/g, '\n'), 'utf-8');
        else connectionData.password = storage.password;

        await sftp.connect(connectionData);
        sftpConnections[`Storage_${organization_id}`] = sftp;
        this.client = sftp;
        this.clientPath = storage.ftp_path;
        return this.client;
    };

    async checkDataExists(connection, { mainFolderName, email, dayFolders}) {
        let response = [];
        for (const dayFolder of dayFolders) {
            let temp = await this.client.exists(`${this.clientPath}/${mainFolderName}/${email}/${dayFolder}`);
            response.push({
                date: dayFolder,
                isDataAvailable: temp,
            })
        }
        this.clientPath = `${this.clientPath}/${mainFolderName}/${email}`
        response = response.filter(i => i.isDataAvailable === 'd');
        return response.length === 0 ? false : response;
    }

    async getScreenshotsFlat(connection, { totalHour, limit, dateFoldersId, marker: pageToken, email, timezone, creds, organization_id }) {

        let screenshotList = [];
        for (const dateFolder of dateFoldersId) {
            let tempList = await this.client.list(`${this.clientPath}/${dateFolder.date}`);
            tempList = tempList.map(i => {
                i.pathLocation = `${this.clientPath}/${dateFolder.date}`;
                return i;
            })
            screenshotList = [...screenshotList, ...tempList];
        }
        let result = {};
        for (const tHours of totalHour) {
            if(Object.keys(result).includes(moment(tHours).format('YYYY-MM-DD'))) {
                result[moment(tHours).format('YYYY-MM-DD')] = [...result[moment(tHours).format('YYYY-MM-DD')], ...screenshotList.filter( i => i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')))]
            }
            else {
                result[moment(tHours).format('YYYY-MM-DD')] = screenshotList.filter( i => i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')));
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

    parseLink(path, encodedCreds) {
        return `${this.domain}/sftp-http-proxy?path=${path}&store=${encodedCreds}`;
    }

    transformScreenData({ creds, screenshots, timezone, totalHour, organization_id }) {
        let haveScreen = false;
        const encodedCreds = this.encodeCreds({...creds, organization_id}, '1h');
        const ssData = totalHour.map((hour) => {
            const actual_t = moment(hour).format('HH');
            const transformedData = [];
            if (Object.keys(screenshots).includes(moment(hour).format('YYYY-MM-DD'))) {
                screenshots[moment(hour).format('YYYY-MM-DD')] = screenshots[moment(hour).format('YYYY-MM-DD')].filter((screen) => {
                    const [prefix] = screen.name.split('-');
                    if (prefix === actual_t) {
                        const path = `${screen.pathLocation}/${screen.name}`;
                        const screenData = {
                            id: path,
                            actual: screen.name,
                            name: Comman.toTimezoneDateFormat(screen.name, timezone, 'time'),
                            timeslot: Comman.toTimezoneDateFormat(
                                screen.name,
                                timezone,
                                'timeSlot',
                            ),
                            utc: Comman.toTimezoneDateFormat(screen.name, timezone, 'utc'),
                            viewLink: this.parseLink(path, encodedCreds),
                            link: this.parseLink(path, encodedCreds),
                            thumbnailLink: this.parseLink(path, encodedCreds),
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
        if(Object.keys(sftpConnections).includes(`Storage_${organization_id}`)) {
            delete sftpConnections[`Storage_${organization_id}`];
        }
    }

    async uploadScreen(folderName, file, creds, organization_id) {
        await this.initConection(creds, organization_id);
        let dirList = await this.client.exists(`${this.clientPath}/${folderName}`);
        if(!dirList) {
            // create a new directory
            await this.client.mkdir(`${this.clientPath}/${folderName}`);
        }
        await this.client.put(file.path, `${this.clientPath}/${folderName}/${file.filename}`);
        const encodedCreds = this.encodeCreds({...creds, organization_id}, '1h');
        return (this.parseLink(`${this.clientPath}/${folderName}/${file.filename}`, encodedCreds))
    }

    async getEmployeFolderId(conection, { mainFolderName, email, creds }) {
        let dirList = await this.client.exists(`${this.clientPath}/${mainFolderName}/${email}`);
        if(dirList) return `${this.clientPath}/${mainFolderName}/${email}`;
        else dirList;
    }

    async deleteEployeeScreenshots(connection, path) {
        await this.client.rmdir(path, true);
    }

    async getScreenRecords(conection, { totalHour, limit, dateFoldersId, marker: pageToken, email, timezone, creds }) {
        let screenshotList = [];
        for (const dateFolder of dateFoldersId) {
            let tempList = await this.client.list(`${this.clientPath}/${dateFolder.date}`);
            tempList = tempList.map(i => {
                i.pathLocation = `${this.clientPath}/${dateFolder.date}`;
                return i;
            })
            screenshotList = [...screenshotList, ...tempList];
        }
        let result = {};
        for (const tHours of totalHour) {
            if(Object.keys(result).includes(moment(tHours).format('YYYY-MM-DD'))) {
                result[moment(tHours).format('YYYY-MM-DD')] = [...result[moment(tHours).format('YYYY-MM-DD')], ...screenshotList.filter( i => i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')))]
            }
            else {
                result[moment(tHours).format('YYYY-MM-DD')] = screenshotList.filter( i => i.name.includes(moment(tHours).format('HH-YYYY-MM-DD HH')));
            }
        }

        return this.transformScreenRecordData({
            creds,
            screenshots: result,
            timezone,
            totalHour,
            organization_id: creds.organization_id
        });
    }

    transformScreenRecordData({ creds, screenshots, timezone, totalHour, organization_id }) {
        let haveScreen = false;
        const encodedCreds = this.encodeCreds({...creds, organization_id}, '1h');
        const ssData = totalHour.map((hour) => {
            const actual_t = moment(hour).format('HH');
            const transformedData = [];
            if (Object.keys(screenshots).includes(moment(hour).format('YYYY-MM-DD'))) {
                screenshots[moment(hour).format('YYYY-MM-DD')] = screenshots[moment(hour).format('YYYY-MM-DD')].filter((screen) => {
                    const [prefix] = screen.name.split('-');
                    if (prefix === actual_t) {
                        const path = `${screen.pathLocation}/${screen.name}`;
                        console.log(screen.name);
                        const screenData = {
                            id: path,
                            actual: screen.name,
                            name: Comman.toTimezoneDateFormat(screen.name, timezone, 'time'),
                            timeslot: Comman.toTimezoneDateFormat(
                                screen.name,
                                timezone,
                                'timeSlot',
                            ),
                            utc: Comman.toTimezoneDateFormat(screen.name, timezone, 'utc'),
                            viewLink: this.parseLink(path, encodedCreds),
                            link: this.parseLink(path, encodedCreds),
                            thumbnailLink: this.parseLink(path, encodedCreds),
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
}


module.exports = new sftpServices;