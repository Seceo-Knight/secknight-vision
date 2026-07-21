const fs = require('fs');
const path = require('path');
const async = require('async');
const { google } = require('googleapis');
const AWS = require("aws-sdk");
const moment = require('moment');


class GoogleDrive {
    async getFolderByName(name, client_id, client_secret, refresh_token) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token: refresh_token });

        google.options({ auth: oauth2Client });

        let pageToken = '';
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        let res = await drive.files.list({ pageSize: 1000, q: `name='${name}'`, pageToken: pageToken ? pageToken : '', fields: 'nextPageToken, files(*)', });
        return res.data;
    }

    async getFolderIdByParentId(parentId, name, client_id, client_secret, refresh_token) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token: refresh_token });
        google.options({ auth: oauth2Client });

        let pageToken = '';
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        let result = await drive.files
            .list({
                pageSize: 1000,
                q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
                pageToken: pageToken ? pageToken : '',
                fields: 'nextPageToken, files(*)'
            });
        if (result.data.files.length > 0) {
            return result.data.files[0].id;
        } else {
            return result.data.files;
        }
    }

    async createNewFolder(name, client_id, client_secret, refresh_token) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token: refresh_token });

        google.options({ auth: oauth2Client });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        var fileMetadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const res = await drive.files.create({ resource: fileMetadata, fields: 'id' });
        // const permision = await drive.permissions.create({ fileId: res.data.id, resource: { 'role': "reader", 'type': "anyone" } });
        return res;
    }

    async addSharePermisionToFolder(folderId, client_id, client_secret, refresh_token) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token: refresh_token });

        google.options({ auth: oauth2Client });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const permision = await drive.permissions.create({ fileId: folderId, resource: { 'role': "reader", 'type': "anyone" } });
        return permision;
    }

    /** upload screenshot to drive */
    async uploadScreenshotToDrive(folderId, name, filename, client_id, client_secret, refresh_token) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token: refresh_token });

        google.options({ auth: oauth2Client });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const fileMetadata = {
            'name': filename,
            parents: [folderId]
        };

        const media = {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(`${__dirname.split('src')[0]}/public/images/profilePic/${name}`)
        };
        const res = await drive.files.create({ requestBody: fileMetadata, media: media });
        return res;
    }

    async getScreenshootFromToDate(folderId, name, client_id, client_secret, token, refresh_token, pageToken, limit) {
        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        let limitCount = 0;

        oauth2Client.setCredentials({ access_token: token, refresh_token: refresh_token });

        google.options({ auth: oauth2Client });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        return new Promise((resolve, reject) => {
            drive.files.list({
                pageSize: limit,
                orderBy: "name",
                q: `(${name.trim()}) and '${folderId}' in parents and trashed = false`,
                pageToken: pageToken ? pageToken : '',
                fields: 'nextPageToken, files(*)',
            }).then(response => {
                if (response.errors && response.errors[0].domain == 'usageLimits') {
                    if (limitCount < 2) {
                        setTimeout(() => {
                            limitCount++;
                            resolve(this.getScreenshootFromToDate(folderId, name, client_id, client_secret, token, refresh_token, pageToken, limit));
                        }, 500);
                    } else {
                        resolve(response);
                    }
                } else {
                    resolve(response);
                }
            }).catch(error => {
                setTimeout(() => {
                    limitCount++;
                    resolve(this.getScreenshootFromToDate(folderId, name, client_id, client_secret, token, refresh_token, pageToken, limit));
                }, 500);
            });
        })
    }

    getScreenshootFromToDatecb(folderId, name, client_id, client_secret, token, refresh_token, pageToken, limit, cb) {
        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');

        oauth2Client.setCredentials({ access_token: token, refresh_token: refresh_token });

        google.options({ auth: oauth2Client });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        drive.files.list({
            pageSize: 1000,
            orderBy: "name",
            q: `(${name.trim()}) and '${folderId}' in parents and trashed = false`,
            pageToken: pageToken ? pageToken : '',
            fields: 'nextPageToken, files(*)',
        }, (err, result) => {
            cb(err, result);
        });
    }

    /**upload screenshot to s3*/
    async uploadScreenToS3(accessKeyId, secretAccessKey, bucket, name) {

        const fileContent = fs.readFileSync(`${__dirname.split('src')[0]}/public/images/profilePic/${name}`);
        const s3 = new AWS.S3({ accessKeyId: accessKeyId, secretAccessKey: secretAccessKey });
        // Setting up S3 upload parameters
        const params = {
            Bucket: bucket,
            Key: `EmpmonitorProfilePic/${name}.jpg`,
            Body: fileContent,
            ACL: 'public-read',
        };
        return s3.upload(params).promise();
    }

    /**Check folder exists on specific day */
    async checkDataExists(accessKeyId, secretAccessKey, region, bucket, prefix) {

        AWS.config.update({ accessKeyId: accessKeyId, secretAccessKey: secretAccessKey, region: region, });
        const s3 = new AWS.S3();

        const params = { Bucket: bucket, Prefix: prefix, MaxKeys: 1 };

        return s3.listObjectsV2(params).promise();
    }

    /**Get screenshot from s3 bucket */
    async getScreenshots(accessKeyId, secretAccessKey, region, bucket, prefix, marker, cb) {


        AWS.config.update({ accessKeyId: accessKeyId, secretAccessKey: secretAccessKey, region: region, });

        const s3 = new AWS.S3();

        const params = { Bucket: bucket, Delimiter: "/", Prefix: prefix, MaxKeys: 100, Marker: marker };

        s3.listObjects(params, function (err, data) {
            cb(err, data.Contents);
        });
    }
    async getScreenshotsS3(accessKeyId, secretAccessKey, region, bucket, prefix) {
        let contents = [];
        try {
            AWS.config.update({ accessKeyId: accessKeyId, secretAccessKey: secretAccessKey, region: region, });
            const s3 = new AWS.S3();
            let marker = '';
            while (true) {
                const params = { Bucket: bucket, Delimiter: "/", Prefix: prefix, MaxKeys: 1000, Marker: marker };
                const data = await s3.listObjects(params).promise();
                if (data.NextMarker) {
                    marker = data.NextMarker;
                    contents.push(...data.Contents);
                } else {
                    contents.push(...data.Contents);
                    break;
                }
            }
            return contents;
        } catch (err) {
            throw err;
        }
    }

    deleteFileFromLocal(name) {
        fs.unlinkSync(`${__dirname.split('src')[0]}/public/images/profilePic/${name}`);
        return;
    }

    GoogleDriveFolderFormat(startIndex, endIndex, timezone, dateIdData, date) {
        let total_hour = [];
        for (let i = startIndex; i <= endIndex; i++) {
            if (moment().tz(timezone).format('Z').indexOf(':30') > -1) {
                const iMinus = (i - 1);
                const h = ('0' + i).slice(-2);
                const hMinus = ('0' + iMinus).slice(-2);
                total_hour.push({
                    h: h,
                    dateFolderId: dateIdData, date: date,
                    name: `name contains '${hMinus}-${date}' or name contains '${h}-${date}'`
                });
                continue;
            }
            total_hour.push({
                h: ('0' + i).slice(-2),
                dateFolderId: dateIdData, date: date,
                name: `name contains '${h}-${date}'`
            });
        }
        return total_hour;
    }

    GoogleDriveFolderFormatNew(startIndex, endIndex, timezone, dateFolderId, date) {
        let total_hour = [];
        for (let i = startIndex; i <= endIndex; i++) {
            let minutes = moment.tz(`${date} ${i}`, 'YYYY-MM-DD HH', timezone).utc().format('mm');
            if (Number(minutes) > 0) {
                const iMinus = String((i - 1)).padStart(2, 0);
                const h = String(i).padStart(2, 0);
                total_hour.push({
                    h, dateFolderId, date,
                    name: `name contains '${iMinus}-${date}' or name contains '${h}-${date}'`
                });
                continue;
            }
            total_hour.push({
                h: String(i).padStart(2, 0),
                dateFolderId, date,
                name: `name contains '${h}-${date}'`
            });
        }
        return total_hour;
    }
}

module.exports = new GoogleDrive;