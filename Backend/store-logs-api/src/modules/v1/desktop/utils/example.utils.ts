import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { UploadDto } from '../dto/upload.dto';

export class ExampleUtils implements StorageUtilInterface {
    async initConnection(storage: any): Promise<void> {

    };

    async prepareFolderPath(email: string): Promise<void> {

    };

    async uploadFile(file: UploadDto): Promise<void> {

    };
}
