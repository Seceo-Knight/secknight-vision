const moment = require('moment');
const _ = require('lodash');

const Comman = require(`${utilsFolder}/helpers/Common`);
const S3Utils = require(`${utilsFolder}/helpers/S3Utils`);


class S3 {
    constructor() {
        this.initConection = S3Utils.initConection;
        this.uploadScreen = S3Utils.uploadScreen;
        this.uploadReport = S3Utils.uploadReport;
        this.ssFolder = 'EmpMonitor';
        this.srFolder = 'EmpMonitorRecords';
        this.is_custom_S3_format = false;
    }
    //Check folder exists on specific day 
    async checkDataExists(
        { s3, setParams },
        { mainFolderName, email, dayFolders },
        customData
    ) {
        if (customData?.type == "checkDataExists") {
            this.is_custom_S3_format = true;
            const keyDataArr = await Promise.all(
                dayFolders.map((day) => {
                    const prefix = `${mainFolderName}/${day}/${email}/`;
                    const params = setParams({ Prefix: prefix, MaxKeys: 1 });

                    return S3Utils.getKeyWithDate(s3, params, day);
                })
            );
            const dateFoldersKeys = {};
            keyDataArr.forEach((folder) => {
                if (folder.count) {
                    dateFoldersKeys[folder.name] = folder.count;
                }
            });
            if (_.isEmpty(dateFoldersKeys)) return null;

            return dateFoldersKeys;
        } else {
            this.is_custom_S3_format = false;
            const keyDataArr = await Promise.all(
                dayFolders.map((day) => {
                    const prefix = `${mainFolderName}/${email}/${day}/`;
                    const params = setParams({ Prefix: prefix, MaxKeys: 1 });
    
                    return S3Utils.getKeyWithDate(s3, params, day);
                })
            );
            const dateFoldersKeys = {};
            keyDataArr.forEach((folder) => {
                if (folder.count) {
                    dateFoldersKeys[folder.name] = folder.count;
                }
            });
            if (_.isEmpty(dateFoldersKeys)) return null;
    
            return dateFoldersKeys;
        }
    }

    getFilesData({ totalHour, marker, limit, email, dateFoldersId, conection, mainFolder }) {
        const screensPromises = totalHour.map(async (time) => {
            const day = moment(time).format('YYYY-MM-DD');
            const haveFolder = dateFoldersId[day];
            if (!haveFolder) {
                return { Contents: [] };
            }
            const hourPrefixTime = moment(time).format('HH');
            let hourPrefix = `${mainFolder}/${email}/${day}/${hourPrefixTime}`;
            if(this.is_custom_S3_format) {
                hourPrefix = `${mainFolder}/${day}/${email}/${hourPrefixTime}`;
            }

            // Pagination logic to fetch all data if NextMarker exists
            let allContents = [];
            let continuationToken = marker;
            let pageCount = 0;
            
            do {
                pageCount++;
                
                const response = await S3Utils.getObjects(conection, hourPrefix, continuationToken, limit);
                
                if (response.Contents && response.Contents.length > 0) {
                    allContents = allContents.concat(response.Contents);
                }

                continuationToken = response.NextMarker;
                
            } while (continuationToken);

            return { Contents: allContents, NextMarker: null };
        });

        return Promise.all(screensPromises);
    }

    //Get screenshots and sorted by current date 
    async getScreenshotsFlat(
        conection,
        { totalHour, timezone, ...creds }
    ) {
        const screenshotsFlat = await this.getFilesData({ conection, totalHour, timezone, mainFolder: this.ssFolder, ...creds });

        return this.transformScreenData({
            conection,
            screenshotsFlat,
            timezone,
            totalHour,
        });
    }

    async getScreenRecords(
        conection,
        { totalHour, timezone, ...creds }
    ) {
        const screenRecords = await this.getFilesData({ conection, totalHour, timezone, mainFolder: this.srFolder, ...creds });

        return this.transformRecordsData({
            conection,
            screenRecords,
            timezone,
            totalHour,
        });
    }

