const moment = require('moment');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const fs = require('fs');
// const exifremove = require('exifremove');
// const exifremove = require('../../../../../utils/helpers/exifRemove');

const FTPUtils = require(`${utilsFolder}/helpers/FTPUtils`);
const Comman = require(`${utilsFolder}/helpers/Common`);

class FTP {
    constructor() {
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

    async initConection({ ftp_path, ...creds }) {
        const client = await FTPUtils.initConection(creds);
        return {
            client,
            ftp_path,
        };
    }

    /**upload screenshot to ftp server*/
    async uploadScreen(folderName, file, { ftp_path, ...creds }) {
        const { originalname, filename: name } = file;
        const folderPath = ftp_path + folderName;
        const client = await FTPUtils.initConection(creds);
        const ftp_promise_client = await FTPUtils.initConectionForPromiseFtp(creds);
        const checkDirpromise = client.ensureDir(folderPath);
        const fileStream = fs.createReadStream(
            `${publicFolder}/images/profilePic/${name}`,
        );

        // const fileStream = exifremove.remove(content);
        const ext = _.last(originalname.split('.'));
        const fullName = `${name}.${ext}`;

        await checkDirpromise;
        await ftp_promise_client.put(fileStream, `/${folderPath}/${fullName}`);

        // await client.uploadFrom(
        //     `${publicFolder}/images/profilePic/${name}`,
        //     fullName
        // );
        await client.close();
        await ftp_promise_client.end();
        const encodedCreds = this.encodeCreds(creds, '90d');
        const path = `${folderPath}/${fullName}`;

        return this.parseLink(path, encodedCreds);
    }

    async *partLoader(dayFolderPaths, client) {
        let i = 0;
        const days = Object.keys(dayFolderPaths);

        while (i < days.length) {
            const day = days[i];
            const parentPath = dayFolderPaths[day];
            const data = await client.list(parentPath);

            yield { day, data, parentPath };
            i += 1;
        }
    }

    /**Check folder exists on specific day */
    async checkDataExists(
        { client, ftp_path },
        { mainFolderName, email, dayFolders },
    ) {
        const emailFolderPath = `${ftp_path}${mainFolderName}/${email}`;
        let data = await client.list(emailFolderPath);
        const dayFoldersPaths = {};
        dayFolders.map((day) => {
            data = data.filter(({ name }) => {
                if (name === day) {
                    dayFoldersPaths[day] = `${emailFolderPath}/${day}`;
                    return false;
                }
                return true;
            });
        });

        if (_.isEmpty(dayFoldersPaths)) return null;

        return dayFoldersPaths;
    }

    /**Get screenshots and sorted by current date */
    async getScreenshotsFlat(
        { client },
        { creds, dateFoldersId, timezone, totalHour },
    ) {
        const screenshots = {};
        for await (let files of this.partLoader(dateFoldersId, client)) {
            screenshots[files.day] = {
                data: files.data,
                parentPath: files.parentPath,
            };
        }

        client.close();

        return this.transformScreenData({
            creds,
            screenshots,
            timezone,
            totalHour,
        });
    }

    /**Get screenshots and sorted by current date */
    async getScreenRecords(
        { client },
        { creds, dateFoldersId, timezone, totalHour },
    ) {
        const screenRecords = {};
        for await (let files of this.partLoader(dateFoldersId, client)) {
            screenRecords[files.day] = {
                data: files.data,
                parentPath: files.parentPath,
            };
        }

        client.close();

        return this.transformRecordsData({
            creds,
            screenRecords,
            timezone,
            totalHour,
        });
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

    parseLink(path, encodedCreds) {
        return `${this.domain}/ftp-http-proxy?path=${path}&store=${encodedCreds}`;
    }

    /**Transform screenData in convenient format */
    transformRecordsData({ creds, screenRecords, timezone, totalHour }) {
        let haveScreen = false;
        const encodedCreds = this.encodeCreds(creds, '1h');
        const ssData = totalHour.map((hour) => {
            const actual_t = moment(hour).format('HH');
            const transformedData = [];
            const currentDayRecords =
                screenRecords[moment(hour).format('YYYY-MM-DD')];
            if (currentDayRecords) {
                currentDayRecords.data = currentDayRecords.data.filter((record) => {
                    const [prefix] = record.name.split('-');
                    if (prefix === actual_t) {
                        const path = `${currentDayRecords.parentPath}/${record.name}`;
                        const recordData = {
                            id: path,
                            actual: record.name,
                            timeslot: Comman.toTimezoneDateofSR_Timeslot(
                                record.name,
                                timezone,
                            ),
                            name: Comman.toTimezoneDateofSR(record.name, timezone),
                            timeWithDate: Comman.toTimezoneDateofSRTimeWithDate(
                                record.name,
                                timezone,
                            ),
                            link: this.parseLink(path, encodedCreds),
                            created_at: record.modifiedAt,
                            updated_at: record.modifiedAt,
                        };
                        transformedData.push(recordData);
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

    /**Transform screenData in convenient format */
    transformScreenData({ creds, screenshots, timezone, totalHour }) {
        let haveScreen = false;
        const encodedCreds = this.encodeCreds(creds, '1h');
        const ssData = totalHour.map((hour) => {
            const actual_t = moment(hour).format('HH');
            const transformedData = [];
            const currentDayScreens = screenshots[moment(hour).format('YYYY-MM-DD')];
            if (currentDayScreens) {
                currentDayScreens.data = currentDayScreens.data.filter((screen) => {
                    const [prefix] = screen.name.split('-');
                    if (prefix === actual_t) {
                        const path = `${currentDayScreens.parentPath}/${screen.name}`;
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


    /**Get Employee folder*/
    async getEmployeFolderId(
        { client, ftp_path },
        { mainFolderName, email, },
    ) {
        const emailFolderPath = `${ftp_path}${mainFolderName}/${email}`;
        let data = await client.list(emailFolderPath);
        if (data.length == 0 || !data) {
            await client.removeDir(`/${emailFolderPath}`);
            return null;
        }

        return emailFolderPath;
    }

    async deleteEployeeScreenshots({ client, ftp_path }, folderPath,) {
        return await client.removeDir(`/${folderPath}`);
    }
}

module.exports = new FTP();
