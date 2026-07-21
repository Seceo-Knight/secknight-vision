import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { UploadDto } from '../dto/upload.dto';
import OneDriveAPI from 'one-drive-api-pools';
import { createReadStream } from 'fs';
import { isEmpty } from 'underscore';

const Api = new OneDriveAPI();

export class OnedriveUtils implements StorageUtilInterface {
  private maxFileSize: number = 4_000_000; // 4mb
  private pool: string;
  private userFolderId: string;
  private dayfolderIds = {};
  private userEmailFolder: string = "";

  async initConnection(storage: any): Promise<void> {
    const {
      onedrive_refresh_token,
      onedrive_client_id,
      onedrive_client_secret,
      onedrive_redirect_url,
    } = storage;
    this.pool = onedrive_client_id;
    const haveConnect = Api.checkCreds(this.pool);
    if (!haveConnect) {
      await Api.addConection(this.pool, {
        client_id: onedrive_client_id,
        client_secret: onedrive_client_secret,
        redirect_uri: onedrive_redirect_url,
        refresh_token: onedrive_refresh_token,
      });
    }
  }

  async prepareFolderPath(email: string, main: string, customData): Promise<void> {
    if (customData?.type == "CUSTOM_DATE_EMAIL_SCREEN_FORMAT") {
      const mainFolderId: string = await this.getMainFolderId(main);
      this.userFolderId = await this.getFolder(customData.day, mainFolderId);
      this.userEmailFolder = email;
    }
    else {
      const mainFolderId: string = await this.getMainFolderId(main);
      this.userFolderId = await this.getFolder(email, mainFolderId);
      this.userEmailFolder = null;
    }
  }


  async uploadFile(file: UploadDto): Promise<void> {
    if (this.userEmailFolder) {
      const dayFolderId: string = await this.getDayFolderId(this.userEmailFolder);

      await this.uploadFileToDrive(file, dayFolderId);
    }
    else {
      const day: string = file.originalname.substr(3, 10);
      const dayFolderId: string = await this.getDayFolderId(day);

      await this.uploadFileToDrive(file, dayFolderId);
    }
  }

  async getMainFolderId(main: string): Promise<string> {
    let mainFolderId = Api.getFromCashe({ pool: this.pool, key: main });
    if (mainFolderId) return mainFolderId;

    mainFolderId = await this.getFolder(main, 'root');
    Api.setToCashe({ pool: this.pool, key: main, data: mainFolderId });

    return mainFolderId;
  }

  async getDayFolderId(day) {
    let dayFolderId: string = this.dayfolderIds[day];
    if (dayFolderId) return dayFolderId;

    dayFolderId = await this.getFolder(day, this.userFolderId);
    this.dayfolderIds[day] = dayFolderId;

    return dayFolderId;
  }

  async getFolder(folderName: string, itemId: string): Promise<string> {
    let folder: any;
    let condition = true;
    let nextToken = "";
    let accountData = {
      value: [],
    }

    while (condition) {
      let apiConfig = {
        itemId,
        query: '',
      }
      if (nextToken) apiConfig.query = nextToken;
      let tempResponse = await Api.items.listChildren(this.pool, apiConfig);

      if (tempResponse['@odata.count'] !== tempResponse.value.length && tempResponse['@odata.nextLink']) {
        nextToken = `?${tempResponse['@odata.nextLink']?.split('?')[1]}`;
        accountData.value = [...accountData.value, ...tempResponse['value']]
      } else if (accountData.value.length == 0) {
        accountData = tempResponse;
        condition = false;
      } else if (accountData.value.length) {
        accountData.value = [...accountData.value, ...tempResponse['value']];
        condition = false;
        nextToken = "";
      }
    }

    if (!isEmpty(accountData.value)) {
      folder = accountData.value.find(file => file.name === folderName);
      if (folder) return folder.id;
    }

    folder = await this.createFolder(folderName, itemId);
    return folder.id;
  }

  async createFolder(name: string, rootItemId: string): Promise<any> {
    return Api.items.createFolder(this.pool, {
      rootItemId,
      name,
    });
  }

  async uploadFileToDrive(file: UploadDto, parentId: string): Promise<void> {
    const readableStream = createReadStream(file.filepath);
    if (file.size < this.maxFileSize) {
      await Api.items.uploadSimple(this.pool, {
        parentId,
        readableStream,
        filename: file.originalname,
      });

      return;
    }

    await Api.items.uploadSession(this.pool, {
      parentId,
      readableStream,
      fileSize: file.size,
      filename: file.originalname,
    });
  }
}
