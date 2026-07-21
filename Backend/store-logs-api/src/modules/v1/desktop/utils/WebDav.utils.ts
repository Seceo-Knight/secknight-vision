import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { UploadDto } from '../dto/upload.dto';
import { IEnsureFolder } from '../interfaces/storage-folders-cache.interface';

import { createClient, WebDAVClient } from 'webdav';
import NodeCache from 'node-cache';
import fs from 'fs';
import path from 'path';

const nodeCache = new NodeCache();

let webdavConnections: { [k: string]: WebDAVClient } = {};

export class WebDavUtils implements StorageUtilInterface {
    private client: WebDAVClient;
    private clientPath: string;
    private dirClient: string;
    private _main: string = '';
    private dayFolderEnsure: IEnsureFolder = {};

    async initConnection(storage: any, organization_id: any): Promise<void> {
        if (Object.keys(webdavConnections).includes(`Storage_${organization_id}`)) {
            this.client = webdavConnections[`Storage_${organization_id}`];
            this.clientPath = storage.webdav_path || storage.basePath || '/';
            return;
        }

        const baseUrl = storage.baseUrl || storage.url || `${storage.host || ''}${storage.port ? `:${storage.port}` : ''}`;
        const options: any = {};
        if (storage.username) options.username = storage.username;
        if (storage.password) options.password = storage.password;

        const client = createClient(baseUrl, options);

        webdavConnections[`Storage_${organization_id}`] = client;
        this.client = client;
        this.clientPath = storage.webdav_path || storage.basePath || '/';
        return;
    }

    deleteCreds(organization_id) {
        if (Object.keys(webdavConnections).includes(`Storage_${organization_id}`)) {
            delete webdavConnections[`Storage_${organization_id}`];
        }
        return true;
    }

    async prepareFolderPath(email: string, main: string, custom: any): Promise<void> {
        // ensure main folder exists
        const mainPath = path.posix.join(this.clientPath, main);
        try {
            await this.client.getDirectoryContents(mainPath);
        } catch (err) {
            try {
                await this.client.createDirectory(mainPath);
            } catch (e) {
                // ignore
            }
        }

        // ensure email folder exists
        const emailPath = path.posix.join(mainPath, email);
        try {
            await this.client.getDirectoryContents(emailPath);
        } catch (err) {
            try {
                await this.client.createDirectory(emailPath);
            } catch (e) {
                // ignore
            }
        }

        this.dirClient = emailPath;

        // if custom has day (CUSTOM_DATE_EMAIL_SCREEN_FORMAT), ensure day folder
        if (custom && custom.type && custom.type.includes('CUSTOM_DATE')) {
            const day = custom.day || (custom.date ? custom.date : null);
            if (day) {
                const dayPath = path.posix.join(this.dirClient, day);
                try {
                    await this.client.getDirectoryContents(dayPath);
                } catch (err) {
                    try {
                        await this.client.createDirectory(dayPath);
                    } catch (e) {
                        // ignore
                    }
                }
                this.dirClient = dayPath;
            }
        }
    }

    async uploadFile(file: UploadDto): Promise<void> {
        const day = file.originalname.slice(3, 13);
        let targetDir = this.dirClient;
        // ensure day folder exists
        const dayPath = path.posix.join(targetDir, day);
        try {
            await this.client.getDirectoryContents(dayPath);
        } catch (err) {
            try {
                await this.client.createDirectory(dayPath);
            } catch (e) {
                // ignore
            }
        }

        const filename = file.originalname;
        const remotePath = path.posix.join(dayPath, filename);

        // stream upload
        const stream = fs.createReadStream(file.filepath);
        // putFileContents accepts Buffer/string/ReadableStream
        await this.client.putFileContents(remotePath, stream, { overwrite: true });
    }

    async closeConnection(): Promise<void> {
        // webdav client does not have explicit close; delete from cache
        // nothing to do here
        return;
    }

}