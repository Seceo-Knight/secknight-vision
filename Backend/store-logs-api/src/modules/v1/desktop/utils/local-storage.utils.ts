import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { UploadDto } from '../dto/upload.dto';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

/**
 * Local-disk storage provider. Saves screenshots/recordings permanently
 * under a directory on this server instead of shipping them to a third
 * party (Google Drive, S3, etc). Implements the same StorageUtilInterface
 * contract as every other provider so it plugs into ScreenshotService /
 * ScreenRecordService's existing uploadToCloud() flow unchanged.
 *
 * Note: saveFiles() (file.utils.ts) already writes an incoming file to a
 * *temporary* path under UPLOAD_PATH before uploadToCloud() runs, and the
 * caller deletes that temp copy right after uploadFile() resolves
 * successfully - exactly like it would after a real cloud upload. So
 * uploadFile() here must COPY (not just leave in place) the temp file into
 * the permanent local archive directory, otherwise the caller's cleanup
 * step would delete the only copy.
 */
export class LocalStorageUtils implements StorageUtilInterface {
    private dirPath: string;

    private getArchiveRoot(): string {
        // Optionally overridable per-org via stored creds ({"basePath": "..."})
        // but defaults to a dedicated directory next to the existing temp
        // upload path so it survives independently of temp-file cleanup.
        return resolve(process.env.LOCAL_STORAGE_PATH || './public/local-storage');
    }

    async initConnection(storage: any, organization_id: any): Promise<void> {
        // no external connection needed for local disk
        return;
    }

    async prepareFolderPath(email: string, main: string, custom: any): Promise<void> {
        this.dirPath = join(this.getArchiveRoot(), main, email);
        await fs.mkdir(this.dirPath, { recursive: true });
    }

    async uploadFile(file: UploadDto): Promise<void> {
        const dest = join(this.dirPath, file.originalname);
        await fs.copyFile(file.filepath, dest);
    }

    async closeConnection(): Promise<void> {
        return;
    }
}
