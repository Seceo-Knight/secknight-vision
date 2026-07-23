const moment = require('moment');
const _ = require('underscore');
const async = require('async');
const fs = require('fs').promises;
const path = require('path');
const ScreenshotModel = require('./screenshot.model');
const ScreenshotValidation = require('./screenshot.validation');
const sendResponse = require('../../../utils/myService').sendResponse;
const AmazonSSS = require('../../../utils/helpers/AmazonSSS');
const Logger = require('../../../logger/Logger').logger;
const CloudStorageService = require('./service/google-drive.service');
const Comman = require('../../../utils/helpers/Common');
const { genericErrorMessage } = require('../../../utils/helpers/LanguageTranslate');
const { translate } = require('../../../utils/messageTranslation');

// Local-disk ("LC") screenshot provider read-side. Mirrors the GD/S3 branches
// below but lists files straight off disk instead of calling a cloud API.
// LOCAL_STORAGE_PATH must point at the SAME directory store-logs-api's
// LocalStorageUtils writes into (Backend/store-logs-api/.env's
// LOCAL_STORAGE_PATH, e.g. /root/secknight-vision/Backend/store-logs-api/public/local-storage).
// LOCAL_STORAGE_PUBLIC_URL is the public base URL nginx serves that same
// directory under (see the /local-screenshots/ location block).
async function getLocalScreenshots(user_data, date, total_hour) {
    const root = process.env.LOCAL_STORAGE_PATH;
    const publicUrl = (process.env.LOCAL_STORAGE_PUBLIC_URL || '').replace(/\/$/, '');
    if (!root || !publicUrl) {
        throw new Error('LOCAL_STORAGE_PATH / LOCAL_STORAGE_PUBLIC_URL not configured in admin .env');
    }

    const email = user_data[0].email;
    const timezone = user_data[0].timezone;
    const folderPath = path.join(root, 'EmpMonitor', email);

    let filenames = [];
    try {
        filenames = await fs.readdir(folderPath);
    } catch (err) {
        if (err.code === 'ENOENT') filenames = []; // no screenshots yet for this user
        else throw err;
    }

    // Filenames look like "HH-YYYY-MM-DD HH-mm-ss-sc0.png" (see
    // Backend/store-logs-api/.../utils/file.utils.ts imageFileFilter).
    // Only keep files whose embedded date matches the requested date.
    const matching = filenames.filter((name) => {
        const parts = name.split('-');
        if (parts.length < 7) return false;
        const fileDate = `${parts[1]}-${parts[2]}-${parts[3].split(' ')[0]}`;
        return fileDate === date;
    });

    const result = [];
    for (const h of total_hour) {
        const hourFiles = matching.filter((name) => name.split('-')[0] === h);
        const finalData = [];
        for (const name of hourFiles) {
            const link = `${publicUrl}/EmpMonitor/${encodeURIComponent(email)}/${encodeURIComponent(name)}`;
            let stat;
            try {
                stat = await fs.stat(path.join(folderPath, name));
            } catch {
                stat = null;
            }
            finalData.push({
                id: name,
                actual: name,
                timeslot: Comman.toTimezoneDateofSS_Timeslot(name, timezone),
                name: Comman.toTimezoneDateofSS(name, timezone),
                utc: Comman.toTimezoneDateofSSutc(name, timezone),
                link,
                viewLink: link,
                thumbnailLink: link,
                created_at: stat ? stat.birthtime : null,
                updated_at: stat ? stat.mtime : null,
            });
        }
        result.push({
            t: moment.tz(moment(h, 'HH'), timezone).format('HH'),
            actual_t: h,
            s: finalData,
            pageToken: null,
        });
    }
    return result;
}

