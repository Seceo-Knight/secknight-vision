import * as ftp from 'basic-ftp';
import { createReadStream } from 'fs';
import PromiseFtp  from 'promise-ftp';
import * as _ from 'underscore';

import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { UploadDto } from '../dto/upload.dto';
import { IEnsureFolder } from '../interfaces/storage-folders-cache.interface';

export class FtpUtils implements StorageUtilInterface {
    private client;
    private dirClient;
    private delimiter: string = '/';
    private _main: string = '';
    private dayFolderEnsure: IEnsureFolder = {};

    async initConnection(storage: any): Promise<void> {
        const { username, password, host, port, ftp_path, } = storage;
        this.main = ftp_path;
        const baseOptions = {
            host, port, user: username, password: password
        };
        await Promise.all([
            this.initConnDirClient(baseOptions), 
            this.initPutClient(baseOptions)
        ]);
    };

    async prepareFolderPath(email: string, main: string): Promise<void> {
        this.main = `${main}/${email}`;
    };

    async uploadFile(file: UploadDto): Promise<void> {
        const day = file.originalname.substr(3, 10);
        const folder = `${this.main}/${day}`;
        const fileStream = createReadStream(file.filepath);
        if(!this.dayFolderEnsure[folder]) {
            await this.dirClient.ensureDir(folder);
            this.dayFolderEnsure[folder] = true;
        }

        await this.client.put(fileStream, `${folder}/${file.originalname}`);
    };

    async initPutClient(baseOptions) {
        this.client = new PromiseFtp();
        try {
            await this.client.connect({
                ...baseOptions, 
                secure: false,
                autoReconnect: true
            });
        } catch {
            await this.client.end();
            await this.client.connect({
                ...baseOptions, 
                secure: true,
                secureOptions: { 
                    rejectUnauthorized: false 
                },
                autoReconnect: true
            });
        }  
    };

    async initConnDirClient(baseOptions) {
        this.dirClient = new ftp.Client();
        //this.client.ftp.verbose = true
        try {
            await this.dirClient.access({ 
                ...baseOptions, 
                secure: false 
            });
        } catch {
            await this.dirClient.access({
                ...baseOptions, 
                secure: true, 
                secureOptions: {
                    rejectUnauthorized: false,
                },
            })
        }
    };

    async closeConnection(): Promise<void> {
        await Promise.all([
            this.dirClient.close(),
            this.client.end()
        ])
        
    };

    get main() {
        return this._main;
    }

    set main(part) {
        if(!part) return;
        if(!this.existDelimiter(part)) {
            this._main += this.delimiter;
        }
        this._main += part;
    }

    existDelimiter(part) {
        return _.first(part) === this.delimiter || _.last(this._main) === this.delimiter;
    }

    async initConnection_old(storage: any): Promise<void> {
        const { username, password, host, port, ftp_path, } = storage;
        this.main = ftp_path;
        this.client = new ftp.Client();
        //this.client.ftp.verbose = true
        const baseOptions = {
            host, port, user: username, password: password
        };
        // try to connect to non secure ftp
        let notConnected = false;
        await this.client.access({ ...baseOptions, secure: false })
            .catch(() => { notConnected = true })

        // retry to connect to secure version
        if (notConnected) {
            await this.client.access({
                ...baseOptions, secure: true, secureOptions: {
                    rejectUnauthorized: false,
                },
            })
        }
    };

    async uploadFile_old(file: UploadDto): Promise<void> {
        const day = file.originalname.substr(3, 10);
        const folder = `/${this.main}/${day}`;
        const fileStream = createReadStream(file.filepath);

        await this.client.ensureDir(folder);
        await this.client.uploadFrom(fileStream, file.originalname);
    }; 
}