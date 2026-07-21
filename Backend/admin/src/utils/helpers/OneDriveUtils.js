const OneDriveAPI = require("one-drive-api-pools");
const _ = require("lodash");
const { createReadStream, statSync } = require("fs");
const ODApi = new OneDriveAPI();
const maxFileSize = 4_000_000; // 4mb

class OneDriveUtils {
    //Get access token for oneDrive
    async initConection({
        onedrive_client_id,
        onedrive_client_secret,
        onedrive_redirect_url,
        onedrive_refresh_token,
    }) {
        const creds = {
            client_id: onedrive_client_id,
            client_secret: onedrive_client_secret,
            redirect_uri: onedrive_redirect_url,
            refresh_token: onedrive_refresh_token,
        };
        const haveConnect = ODApi.checkCreds(onedrive_client_id);
        if (!haveConnect) {
            await ODApi.addConection(onedrive_client_id, creds);
        }

        return onedrive_client_id;
    }

    async checkAccess({
        onedrive_client_id,
        onedrive_client_secret,
        onedrive_redirect_url,
        onedrive_refresh_token,
    }) {
        const creds = {
            client_id: onedrive_client_id,
            client_secret: onedrive_client_secret,
            redirect_uri: onedrive_redirect_url,
            refresh_token: onedrive_refresh_token,
        };

        const pool = `$${onedrive_client_id}-${_.now()}`;
        await ODApi.addConection(pool, creds);
        await ODApi.items.listChildren(pool, { itemId: "root" });
    }

    async findOrCreateFolder(creds) {
        const folderId = await this._getFolderId(creds);
        if (folderId) return folderId;

        return this._createFolder(creds);
    }

    uploadFile({ pool, size, parentId, path, name }) {
        const content = createReadStream(path);
        if (size < maxFileSize) {
            return ODApi.items.uploadSimple(pool, {
                parentId,
                readableStream: content,
                filename: name,
            });
        }

        return ODApi.items.uploadSession(pool, {
            parentId,
            readableStream: content,
            fileSize: file.size,
            filename: name,
        });
    }

    async getFolderIdFromCashe({ pool, folderName, itemId, ttl }) {
        let folderId = ODApi.getFromCashe({ pool, key: folderName });
        if (!folderId) {
            folderId = await this._getFolderId({ pool, folderName, itemId });
            ODApi.setToCashe({ pool, ttl, key: folderName });
        }

        return folderId;
    }

    async getDateFoldersId({ pool, dayFolders, itemId }) {
        const dataArr = await Promise.all(
            dayFolders.map((day) =>
                this._getIdWithDate({ pool, itemId, folderName: day })
            )
        );

        return dataArr.reduce((acc, { name, id }) => {
            if (id) acc[name] = id;
            return acc;
        }, {});
    }

    async getAllFolderChildrens({ pool, folderName, itemId }) {
        let {
            "@odata.nextLink": nextLink,
            value,
        } = await ODApi.items.listChildren(pool, { itemId });

        if (nextLink) {
            const nextValue = await this._getByLink(pool, nextLink);
            value = [...value, ...nextValue];
        }

        return { folderName, data: value };
    }

    parseScreensObj(screensFlat) {
        return screensFlat.reduce((acc, { folderName, data }) => {
            acc[folderName] = data;

            return acc;
        }, {});
    }

    async _createFolder({ pool, folderName, itemId }) {
        const folder = await ODApi.items.createFolder(pool, {
            rootItemId: itemId,
            name: folderName,
        });

        return folder.id;
    }

    async _getFolderId({ pool, folderName, itemId }) {
        const query = encodeURI(`?$select=id&$filter=name eq '${folderName}'`);

        const data = await ODApi.items.listChildren(pool, { itemId, query });
        if (_.isEmpty(data.value) && data["@odata.nextLink"]) {
            return this._getFolderIdByLink(pool, data["@odata.nextLink"]);
        }

        return _.get(data, "value[0].id");
    }

    async _getFolderIdByLink(pool, url) {
        const data = await ODApi.items.getByLink(pool, { url });

        if (_.isEmpty(data.value) && data["@odata.nextLink"]) {
            return this._getFolderIdByLink(pool, data["@odata.nextLink"]);
        }

        return _.get(data, "value[0].id");
    }

    async _getIdWithDate(creds) {
        const folderId = await this._getFolderId(creds);

        return { id: folderId, name: creds.folderName };
    }

    async _getByLink(pool, url) {
        let { "@odata.nextLink": nextLink, value } = await ODApi.items.getByLink(
            pool,
            {
                url,
            }
        );

        if (nextLink) {
            const nextValue = await this._getByLink(pool, nextLink);
            value = [...value, ...nextValue];
        }

        return value;
    }

    async _deleteEmployeeFolder(pool, itemId) {
        await ODApi.items.delete(pool, {
            itemId: itemId,
        });
    }

    /**
     * Get profile pic download url
     *
     * @function getAllFolderChildrensPic
     * @memberof OneDriveUtils
     * @param {object} pool
     * @param {String} name
     * @param {String} itemId
     * @returns {Object} -profile pic data .
     */
    async getAllFolderChildrensPic({ pool, name, itemId }) {
        let query = `?$filter=name%20eq%20'${name}'`;
        let {
            "@microsoft.graph.downloadUrl": nextLink,
            value,
        } = await ODApi.items.listChildren(pool, { itemId, query });

        if (nextLink) {
            const nextValue = await this._getByLink(pool, nextLink);
            value = [...value, ...nextValue];
        }
        return { name, data: value };
    }

    uploadReport({ pool, size, parentId, path, name }) {
        const content = createReadStream(path);
        if (size < maxFileSize) {
            return ODApi.items.uploadSimple(pool, {
                parentId,
                readableStream: content,
                filename: name,
            });
        }
        var file = statSync(path);
        return ODApi.items.uploadSession(pool, {
            parentId,
            readableStream: content,
            fileSize: file.size,
            filename: name,
        });
    }
}

module.exports = new OneDriveUtils();