class ScreenshotController {
    async getScreenshootParallel_new(req, res) {
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        let result = [];
        let from = parseInt(req.body.from_hour);
        let to = parseInt(req.body.to_hour - 1);
        let date = moment(req.body.date).format('YYYY-MM-DD'); //'2019-12-23'
        let user_id = req.body.user_id;
        let limit = req.body.limit || 10;
        let pageToken = req.body.pageToken || '';
        let total_hour = [];

        if (from > to) return sendResponse(res, 400, null, 'To time more than from time ', null);
        for (let i = from; i <= to; i++) {
            total_hour.push(Array(Math.max(2 - String(i).length + 1, 0)).join(0) + i);
        }
        let validate = ScreenshotValidation.validateScreenshot({ user_id, date, limit, pageToken, from, to });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        try {
            let user_data = await ScreenshotModel.user(user_id);
            if (user_data.length === 0) return sendResponse(res, 400, null, 'User not found.', null);

            let credsData = await ScreenshotModel.getStorageDetail(organization_id);
            if (credsData.length === 0) return sendResponse(res, 400, null, 'Not Found Active Storage !', null);

            let creds = JSON.parse(credsData[0].creds);
            if (credsData[0].short_code == 'GD') {
                /**Get main EmpMonitor Folder Id */
                const mainFolder = await CloudStorageService.getFolderByName('EmpMonitor', creds.client_id, creds.client_secret, creds.refresh_token);
                if (mainFolder.length === 0) return sendResponse(res, 400, null, translate(genericErrorMessage, 'NO_SCREENSHOTS_FOR_USER_SELECTED_DATE', language), null);

                /**Get mail id folder Id like basavarajshiralashetti@globussoft.in */
                const mailFolder = await CloudStorageService.getFolderIdByParentId(mainFolder.files[0].id, user_data[0].email, creds.client_id, creds.client_secret, creds.refresh_token);
                if (mailFolder.length === 0) return sendResponse(res, 400, null, translate(genericErrorMessage, 'NO_SCREENSHOTS_FOR_USER_SELECTED_DATE', language), null);

                /**Get date folder Id like 2020-04-03 */
                const dateIdData = await CloudStorageService.getFolderIdByParentId(mailFolder, date, creds.client_id, creds.client_secret, creds.refresh_token);
                if (dateIdData.length === 0) return sendResponse(res, 400, null, translate(genericErrorMessage, 'NO_SCREENSHOTS_FOR_USER_SELECTED_DATE', language), null);

                /**Get each hour screenshot data */
                async.forEach(total_hour, (h, callback) => {
                    CloudStorageService.getScreenshootFromToDatecb(dateIdData, `name contains ' ${h}-${date}'`, creds.client_id, creds.client_secret, creds.token, creds.refresh_token, pageToken, limit, (err, screenshootData) => {
                        if (err) callback();
                        let finalData = [];
                        async.forEach(screenshootData.data.files, (e, cb) => {
                            finalData.push({
                                id: e.id,
                                actual: e.name,
                                timeslot: Comman.toTimezoneDateofSS_Timeslot(e.name, user_data[0].timezone),
                                name: Comman.toTimezoneDateofSS(e.name, user_data[0].timezone),
                                utc: Comman.toTimezoneDateofSSutc(e.name, user_data[0].timezone),
                                link: e.webContentLink.replace(/&amp;/g, "&"),
                                viewLink: e.webViewLink,
                                thumbnailLink: e.thumbnailLink,
                                created_at: e.createdTime,
                                updated_at: e.modifiedTime
                            })
                            cb();
                        }, () => {
                            if (finalData.length > 0) {
                                var obj = {
                                    t: moment.tz(moment(h, 'HH'), user_data[0].timezone).format('HH'),
                                    actual_t: h,
                                    s: finalData,
                                    pageToken: screenshootData.data.nextPageToken ? screenshootData.data.nextPageToken : null
                                }
                                result.push(obj);
                                callback();
                            } else {
                                var obj = {
                                    t: moment.tz(moment(h, 'HH'), user_data[0].timezone).format('HH'),
                                    actual_t: h,
                                    s: finalData,
                                    pageToken: screenshootData.data.nextPageToken ? screenshootData.data.nextPageToken : null
                                }
                                result.push(obj);
                                callback();
                            }
                        })
                    });
                }, () => {
                    let r = _.sortBy(result, "t");
                    return sendResponse(res, 200, { storage: 'GD', name: user_data[0].name + ' ' + user_data[0].full_name, photo_path: user_data[0].photo_path, email: user_data[0].email, user_id: user_data[0].id, screenshot: r }, 'Screenshot data ', null);
                });
            } else if (credsData[0].short_code == 'S3') {
                /**Get screenshots from s3 bucket */
                let prefix = `EmpMonitor/${user_data[0].email}/${date}/`;
                let keyData = await CloudStorageService.checkDataExists(creds.client_id, creds.client_secret, creds.region, creds.bucket_name, prefix);
                if (keyData.Contents.length === 0) return sendResponse(res, 400, null, 'No Screenshot Present For This User With Selected Date.', null);

                async.forEach(total_hour, (h, callback) => {
                    let hour_prefix = `EmpMonitor/${user_data[0].email}/${date}/${h}`
                    AmazonSSS.getScreenshots(creds.client_id, creds.client_secret, creds.region, creds.bucket_name, hour_prefix, pageToken, (err, ssData) => {
                        if (err) callback();
                        let finalData = [];
                        async.forEach(ssData, (e, cb) => {
                            finalData.push({
                                id: e.Key,
                                actual: e.Key,
                                name: Comman.toTimezoneDateofSS(e.Key, user_data[0].timezone),
                                link: `https://${creds.bucket_name}.s3.${creds.region}.amazonaws.com/${e.Key}`,
                                viewLink: `https://${creds.bucket_name}.s3.${creds.region}.amazonaws.com/${e.Key}`,
                                thumbnailLink: `https://${creds.bucket_name}.s3.${creds.region}.amazonaws.com/${e.Key}`,
                                created_at: e.LastModified,
                                updated_at: e.LastModified
                            })
                            cb();
                        }, () => {
                            var obj = {
                                t: moment.tz(moment(h, 'HH'), user_data[0].timezone).format('HH'),
                                actual_t: h,
                                s: finalData, pageToken: null
                            };
                            result.push(obj);
                            callback();
                        })
                    })
                }, () => {
                    let r = _.sortBy(result, "t");
                    return sendResponse(res, 200, { storage: 'S3', name: user_data[0].name + ' ' + user_data[0].full_name, photo_path: user_data[0].photo_path, email: user_data[0].email, user_id: user_data[0].id, screenshot: r }, 'Screenshot data ', null);
                })
            } else if (credsData[0].short_code == 'LC') {
                try {
                    const r = await getLocalScreenshots(user_data, date, total_hour);
                    return sendResponse(res, 200, { storage: 'LC', name: user_data[0].name + ' ' + user_data[0].full_name, photo_path: user_data[0].photo_path, email: user_data[0].email, user_id: user_data[0].id, screenshot: r }, 'Screenshot data ', null);
                } catch (err) {
                    Logger.error(`---v3-error-----${err}------${__filename}----`);
                    return sendResponse(res, 400, null, 'Unable to get screenshots.', err.message);
                }
            } else {
                return sendResponse(res, 400, null, 'Active cloud storage not found.', null);
            }
        } catch (err) {
            console.log('============', err);
            Logger.error(`---v3-error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable to get screenshots.', err);
        }
    }
}

module.exports = new ScreenshotController;