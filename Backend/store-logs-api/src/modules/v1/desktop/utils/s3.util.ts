import { StorageUtilInterface } from '../interfaces/storage-util.interface';
import { UploadDto } from '../dto/upload.dto';
import { createReadStream } from "fs";
import AWS = require('aws-sdk');

export class S3Util implements StorageUtilInterface {
    private s3Client;
    private bucketName;
    private email;
    private main;
    private type;
    private date;

    async initConnection(storage): Promise<void> {
        let { client_id, client_secret, bucket_name, api_endpoint, region } = storage;
        if(bucket_name == "silah-tts") api_endpoint = "https://s3.me-south-1.amazonaws.com";
        this.bucketName = bucket_name;

        // Check if this is MinIO storage based on access key
        const isMinIO = client_id === 'minio' || client_id === 'minioadmin';
        
        // Configure AWS SDK for S3-compatible endpoints (including MinIO)
        const config: any = {
            accessKeyId: client_id,
            secretAccessKey: client_secret,
            region: region || 'us-east-1',
            signatureVersion: 'v4',
        };

        // If api_endpoint is provided or it's MinIO, use it for S3-compatible services
        if (api_endpoint || isMinIO) {
            // For MinIO, use default endpoint if not provided
            if (isMinIO && !api_endpoint) {
                config.endpoint = 'http://localhost:9000';
            } else if (api_endpoint) {
                config.endpoint = api_endpoint;
            }
            
            // For MinIO and other S3-compatible services, use path-style addressing
            config.s3ForcePathStyle = isMinIO || !config.endpoint?.includes('amazonaws.com');
            
            // Disable SSL verification for self-signed certificates if needed
            if (config.endpoint && config.endpoint.startsWith('http://')) {
                config.sslEnabled = false;
            }
        }

        this.s3Client = new AWS.S3(config);
    }

    async prepareFolderPath(email: string, main: string, custom): Promise<void> {
        if (custom?.type == "CUSTOM_DATE_EMAIL_SCREEN_FORMAT_S3") {
            this.type = "CUSTOM_DATE_EMAIL_SCREEN_FORMAT_S3";
            this.date = custom?.date;
        } else {
            this.main = main;
            this.email = email;
            this.type = null;
        }
    }

    async uploadFile({ originalname, filepath, mimetype }: UploadDto): Promise<void> {
        if (this.type == "CUSTOM_DATE_EMAIL_SCREEN_FORMAT_S3") {
            const key = `${this.main}/${this.date}/${this.email}/${originalname}`;

            // Setting up S3 upload parameters
            const params = {
                Bucket: this.bucketName,
                Key: `${key}`, // File name you want to save as in S3
                Body: createReadStream(filepath),
                ACL: 'private',
                ContentType: mimetype,
            };
            return await this.s3Client.upload(params).promise();
        }
        else {
            const day = originalname.substr(3, 10);
            const key = `${this.main}/${this.email}/${day}/${originalname}`;

            // Setting up S3 upload parameters
            const params = {
                Bucket: this.bucketName,
                Key: `${key}`, // File name you want to save as in S3
                Body: createReadStream(filepath),
                ACL: 'private',
                ContentType: mimetype,
            };
            await this.s3Client.upload(params).promise();
        }
    }
}
