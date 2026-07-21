export class UploadDto {
  originalname: string;
  filename: string;
  filepath: string;
  fieldname?: string;
  mimetype: string;
  size?: number;
  buffer: Buffer;
  uploaded: boolean;
}
