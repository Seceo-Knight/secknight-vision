const fs = require('fs');
const { promisify } = require('util');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const createError = require('./storageErrors/index');

const storages = {
    GD: require('./googleDrive.service'),
    S3: require('./s3.service'),
    MO: require('./oneDrive.service'),
    ZH: require('./zohoWorkDrive.service'),
    FTP: require('./ftp.service'),
    SFTP: require('./sftp.service'),
    DB: require('./dropbox.service'),
    WD: require('./webdav.service'),
}

class CloudStorageServices {
    constructor(createError) {
        this.createError = createError;
    }

    getStorage(name) {
        return storages[name];
    }

   async deleteFileFromLocal(name) {
       try {
            const unlinkWithPromise = promisify(fs.unlink);

            return await unlinkWithPromise(`${publicFolder}/images/profilePic/${name}`);
        } catch (error) {
            if(error.message && error.message.includes('no such file or directory')) {
                return;
            }
           throw error;
        }  
    }

    parseHourRange({ from, to, date, timezone }) {
        const start = moment.tz(date, 'YYYY-MM-DD', timezone).set({ hours: from }).tz('UTC');
        let end = moment.tz(date, 'YYYY-MM-DD', timezone).set({ hours: to }).tz('UTC');
        end = moment().tz(timezone).format('Z').includes(':30') ? moment(end).add(1, 'h') : end;
        const range = moment.range(start, end);
        const totalHour = Array.from(range.by('hours', { excludeEnd: false }));
        const startDay = start.format('YYYY-MM-DD');
        const endDay = end.format('YYYY-MM-DD');
        const dayFolders = startDay === endDay ? [startDay] : [startDay, endDay];

        return { totalHour, dayFolders }
    }

    createSlots(screenshotsFlat, total_hour, timezone) {
        let newSortedData = screenshotsFlat.map(({ data }, index) => {
            return {
                t: moment.tz(moment(total_hour[index].h, 'HH'), timezone).format('HH'),
                actual_t: total_hour[index].h,
                s: [],
                pageToken: null,
            }
        });
        return newSortedData;
    }

}

module.exports = new CloudStorageServices(createError);