    //Transform records data in convenient format 
    transformRecordsData({ conection, screenRecords, timezone, totalHour }) {
        const { s3, setParams } = conection;

        let data =  screenRecords.map(({ Contents, NextMarker }, index) => {
            const transformedData = Contents.map((elem) => {
                const actual = _.last(elem.Key.split('/'));
                const params = setParams({
                    Key: elem.Key,
                    Expires: 2400,
                });
                const link = s3.getSignedUrl('getObject', params);

                return {
                    id: elem.Key,
                    actual,
                    timeslot: Comman.toTimezoneDateofSR_Timeslot(actual, timezone),
                    name: Comman.toTimezoneDateofSR(actual, timezone),
                    timeWithDate: Comman.toTimezoneDateofSRTimeWithDate(actual, timezone),
                    link,
                    created_at: elem.LastModified,
                    updated_at: elem.LastModified,
                };
            });
            const actual_t = moment(totalHour[index]).format('HH');
            const timeWithTz = moment.tz(totalHour[index], timezone);
            const t = moment(timeWithTz).format('HH');

            return {
                t,
                actual_t,
                s: transformedData,
                pageToken: NextMarker ? NextMarker : null,
            };
        });

        return data.map(i => {
            i.s = i.s.filter(s => {
                let actual = s.actual.split(".mp4")[0].slice(3,22);
                return moment.utc(moment(actual, "YYYY-MM-DD HH-mm-ss").format("YYYY-MM-DD HH:mm:ss")).isBetween(totalHour[0], totalHour[1]);
            });
            return i;
        })
    }

    //Transform screenData in convenient format 
    transformScreenData({ conection, screenshotsFlat, timezone, totalHour }) {
        const { s3, setParams } = conection;

        return screenshotsFlat.map(({ Contents, NextMarker }, index) => {
            const transformedData = Contents.map((elem) => {
                const actual = _.last(elem.Key.split('/'));
                const params = setParams({
                    Key: elem.Key,
                    Expires: 2400,
                });
                const link = s3.getSignedUrl('getObject', params);

                return {
                    id: elem.Key,
                    actual,
                    timeslot: Comman.toTimezoneDateofSS_Timeslot(actual, timezone),
                    name: Comman.toTimezoneDateofSS(actual, timezone),
                    timeWithDate: Comman.toTimezoneDateofSSTimeWithDate(actual, timezone),
                    link,
                    viewLink: link,
                    thumbnailLink: link,
                    created_at: elem.LastModified,
                    updated_at: elem.LastModified,
                };
            });
            const actual_t = moment(totalHour[index]).format('HH');
            const timeWithTz = moment.tz(totalHour[index], timezone);
            const t = moment(timeWithTz).format('HH');

            return {
                t,
                actual_t,
                s: transformedData,
                pageToken: NextMarker ? NextMarker : null,
            };
        });
    }

    getEmployeFolderId = async ({ s3, setParams }, { mainFolderName, email, creds }) => {
        const emailKey = `${mainFolderName}/${email}/`;
        let folderData = await S3Utils.getObjects({ s3, setParams }, emailKey);
        let folderPrefixes = folderData.CommonPrefixes;
        if (folderPrefixes.length <= 0) return emailKey;

        folderPrefixes = folderPrefixes.map(x => x.Prefix)

        folderPrefixes.map(async (folderKey) => {
            this.deleteKeys({ s3, setParams }, folderKey, creds.bucket_name)
        })
        return emailKey
    }

    deleteKeys = async ({ s3, setParams }, folderKey, bucket_name) => {
        let params = { Bucket: bucket_name, Delete: { Objects: [] } };
        let mailFolderContents = await S3Utils.getObjects({ s3, setParams }, folderKey);
        if (mailFolderContents.Contents < 0) return
        mailFolderContents.Contents.map(keydata => { params.Delete.Objects.push({ Key: keydata.Key }); })
        await s3.deleteObjects(params).promise();
    }

    async deleteEployeeScreenshots(conection, Key) {
        let data = await S3Utils.deleteObject(conection, Key);
    }
}

module.exports = new S3();

