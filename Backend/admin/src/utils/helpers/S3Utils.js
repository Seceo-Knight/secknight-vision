const fs = require('fs');
const AWS = require('aws-sdk');
const _ = require('lodash');


class S3Utils {
    constructor() {
        this.domains = this.getDomains();
    }
    getDomains = () => {
        const { NODE_ENV: env, WEB_LOCAL: localDomain, WEB_DEV: devDomain, WEB_PRODUCTION: prodDomain } = process.env;
        const domains = ['http://localhost*'];
        switch (env) {
            case 'local':
                this.frontDomain = localDomain;
                domains.push(localDomain);
                break;
            case 'development':
                this.frontDomain = devDomain;
                domains.push(devDomain);
                break;
            case 'production':
                this.frontDomain = prodDomain;
                domains.push(prodDomain);
                break;
            default:
                break;
        }
        return domains;
    };

    initConection({ client_id, client_secret, region, bucket_name, api_endpoint, forcePathStyle = false }) {
        if(bucket_name == "silah-tts") api_endpoint = "https://s3.me-south-1.amazonaws.com";
        
        // Check if this is MinIO storage based on access key
        const isMinIO = client_id === 'minio' || client_id === 'minioadmin';
        
        // Configure AWS SDK for S3-compatible endpoints (including MinIO)
        const config = {
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
            config.s3ForcePathStyle = forcePathStyle || isMinIO || !config.endpoint?.includes('amazonaws.com');
            
            // Disable SSL verification for self-signed certificates if needed
            if (config.endpoint && config.endpoint.startsWith('http://')) {
                config.sslEnabled = false;
            }
        }

        AWS.config.update(config);
        const s3 = new AWS.S3();
        const params = { Bucket: bucket_name };

        return {
            s3,
            setParams: (newParams) => ({ ...params, ...newParams }),
        };
    }

    async getKeyWithDate(s3, params, day) {
        const keyData = await s3.listObjectsV2(params).promise();

        return { count: keyData.Contents.length, name: day };
    }

    async getObjects({ s3, setParams }, prefix, marker, limit) {
        const params = setParams({
            Delimiter: '/',
            Prefix: prefix,
            MaxKeys: limit,
            Marker: marker,
        });

        return s3.listObjects(params).promise();
    }

    async uploadScreen(folderName, { originalname, filename: name, mimetype: ContentType }, creds) {
        const ext = _.last(originalname.split('.'));
        const secIn7Day = 604800;
        const content = fs.readFileSync(
            `${publicFolder}/images/profilePic/${name}`
        );
        const { s3, setParams } = this.initConection(creds);

        const uploadParams = setParams({
            Key: `${folderName}/${name}.${ext}`,
            Body: content,
            ACL: 'private',
            ContentType
        });

        const { key } = await s3.upload(uploadParams).promise();

        const getLinkParams = setParams({
            Key: key,
            Expires: secIn7Day,
        })
        const link = s3.getSignedUrl('getObject', getLinkParams);

        return link
    }

    parseCorsParams = (rules) => {
        const corsRule = {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET'],
            AllowedOrigins: this.domains,
            MaxAgeSeconds: 3000,
        };
        const CORSRules = rules ? [...rules, corsRule] : [corsRule];

        return {
            CORSConfiguration: { CORSRules },
            ContentMD5: '',
        }
    }

    async checkS3CorsPolicy(creds) {
        const { s3, setParams } = this.initConection(creds);

        // --- Step 1: Detect if endpoint is MinIO ---
        const isMinIO = await this.isMinIOStorage(s3, setParams);
        if (isMinIO) {
            return this.verifyMinIODirectoryAccess(s3, setParams);
        }

        // --- Step 2: Proceed with AWS CORS policy check ---
        try {
            const { CORSRules } = await s3.getBucketCors(setParams()).promise();
            const haveRule = CORSRules.some(rule => {
                return rule.AllowedOrigins.some(domain => domain === this.frontDomain);
            });

            if (haveRule) return;

            const filteredRules = CORSRules.filter(rule => {
                const allowDomain = _.get(rule, 'AllowedOrigins[0]');
                return allowDomain !== '*';
            });

            const params = setParams(this.parseCorsParams(filteredRules));
            return s3.putBucketCors(params).promise();

        } catch (error) {
            // --- Step 3: Handle missing or unsupported CORS ---
            if (error.code === 'NoSuchCORSConfiguration') {
                const params = setParams(this.parseCorsParams());
                return s3.putBucketCors(params).promise();
            }

            // Skip NotImplemented (MinIO fallback)
            if (error.code === 'NotImplemented') {
                return this.verifyMinIODirectoryAccess(s3, setParams);
            }

            throw error;
        }
    }

    async isMinIOStorage(s3, setParams) {
        try {
            // Fast check based on endpoint hostname or URL (before any API calls)
            const endpoint = s3.config.endpoint?.hostname || s3.config.endpoint || '';
            const endpointString = typeof endpoint === 'string' ? endpoint : endpoint?.href || '';
            
            // Check if endpoint indicates MinIO
            if (/minio/i.test(endpointString) || /localhost/i.test(endpointString) || /127\.0\.0\.1/.test(endpointString)) {
                return true;
            }

            // Lightweight probe: getBucketLocation (safe and widely supported)
            const res = await s3.getBucketLocation(setParams()).promise();
            
            // AWS returns a proper region; MinIO often returns empty or null
            if (!res.LocationConstraint || res.LocationConstraint === '') {
                return true;
            }

            return false;
        } catch (error) {
            // MinIO might throw NotImplemented for certain operations
            if (error.code === 'NotImplemented') {
                return true;
            }
            // If we get other errors, assume it's not MinIO (or we can't determine)
            return false;
        }
    }

    async verifyMinIODirectoryAccess(s3, setParams) {
        try {
            // Try listing objects — proves bucket accessibility
            const data = await s3.listObjectsV2(setParams()).promise();
            return true;
        } catch (error) {
            throw new Error(`MinIO bucket access failed: ${error.message}`);
        }
    }


    async deleteObject({ s3, setParams }, Key) {
        const params = setParams({
            Key: Key
        });

        return s3.deleteObject(params).promise();
    }

    async uploadReport(folderName, { originalname, fileName: name, mimetype: ContentType, path }, creds) {
        const secIn7Day = 604800;
        const content = fs.readFileSync(
            `${path}/${name}`
        );
        const { s3, setParams } = this.initConection(creds);

        const uploadParams = setParams({
            Key: `${folderName}/${name}`,
            Body: content,
            ACL: 'private',
            ContentType
        });

        const { key } = await s3.upload(uploadParams).promise();

        const getLinkParams = setParams({
            Key: key,
            Expires: secIn7Day,
        })
        const link = s3.getSignedUrl('getObject', getLinkParams);

        return link
    }
}
module.exports = new S3Utils();