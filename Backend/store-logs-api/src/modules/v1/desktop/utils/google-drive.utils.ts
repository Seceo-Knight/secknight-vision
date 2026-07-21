import { google } from 'googleapis';
import { createReadStream } from 'fs';
import * as _ from 'underscore';

import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { UploadDto } from '../dto/upload.dto';
import { ReqLimiter } from './limiter/index';

import LoadLash from "lodash";

const GReqLimiter = ReqLimiter.getInstance('google', {
  clientName: 'drive',
  maxRepeatAttempts: 18,
  maxOneTimeReq: 13,
  maxAttempts: Number(process.env.GOOGLE_LIMITER_MAXIMUM_ATTEMPTS) || 27,
});

// 1 m 54.84 s
export class GoogleDriveUtils implements StorageUtilInterface {
  private emailFolderId: string;
  private port: string;
  private drive;
  private dayFoldersIds: any = {};

  async initConnection({ client_id, client_secret, refresh_token }) {
    let client = GReqLimiter.getClient(client_id);
    if (!client) {
      GReqLimiter.haveConnect(client_id);
      const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
      oauth2Client.setCredentials({ access_token: '', refresh_token });
      google.options({ auth: oauth2Client });

      client = google.drive({ version: 'v3', auth: oauth2Client });

      GReqLimiter.setClient(client_id, client);
    }

    this.port = client_id;
    this.drive = client;
  }

  async prepareFolderPath(email: string, main: string): Promise<void> {
    const mainFolderId = await this.getMainFolderId(main);
    this.emailFolderId = await this.getMailFolder(email, mainFolderId);
  }

  async uploadFile(file: UploadDto): Promise<any> {
    let storageUsageResponse: any = await this.checkDriveFolderStorage();
    const storageQuota = storageUsageResponse?.data?.storageQuota;
    if((storageQuota?.limit - storageQuota?.usage) / 1024 < 200) throw new Error(`Insufficient cloud storage available G-Drive ${(storageQuota?.limit - storageQuota?.usage) / 1024} KB`);

    const day = file.originalname.slice(3, 13);

    const dayFolderId = await this.getDayFolderId(day);
    await GReqLimiter.addToQueue(
      this.port,
      this.uploadScreenshotToDrive,
      { file, folderId: dayFolderId },
    );
  }

  async getMainFolderId(main: string): Promise<any> {
    let mainFolderId = GReqLimiter.getFromCashe(this.port, main);
    if (!mainFolderId) {
      const mainFolderData = await GReqLimiter.addToQueue(
        this.port,
        this.getFolderByName,
        main,
      );
      if (_.isEmpty(mainFolderData.files)) {
        const newMainFolderData = await GReqLimiter.addToQueue(
          this.port,
          this.createNewFolder,
          main,
        );
        mainFolderId = newMainFolderData.data.id;
        await GReqLimiter.addToQueue(
          this.port,
          this.addSharePermissionToFolder,
          mainFolderId,
        );
      } else {
        mainFolderId = mainFolderData.files[0].id;
      }
      GReqLimiter.setToCashe(this.port, { key: main, data: mainFolderId });
    }

    return mainFolderId;
  }

  async getMailFolder(email: string, mainFolderId: string): Promise<string> {
      const mailFolderData = await GReqLimiter.addToQueue(
        this.port,
        this.getFolderByParentId,
        { parentId: mainFolderId, name: email },
      );
      if (_.isEmpty(mailFolderData.files)) {
        const newMailFolderData = await GReqLimiter.addToQueue(
          this.port,
          this.createNewFolderByParentId,
          { parentId: mainFolderId, name: email },
        );
        return newMailFolderData.data.id;
      } 

      return mailFolderData.files[0]?.id; 
  }

  async getDayFolderId(day: string): Promise<string> {
    let dayFolderId = this.dayFoldersIds[day];
    if (!dayFolderId) {
      const dayFolderData = await GReqLimiter.addToQueue(
        this.port,
        this.getFolderByParentId,
        { parentId: this.emailFolderId, name: day },
      );

      if (_.isEmpty(dayFolderData.files)) {
        const newDateFolderData = await GReqLimiter.addToQueue(
          this.port,
          this.createNewFolderByParentId,
          { parentId: this.emailFolderId, name: day },
        );
        dayFolderId = newDateFolderData.data.id;
      } else {
        dayFolderId = dayFolderData?.files[0].id;
      }

      this.dayFoldersIds[day] = dayFolderId;
    }

    return dayFolderId;
  }

  /** get folder id By name */
  getFolderByName = async name => {
    const res = await this.drive.files.list({
      pageSize: 1000,
      q: `name='${name}'`,
      pageToken: '',
      fields: 'nextPageToken, files(*)',
    });
    return res.data;
  };

  /** create folder in drive*/
  createNewFolder = async name => {
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
    };
    const res = await this.drive.files.create(
      { requestBody: fileMetadata },
      {},
    );
    return res;
  };

  /**get child folder Id by parent reference  */
  getFolderByParentId = async ({ parentId, name }) => {
    const res = await this.drive.files.list({
      pageSize: 1000,
      q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
      pageToken: '',
      fields: 'nextPageToken, files(*)',
    });
    return res.data;
  };

  /** create folder with parent reference */
  createNewFolderByParentId = async ({ name, parentId }) => {
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };
    const res = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });
    return res;
  };

  /** add shrare permission to folder */
  addSharePermissionToFolder = async folderId => {
    const fileMetadata = { role: 'reader', type: 'anyone' };

    const permision = await this.drive.permissions.create({
      fileId: folderId,
      requestBody: fileMetadata,
    });
    return permision;
  };

  /** upload screenshot to drive */
  uploadScreenshotToDrive = async ({ folderId, file }): Promise<any> => {
    const { originalname, mimetype, filepath } = file;
    const fileMetadata = {
      name: originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: mimetype,
      body: createReadStream(filepath),
    };

    await this.drive.files.create({ requestBody: fileMetadata, media});
  };

  checkIfOfficeAgentFolderExist = async (userData: any): Promise<any> => {
    let initialFolderName = userData.email;
    let finalFolderName = userData.a_email;
    if (!finalFolderName) return false;

    const { data: mainFolderData } = await this.drive.files.list({
      pageSize: 1000,
      q: `name='EmpMonitor'`,
      pageToken: '',
      fields: 'nextPageToken, files(*)',
    });
    let mainFolderId = LoadLash.get(mainFolderData, 'files[0].id');
    if (mainFolderId === undefined) {
      return false;
    }
    const pageToken = '';
    const { data: userFolderData } = await this.drive.files.list({
      pageSize: 1000,
      q: `name='${initialFolderName}' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
      pageToken: pageToken ? pageToken : '',
      fields: 'nextPageToken, files(*)',
    });
    if (userFolderData.files.length === 0) return true;
    const userFolderId = LoadLash.get(userFolderData, 'files[0].id');

    const updatedFolder = await this.drive.files.update({
      fileId: userFolderId,
      requestBody: {
        name: finalFolderName
      }
    });
    if (updatedFolder.status === 200) {
      console.log("folder renamed successfully");
    }
    return true;
  }

  checkDriveFolderStorage = async () => {
    return this.drive.about.get({
      fields: 'storageQuota',
    })
  }

}
