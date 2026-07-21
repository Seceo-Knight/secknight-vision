'use strict';

const { createClient } = require('webdav');
const path = require('path');

let webdavConnections = {};

class WebDAVModel {

    static async initConnection(connectionData, organization_id) {
        const baseUrl = connectionData.baseUrl || connectionData.url || `${connectionData.host || ''}${connectionData.port ? `:${connectionData.port}` : ''}`;
        const clientPath = connectionData.webdav_path || connectionData.ftp_path || connectionData.basePath || '/';

        if (Object.prototype.hasOwnProperty.call(webdavConnections, `Storage_${organization_id}`)) {
            const entry = webdavConnections[`Storage_${organization_id}`];
            const sameCreds =
                entry.baseUrl === baseUrl &&
                (entry.username || '') === (connectionData.username || '') &&
                (entry.password || '') === (connectionData.password || '') &&
                (entry.clientPath || '/') === (clientPath || '/');

            if (sameCreds) {
                try {
                    await entry.client.getDirectoryContents(entry.clientPath);
                    this.client = entry.client;
                    this.clientPath = entry.clientPath;
                    return this.client;
                } catch (err) {
                    try { delete webdavConnections[`Storage_${organization_id}`]; } catch (e) {}
                }
            } else {
                try { delete webdavConnections[`Storage_${organization_id}`]; } catch (e) {}
            }
        }

        const options = {};
        if (connectionData.username) options.username = connectionData.username;
        if (connectionData.password) options.password = connectionData.password;

        const client = createClient(baseUrl, options);

        webdavConnections[`Storage_${organization_id}`] = {
            client,
            baseUrl,
            username: connectionData.username || '',
            password: connectionData.password || '',
            clientPath,
        };
        this.client = client;
        this.clientPath = clientPath;

        try {
            await this.client.getDirectoryContents(this.clientPath);
            return this.client;
        } catch (err) {
            try { delete webdavConnections[`Storage_${organization_id}`]; } catch (e) {}
            throw err;
        }
    }

    static async download(req, res, pathParam) {
        let sanitizedPath = pathParam.replace(/\\/g, '');
        sanitizedPath = sanitizedPath.replace(/\/+/g, '/');

        // webdav client methods may vary; prefer createReadStream if available
        try {
            if (typeof this.client.createReadStream === 'function') {
                const fileStream = await this.client.createReadStream(sanitizedPath);

                if (sanitizedPath.includes('-sc')) res.setHeader("content-type", "image/png");
                else if (sanitizedPath.includes('-vr')) res.setHeader("content-type", "video/mp4");

                fileStream.pipe(res);

                fileStream.on('end', () => {
                    // finished
                });

                fileStream.on('error', (err) => {
                    console.error('Error streaming file:', err);
                });
                return;
            }

            // fallback: get file contents as Buffer
            const data = await this.client.getFileContents(sanitizedPath, { format: "binary" });
            if (sanitizedPath.includes('-sc')) res.setHeader("content-type", "image/png");
            else if (sanitizedPath.includes('-vr')) res.setHeader("content-type", "video/mp4");
            res.end(data);
        } catch (err) {
            console.error('WebDAV download error', err);
            throw err;
        }
    }

    static deleteCreds(organization_id) {
        if (Object.prototype.hasOwnProperty.call(webdavConnections, `Storage_${organization_id}`)) {
            delete webdavConnections[`Storage_${organization_id}`];
        }
    }
}

module.exports = WebDAVModel;

