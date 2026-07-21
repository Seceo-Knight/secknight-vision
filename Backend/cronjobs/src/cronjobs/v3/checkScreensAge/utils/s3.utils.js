const AWS = require('aws-sdk');
const fs = require('fs');
const autoDeleteScreensLcRule = {
    Expiration: {
        Days: 90,
    },
    Filter: {
        Prefix: 'EmpMonitor/',
    },
    ID: 'EmpMonitorAutoDeleteScreens',
    Status: 'Enabled',
    NoncurrentVersionExpiration: {
        NoncurrentDays: 1
    },
};
const s3LifecycleOneRule = {
    Rules: [autoDeleteScreensLcRule],
};

class S3 {
    initConection({ client_id, client_secret, region, bucket_name, api_endpoint, forcePathStyle = false }) {
        if (bucket_name == "silah-tts") api_endpoint = "https://s3.me-south-1.amazonaws.com";
        
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

    async checkBucketLcConfig({ s3, setParams }, auto_delete_period) {
        s3LifecycleOneRule.Rules[0].Expiration.Days = auto_delete_period;

        const s3LifecycleConfig = await s3
            .getBucketLifecycleConfiguration(setParams())
            .promise()
            .catch((error) => {
                if (error.statusCode === 404) {
                    return error.statusCode;
                }

                throw error;
            });
        if (s3LifecycleConfig === 404) {
            return s3LifecycleOneRule;
        }
        const haveEmpAutoScreenConfig = s3LifecycleConfig.Rules.some((rule) => (rule.ID === autoDeleteScreensLcRule.ID));
        if (haveEmpAutoScreenConfig) {
            if (s3LifecycleConfig.Rules.some((rule) => (rule.Expiration.Days == auto_delete_period))) {
                return null;
            } else {
                await s3
                    .deleteBucketLifecycle(setParams())
                    .promise()
                    .catch((error) => {
                        if (error.statusCode === 404) {
                            return error.statusCode;
                        }
                        throw error;
                    });
                return s3LifecycleOneRule;
            }
        }

        return { Rules: [...s3LifecycleConfig.Rules, autoDeleteScreensLcRule] };
    }
    async createBucketLcConfig({ s3, setParams }, lcConfig) {
        const params = setParams({ LifecycleConfiguration: lcConfig });
        return await s3.putBucketLifecycleConfiguration(params).promise();
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
}

module.exports = new S3();