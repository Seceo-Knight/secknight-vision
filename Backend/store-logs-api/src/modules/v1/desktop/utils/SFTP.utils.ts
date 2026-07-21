import * as ftp from 'basic-ftp';
import * as _ from 'underscore';

import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { UploadDto } from '../dto/upload.dto';
import { IEnsureFolder } from '../interfaces/storage-folders-cache.interface';

import SftpClient from "ssh2-sftp-client";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";

const nodeCache = new NodeCache();

let sftpConnections = {};

export class SFtpUtils implements StorageUtilInterface {
    private client;
    private clientPath;
    private dirClient;
    private delimiter: string = '/';
    private _main: string = '';
    private dayFolderEnsure: IEnsureFolder = {};

    async initConnection(storage: any, organization_id: any): Promise<void> {
        if(Object.keys(sftpConnections).includes(`Storage_${organization_id}`)) {
            this.client = sftpConnections[`Storage_${organization_id}`]
            this.clientPath = storage.ftp_path;
            return this.client;
        }
        const sftp = new SftpClient();

        let tempConnectionData: any = {
            host: storage.host,
            port: storage.port,
            username: storage.username,
        };

        if(storage.pemPath) tempConnectionData.privateKey = Buffer.from(storage.pemPath.replace(/\\n/g, '\n'), 'utf-8');
        else tempConnectionData.password = storage.password;
        
        await sftp.connect(tempConnectionData);
        sftpConnections[`Storage_${organization_id}`] = sftp;
        this.client = sftp;
        this.clientPath = storage.ftp_path;
        return this.client;
    };


    deleteCreds(organization_id) {
        if(Object.keys(sftpConnections).includes(`Storage_${organization_id}`)) {
            try {
                sftpConnections[`Storage_${organization_id}`].end();
            } catch (error) {
            }
            delete sftpConnections[`Storage_${organization_id}`];
        }
        return true;
    }

    async prepareFolderPath(email: string, main: string): Promise<void> {
        // user email is in email
        // main is folder name 
        let listMainPath = await this.client.list(`${this.clientPath}`);
        listMainPath = listMainPath.filter(i => i.name === main);
        if(listMainPath.length === 0) {
            // Create a new folder
            await this.client.mkdir(`${this.clientPath}/${main}`, true);
        }
        let listUserEmailPath = await this.client.list(`${this.clientPath}/${main}`);
        listUserEmailPath = listUserEmailPath.filter(i => i.name === email);
        if(listUserEmailPath.length === 0) {
            // Create a new folder
            await this.client.mkdir(`${this.clientPath}/${main}/${email}`, true);
        }
        this.dirClient = `${this.clientPath}/${main}/${email}`;
    };

    async uploadFile(file: UploadDto): Promise<void> {
        const day = file.originalname.slice(3, 13);
        let listUserEmailPath = await this.client.list(`${this.dirClient}`);
        listUserEmailPath = listUserEmailPath.filter(i => i.name === day);
        if(listUserEmailPath.length === 0) {
            // Create a new folder
            await this.client.mkdir(`${this.dirClient}/${day}`, true);
        }
        await this.client.put(file.filepath, `${this.dirClient}/${day}/${file.originalname}`);
    };

    async initPutClient(baseOptions) {

    };

    async initConnDirClient(baseOptions) {

    };

    async closeConnection(): Promise<void> {

    };

    get main() {
        return this._main;
    }

    set main(part) {
        if (!part) return;
        if (!this.existDelimiter(part)) {
            this._main += this.delimiter;
        }
        this._main += part;
    }

    existDelimiter(part) {
        return _.first(part) === this.delimiter || _.last(this._main) === this.delimiter;
    }

    async initConnection_old(storage: any): Promise<void> {

    };

    async uploadFile_old(file: UploadDto): Promise<void> {

    };
}