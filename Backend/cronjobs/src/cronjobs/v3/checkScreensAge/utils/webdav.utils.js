const { createClient } = require("webdav");

const fs  = require("fs");
const path = require("path");
const moment = require('moment-timezone');

let webdavConnections = {};

class webdavServices {
    constructor() {
        this.client;
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
    
    async initConection(storage, organization_id) {
        if(Object.keys(webdavConnections).includes(`Storage_${organization_id}`)) {
            this.client = webdavConnections[`Storage_${organization_id}`]
            this.clientPath = storage.webdav_path || storage.basePath || storage.path || '/';
            return this.client;
        }

        const baseUrl = storage.baseUrl || storage.url || `${storage.host || ''}${storage.port ? `:${storage.port}` : ''}`;
        const options = {};
        if (storage.username) options.username = storage.username;
        if (storage.password) options.password = storage.password;

        const client = createClient(baseUrl, options);

        webdavConnections[`Storage_${organization_id}`] = client;
        this.client = client;
        this.clientPath = storage.webdav_path || storage.basePath || storage.path || '/';
        return this.client;
    };

    deleteCreds(organization_id) {
        if(Object.keys(webdavConnections).includes(`Storage_${organization_id}`)) {
            delete webdavConnections[`Storage_${organization_id}`];
        }
    }

    async getMainFolderId(connection, folderName) {
        const p = path.posix.join(this.clientPath, folderName);
        try {
            const contents = await this.client.getDirectoryContents(p);
            return contents;
        } catch (err) {
            return false;
        }
    }

    async getUsersFolders(connection , ssss, ssLastDate) {
        const base = path.posix.join(this.clientPath, 'EmpMonitor');
        let userFolderList = [];
        try {
            userFolderList = await this.client.getDirectoryContents(base);
        } catch (err) {
            return;
        }

        for (const userEmail of userFolderList) {
            const userPath = path.posix.join(base, userEmail.basename || path.posix.basename(userEmail.filename || ''));
            let uEmail = [];
            try {
                uEmail = await this.client.getDirectoryContents(userPath);
            } catch (err) {
                continue;
            }
            for (const date of uEmail) {
                const name = date.basename || path.posix.basename(date.filename || '');
                if(name == ssLastDate.format("YYYY-MM-DD")) {
                    console.log(`${userPath}/${name}`)
                    try {
                        await this.client.deleteFile(`${userPath}/${name}`);
                    } catch (e) {
                        // ignore
                    }
                }
            }
        }
    }

    checkMainFolder() {
        return true;
    }

    async checkAccess(storage) {
        const baseUrl = storage.baseUrl || storage.url || `${storage.host || ''}${storage.port ? `:${storage.port}` : ''}`;
        const options = {};
        if (storage.username) options.username = storage.username;
        if (storage.password) options.password = storage.password;
        const client = createClient(baseUrl, options);
        try {
            await client.getDirectoryContents('/');
            return true;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = new webdavServices;