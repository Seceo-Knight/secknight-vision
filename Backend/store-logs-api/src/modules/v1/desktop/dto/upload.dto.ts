export class UploadDto {
  originalname: string;
  filename: string;
  filepath: string;
  fieldname?: string;
  mimetype: string;
  size?: number;
  buffer: Buffer;
  uploaded: boolean;
  // Set by Multer's disk storage engine (see desktop.module.ts's
  // MulterModule.register({ dest: ... })) - the raw temp file location
  // under SS_UPLOAD_PATH before saveFiles() moves it into UPLOAD_PATH.
  path?: string;
}
