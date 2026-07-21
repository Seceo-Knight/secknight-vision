const fs = require('fs');
const path = require('path');
const async = require('async');
const {
    google
} = require('googleapis');

class GoogleDrive {
    getFolderIdByName(name, client_id, client_secret, token, refresh_token, cb) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({
            access_token: token,
            refresh_token: refresh_token
        });

        google.options({
            auth: oauth2Client
        });

        let pageToken = '';
        const drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });

        drive.files
            .list({
                pageSize: 1000,
                q: `name='${name}'`,
                pageToken: pageToken ? pageToken : '',
                fields: 'nextPageToken, files(*)',
            }, (err, result) => {
                if (err) {
                    cb(err, null);
                } else {
                    if (result.data.files.length > 0) {
                        cb(null, result.data.files[0].id);
                    } else {
                        cb(null, result.data.files);
                    }
                }
            });
    }

    getScreenshootFromToDate(folderId, name, client_id, client_secret, token, refresh_token, pageToken, limit, cb) {
        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');

        oauth2Client.setCredentials({
            access_token: token,
            refresh_token: refresh_token
        });

        google.options({
            auth: oauth2Client
        });

        const drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });

        drive.files
            .list({
                pageSize: limit,
                orderBy: "name",
                q: `(${name.trim()}) and '${folderId}' in parents and trashed = false`,
                pageToken: pageToken ? pageToken : '',
                fields: 'nextPageToken, files(*)',
            }, (err, result) => {
                if (err) {
                    cb(err, null);
                } else {
                    cb(null, result.data);
                }
            });
    }

    getFolderIdByParentId(parentId, name, client_id, client_secret, token, refresh_token, cb) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({
            access_token: token,
            refresh_token: refresh_token
        });
        google.options({
            auth: oauth2Client
        });

        let pageToken = '';
        const drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });

        drive.files
            .list({
                pageSize: 1000,
                q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
                pageToken: pageToken ? pageToken : '',
                fields: 'nextPageToken, files(*)'
            }, (err, result) => {
                if (err) {
                    cb(err, null);
                } else {
                    if (result.data.files.length > 0) {
                        cb(null, result.data.files[0].id);
                    } else {
                        cb(null, result.data.files);
                    }
                }
            });
    }

    createFolder(name, client_id, client_secret, token, refresh_token, cb) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({
            access_token: refresh_token,
            refresh_token: refresh_token
        });

        google.options({
            auth: oauth2Client
        });

        let pageToken = '';
        const drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });

        var fileMetadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        drive.files
            .create({
                resource: fileMetadata,
                fields: 'id'
            }, function (err, file) {
                if (err) {
                    cb(err, null);
                } else {
                    drive.permissions.create({
                        fileId: file.data.id,
                        resource: {
                            'role': "reader",
                            'type': "anyone"
                        }
                    }, function (err, result) {
                        cb(null, file.data.id);
                    });
                }
            });
    }

    uploadProfileToDrive(folderId, name, client_id, client_secret, refresh_token, cb) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({
            access_token: null,
            refresh_token: refresh_token
        });

        google.options({
            auth: oauth2Client
        });

        let pageToken = '';
        const drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });


        var fileMetadata = {
            'name': name,
            parents: [folderId]
        };

        var media = {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(`${__dirname.split('src')[0]}/public/images/profilePic/${name}`)
        };
        drive.files
            .create({
                resource: fileMetadata,
                media: media,
            }, function (err, file) {
                if (err) {
                    console.error(err);
                    cb(err, null);
                } else {
                    cb(null, file.id);
                }
            });

    }

    deleteFileFromLocal(name) {
        fs.unlinkSync(`${__dirname.split('src')[0]}/public/images/profilePic/${name}`);
        return;
    }

    downloadFile(client_id, client_secret, token, refresh_token, emailId, date, screenshots, cb) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({
            access_token: token,
            refresh_token: refresh_token
        });
        google.options({
            auth: oauth2Client
        });
        const drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });

        let screenshotPath = path.resolve(__dirname, '../../../', 'public', 'screenshots');
        if (!fs.existsSync(screenshotPath)) fs.mkdirSync(screenshotPath);


        let userDirPath = path.resolve(screenshotPath, `${emailId}-${date}`);
        if (!fs.existsSync(userDirPath)) fs.mkdirSync(userDirPath);


        // let userDateDirPath = path.resolve(userDirPath, date);
        // if (!fs.existsSync(userDateDirPath)) fs.mkdirSync(userDateDirPath);

        async.forEachSeries(screenshots, (screenItem, callback) => {

            let userHrDirPath = path.resolve(userDirPath, screenItem.t);
            if (!fs.existsSync(userHrDirPath)) fs.mkdirSync(userHrDirPath);

            async.forEachSeries(screenItem.s, (screenshot, callbackInner) => {
                let dest = fs.createWriteStream(`${userHrDirPath}/${screenshot.name}`);

                drive.files.get({
                    fileId: screenshot.id,
                    alt: 'media'
                }, {
                    responseType: 'stream'
                }, (err, response) => {
                    if (err) callbackInner(err);
                    response.data
                        .on('end', () => {
                            callbackInner();
                        })
                        .on('error', errorOn => {
                            callbackInner(errorOn);
                        })
                        .pipe(dest);
                });
            },
                (errorInner) => {
                    if (errorInner) {
                        console.log(errorInner);
                        callback(errorInner);
                    } else {
                        console.log('---done-inner---');
                        callback();
                    }
                });
        }, (err) => {
            if (err) {
                console.log(err);
                cb(err, null);
            } else {
                console.log('---done---');
                cb(null, {
                    msg: 'success',
                    path: userDirPath
                });
            }
        });
    }

    getScreenshootFromToDateAllFiles(folderId, name, client_id, client_secret, token, refresh_token, pageToken, limit, cb) {
        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');

        oauth2Client.setCredentials({
            access_token: token,
            refresh_token: refresh_token
        });

        google.options({
            auth: oauth2Client
        });

        const drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });

        drive.files
            .list({
                pageSize: 100,
                orderBy: "name",
                q: `(${name.trim()}) and '${folderId}' in parents and trashed = false`,
                pageToken: pageToken ? pageToken : '',
                fields: 'nextPageToken, files(*)',
            }, (err, result) => {
                if (err) {
                    cb(err, null);
                } else {
                    cb(null, result.data);
                }
            });
    }


    async getFolderByName(name, client_id, client_secret, refresh_token) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token: refresh_token });

        google.options({ auth: oauth2Client });

        let pageToken = '';
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        let res = await drive.files.list({ pageSize: 1000, q: `name='${name}'`, pageToken: pageToken ? pageToken : '', fields: 'nextPageToken, files(*)', });
        return res.data;
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

    async getFolderByParentId(parentId, name, client_id, client_secret, refresh_token) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token: refresh_token });
        google.options({ auth: oauth2Client });

        let pageToken = '';
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const res = await drive.files
            .list({
                pageSize: 1000,
                q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
                pageToken: pageToken ? pageToken : '',
                fields: 'nextPageToken, files(*)'
            })
        return res.data;
    }

    async createNewFolderWithParent(name, parentId, client_id, client_secret, refresh_token) {

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token: refresh_token });

        google.options({ auth: oauth2Client });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        var fileMetadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder',
            parents: [parentId]
        };
        const res = await drive.files.create({
            resource: fileMetadata,
            q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder'`,
            fields: 'id'
        });
        // const permision = await drive.permissions.create({ fileId: res.data.id, resource: { 'role': "reader", 'type': "anyone" } });
        return res;
    }
}

module.exports = new GoogleDrive;