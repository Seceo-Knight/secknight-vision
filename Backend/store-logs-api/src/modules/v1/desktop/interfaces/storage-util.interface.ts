import { UploadDto } from '../dto/upload.dto';

export class StorageUtilInterface {
    initConnection: (storage, organization_id) => Promise<void>;
    prepareFolderPath: (email: string, main: string, custom: any) => Promise<void>;
    uploadFile: (file: UploadDto) => Promise<void>;
    closeConnection?: () => Promise<void>;
    checkIfOfficeAgentFolderExist?: (userData: any) => Promise<void>;
    deleteCreds?: (organization_id: any) => Boolean;
}
