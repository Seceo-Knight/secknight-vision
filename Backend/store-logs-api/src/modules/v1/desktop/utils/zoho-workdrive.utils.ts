import { createReadStream } from 'fs';
import ZohoWorkDrive from './zoho-client';
import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { IFolderIds } from '../interfaces/storage-folders-cache.interface';
import { UploadDto } from '../dto/upload.dto';

const Api = new ZohoWorkDrive();

export class ZohoWorkdriveUtils implements StorageUtilInterface {
  private teamId: string;
  private privateSpaceId: string | null = null;
  private emailFolderId: string;
  private dayFolderIds: IFolderIds = {};
  private hourFolderIds: IFolderIds = {};

  setRedisClient(redisClient: any): void {
    if (Api && !Api['_redis']) {
      Api.setRedis({
        get: (key: string) => redisClient.get(key),
        set: (key: string, value: string, ttl: number) => redisClient.set(key, value, 'EX', ttl),
        del: (key: string) => redisClient.del(key),
      });
    }
  }

  async initConnection(storage: any, organization_id?: number): Promise<void> {
    const {
      zoho_refresh_token,
      domain,
      zoho_client_id,
      zoho_client_secret,
      team_id,
      private_space_id,
    } = storage;
    this.teamId = team_id;
    this.privateSpaceId = private_space_id || null;
    const orgId = organization_id ? String(organization_id) : undefined;
    const haveConnect = await Api.checkCreds(this.teamId, orgId);
    if (!haveConnect) {
      await Api.addConection(this.teamId, {
        clientId: zoho_client_id,
        clientSecret: zoho_client_secret,
        refreshToken: zoho_refresh_token,
        domain,
        privateSpaceId: private_space_id,
      } as any, orgId);
    }
    if (!this.privateSpaceId) {
      const cached = Api.getPrivateSpaceId(this.teamId);
      if (cached) this.privateSpaceId = cached;
    }
  }

  async prepareFolderPath(email: string, main: string): Promise<void> {
    const wSpaceId: string = await this.getWsId(main);
    this.emailFolderId  = await this.getFolderId(wSpaceId, email);
  }
  
  async uploadFile(file: UploadDto): Promise<void> {
    const day: string = file.originalname.slice(3, 13);

    const parentId: string = await this.getDateFolderId(day);

    await this.existOrCreateShare(parentId);
    await this.uploadFileToDrive(file, parentId);
  }

  async getWsId(teamFolderName: string): Promise<string> {
    let wsId = await Api.getFromCashe({ key: teamFolderName, pool: this.teamId });

    if (!wsId) {
      let items: any[];
      if (this.privateSpaceId) {
        items = (await Api.files.list(this.teamId, { folderId: this.privateSpaceId })) || [];
      } else {
        items = (await Api.ws.all(this.teamId, { teamId: this.teamId })) || [];
      }

      let empMonitor = items.find(
        wspace => wspace?.attributes?.name === teamFolderName,
      );
      if (!empMonitor) empMonitor = await this.createTeamFolder(teamFolderName);

      wsId = empMonitor.id;
      await Api.setToCashe({ key: teamFolderName, pool: this.teamId, data: wsId });
    }

    return wsId;
  }

  createTeamFolder(name: string): Promise<any> {
    if (this.privateSpaceId) {
      return Api.folder.create(this.teamId, {
        parentId: this.privateSpaceId,
        name,
      });
    }
    return Api.ws.create(this.teamId, {
      name,
      teamId: this.teamId,
      isPublicTeam: true,
      description: 'EmpMonitor service screenshots main folder',
    });
  }

  async getDateFolderId(day) {
    let dayFolderId: string = this.dayFolderIds[day];
    
    if(!dayFolderId) {
      dayFolderId = await this.getFolderId(this.emailFolderId, day);
      this.dayFolderIds[day] = dayFolderId;
    }

    return dayFolderId;
  }

  async getHourFolderId(hour, dayFolderId) {
    let hourFolderId: string = this.hourFolderIds[hour];
  
    if(!hourFolderId) {
      hourFolderId = await this.getFolderId(dayFolderId, hour);
      this.hourFolderIds[hour] = hourFolderId;
    }

    return hourFolderId;
  }

  async getFolderId(folderId: string, folderName: string) {
    let folder: any;
    const data = await Api.files.list(this.teamId, {
      folderId,
    });
    if (data.length !== 0) {
      folder = data.find(folder => folder.attributes.name === folderName);
    }

    if (data.length === 0 || !folder) {
      folder = await this.createFolder(folderId, folderName);
    }

    return folder.id;
  }

  async createFolder(parentId: string, name: string): Promise<any> {
    return Api.folder.create(this.teamId, { parentId, name });
  }

  async existOrCreateShare(fileId): Promise<void> {
    const links = await Api.share.list(this.teamId, {
      fileId,
    });
    const link = links.find(
      link => link.attributes?.link_name === fileId,
    );

    if (!link) {
      await this.createShare(fileId);
    }
  }

  createShare(resourceId: string) {
    return Api.share.createDownLoad(this.teamId, {
      resourceId,
      name: resourceId,
      requestUserData: false,
    });
  }

  async uploadFileToDrive(
    { originalname: name, filepath: path, mimetype: contentType }: UploadDto,
    parentId: string,
  ): Promise<void> {
       await Api.files.upload(this.teamId, {
        parentId,
        name,
        contentType,
        overrideNameExist: true,
        readableStream: createReadStream(path),
    });
  }
}
