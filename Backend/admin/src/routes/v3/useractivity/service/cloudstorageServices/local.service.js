const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const Comman = require(`${utilsFolder}/helpers/Common`);

const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

/**
 * Local-disk ("LC") storage provider - read side. Mirrors the shape every
 * other driver in this directory implements (initConection/checkDataExists/
 * getScreenshotsFlat/getScreenRecords) so it plugs into
 * useractivity.controller.js's getScreenshootParallel_new_good/
 * getScreenRecords unchanged, exactly like S3/GD/etc.
 *
 * Files are written here by Backend/store-logs-api's LocalStorageUtils
 * (utils/local-storage.utils.ts) under:
 *   LOCAL_STORAGE_PATH/EmpMonitor/<email>/<HH-YYYY-MM-DD HH-mm-ss-scN>.png
 *   LOCAL_STORAGE_PATH/EmpMonitorRecords/<email>/<HH-YYYY-MM-DD HH-mm-ss>.mp4
 * and served publicly by nginx's /local-screenshots/ location block at
 * LOCAL_STORAGE_PUBLIC_URL (see /etc/nginx/sites-available/secknight-vision).
 */
class LocalStorage {
    constructor() {
        this.ssFolder = 'EmpMonitor';
        this.srFolder = 'EmpMonitorRecords';
    }

    getRoot() {
        return path.resolve(process.env.LOCAL_STORAGE_PATH || './public/local-storage');
    }

    getPublicUrl() {
        return (process.env.LOCAL_STORAGE_PUBLIC_URL || '').replace(/\/$/, '');
    }

    // No external connection needed for local disk - just resolve config
    // once so the rest of the driver doesn't re-read env vars per call.
    async initConection() {
        return { root: this.getRoot(), publicUrl: this.getPublicUrl() };
    }

    // Filenames look like "HH-YYYY-MM-DD HH-mm-ss-sc0.png" (screenshots) or
    // "HH-YYYY-MM-DD HH-mm-ss.mp4" (recordings) - both have the date at the
    // same split positions.
    fileDateMatches(filename, day) {
        const parts = filename.split('-');
        if (parts.length < 4) return false;
        const fileDate = `${parts[1]}-${parts[2]}-${parts[3].split(' ')[0]}`;
        return fileDate === day;
    }

    async listFiles(root, mainFolderName, email) {
        const dirPath = path.join(root, mainFolderName, email);
        try {
            return await readdirAsync(dirPath);
        } catch (err) {
            if (err.code === 'ENOENT') return [];
            throw err;
        }
    }

    // dayFolders is computed from a UTC conversion of the requested local
    // date/hour range (see parseHourRange in index.js), while filenames
    // encode the agent machine's local wall-clock date - matching those two
    // precisely here is unreliable across timezones. This is only a gate
    // check before getFilesData()'s real (timezone-correct) per-hour
    // filtering runs, so keep it simple: just confirm the employee has any
    // files at all. A false positive here just means getScreenshotsFlat
    // returns empty hour buckets, which the UI already handles gracefully.
    async checkDataExists({ root }, { mainFolderName, email }) {
        const files = await this.listFiles(root, mainFolderName, email);
        if (!files.length) return null;
        return { any: files.length };
    }

    // totalHour entries are UTC instants (see cloudstorageServices/index.js's
    // parseHourRange). Filenames, however, encode the AGENT MACHINE's local
    // wall-clock time (Agent/agent/screenshot.py uses datetime.now(), not
    // UTC - see file.utils.ts's `originalname.substr(3, 10)` day-key
    // extraction on the write side, which also uses the raw filename as-is).
    // Convert each UTC instant back to the employee's configured timezone
    // before matching, so "the local hour/day this UTC instant falls in" is
    // compared against "the local hour/day baked into the filename".
    async getFilesData({ conection, totalHour, mainFolder, email, timezone }) {
        const { root, publicUrl } = conection;
        const allFiles = await this.listFiles(root, mainFolder, email);

        return totalHour.map((time) => {
            const local = timezone ? moment(time).tz(timezone) : moment(time);
            const day = local.format('YYYY-MM-DD');
            const hour = local.format('HH');
            const matches = allFiles.filter(
                (name) => name.split('-')[0] === hour && this.fileDateMatches(name, day),
            );
            return matches.map((name) => ({
                name,
                url: `${publicUrl}/${mainFolder}/${encodeURIComponent(email)}/${encodeURIComponent(name)}`,
                filePath: path.join(root, mainFolder, email, name),
            }));
        });
    }

    async getScreenshotsFlat(conection, { totalHour, timezone, email }) {
        const screenshotsFlat = await this.getFilesData({ conection, totalHour, mainFolder: this.ssFolder, email, timezone });
        return this.transformScreenData({ screenshotsFlat, timezone, totalHour });
    }

    async getScreenRecords(conection, { totalHour, timezone, email }) {
        const screenRecords = await this.getFilesData({ conection, totalHour, mainFolder: this.srFolder, email, timezone });
        return this.transformRecordsData({ screenRecords, timezone, totalHour });
    }

    async transformScreenData({ screenshotsFlat, timezone, totalHour }) {
        return Promise.all(screenshotsFlat.map(async (files, index) => {
            const transformedData = await Promise.all(files.map(async (f) => {
                const stat = await statAsync(f.filePath).catch(() => null);
                return {
                    id: f.name,
                    actual: f.name,
                    timeslot: Comman.toTimezoneDateofSS_Timeslot(f.name, timezone),
                    name: Comman.toTimezoneDateofSS(f.name, timezone),
                    timeWithDate: Comman.toTimezoneDateofSSTimeWithDate(f.name, timezone),
                    link: f.url,
                    viewLink: f.url,
                    thumbnailLink: f.url,
                    created_at: stat ? stat.birthtime : null,
                    updated_at: stat ? stat.mtime : null,
                };
            }));
            const actual_t = moment(totalHour[index]).format('HH');
            const timeWithTz = moment.tz(totalHour[index], timezone);
            const t = moment(timeWithTz).format('HH');
            return { t, actual_t, s: transformedData, pageToken: null };
        }));
    }

    async transformRecordsData({ screenRecords, timezone, totalHour }) {
        return Promise.all(screenRecords.map(async (files, index) => {
            const transformedData = await Promise.all(files.map(async (f) => {
                const stat = await statAsync(f.filePath).catch(() => null);
                return {
                    id: f.name,
                    actual: f.name,
                    timeslot: Comman.toTimezoneDateofSR_Timeslot(f.name, timezone),
                    name: Comman.toTimezoneDateofSR(f.name, timezone),
                    timeWithDate: Comman.toTimezoneDateofSRTimeWithDate(f.name, timezone),
                    link: f.url,
                    created_at: stat ? stat.birthtime : null,
                    updated_at: stat ? stat.mtime : null,
                };
            }));
            const actual_t = moment(totalHour[index]).format('HH');
            const timeWithTz = moment.tz(totalHour[index], timezone);
            const t = moment(timeWithTz).format('HH');
            return { t, actual_t, s: transformedData, pageToken: null };
        }));
    }

    // No-ops so the driver satisfies every call site that other providers'
    // classes handle (profile pic upload, SFTP-only cred cleanup).
    async uploadScreen(mainFolderName, file, creds) {
        return null;
    }

    async deleteCreds() {
        return;
    }
}

module.exports = new LocalStorage();
