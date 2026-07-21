const fs = require('fs');
const { google } = require('googleapis');
const moment = require('moment');
const _ = require('underscore');
const path = require('path');


const getParam = (arr) => {
    const obj = _.first(arr);

    return (property) => _.property(property)(obj);
}

class GoogleDrive {
    /**Get googleapis instance*/
    initConection(creds) {
        const client_id = creds.client_id;
        const client_secret = creds.client_secret;
        const refresh_token = creds.refresh_token;

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token });
        google.options({ auth: oauth2Client });

        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    /**Get google drive folder id and if folder absent create it*/
    async getOrCreateFolder(folderName, drive) {
        try {
            let folderId = await this.getFolderIdByName(folderName, drive);
            if (folderId) return folderId

            folderId = await this.createFolder(folderName, drive);
            await this.addSharePermisionToFile(folderId, drive);

            return folderId;
        } catch (err) {
            throw err;
        }

    }

    async uploadAttachments(folderName, name, creds, path) {
        try {
            const drive = this.initConection(creds);
            const folderId = await this.getOrCreateFolder(folderName, drive)

            const condition = `name contains '${name}'`;
            await this.uploadAttachmnetsToDrive(folderId, name, drive, path);
            const { data } = await this.getAttachments({ drive, folderId, condition, pageToken: '', limit: 1 });

            return data.files[0].webContentLink;
        } catch (err) {
            throw err;
        }
    }

    /** Get folder id by name */
    async getFolderIdByName(name, drive) {
        try {
            const { data } = await drive.files.list({ pageSize: 1000, q: `name='${name}'`, pageToken: '', fields: 'nextPageToken, files(*)', });

            return getParam(data.files)('id');
        } catch (err) {
            throw (err);
        }
    }

    /** Create folder */
    async createFolder(name, drive) {
        const fileMetadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        try {
            const { data } = await drive.files.create({ resource: fileMetadata, fields: 'id' });

            return data.id;
        } catch (err) {
            throw (err);
        }
    }

    /** Add share permision */
    addSharePermisionToFile(fileId, drive) {
        return drive.permissions.create({ fileId, resource: { 'role': "reader", 'type': "anyone" } });
    }

    /** Upload screenshot to drive */
    uploadAttachmnetsToDrive(folderId, name, drive, path) {
        const fileMetadata = {
            name,
            parents: [folderId]
        };
        const media = {
            // mimeType: mimeType,
            body: fs.createReadStream(path)
        };

        return drive.files.create({ requestBody: fileMetadata, media: media });
    }

    getAttachments({ drive, folderId, condition, pageToken, limit }) {
        const query = `(${condition.trim()}) and '${folderId}' in parents and trashed = false`;
        return drive.files.list({
            pageSize: limit,
            orderBy: "name",
            q: query,
            pageToken: pageToken ? pageToken : '',
            fields: 'nextPageToken, files(*)',
        });
    }
}

module.exports = new GoogleDrive;