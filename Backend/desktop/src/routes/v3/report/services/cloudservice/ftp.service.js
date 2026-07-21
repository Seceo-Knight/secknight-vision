const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const FTPUtils = require('../../../../../utils/helpers/FTPUtils');

class FTP {
	constructor() {
        this.domain = this.getDomain();
    }
    getDomain() {
        const {
            NODE_ENV: env,
            ADMIN_URL_LOCAL: localDomain,
            ADMIN_URL_DEV: devDomain,
            ADMIN_URL_PRODUCTION: prodDomain,
        } = process.env;

        switch (env) {
            case 'production':
                return `${prodDomain}api/v3`;
            case 'development':
                return `${devDomain}api/v3`;
            default:
                return `${localDomain}api/v3`;
        }
    }

    /**upload attachments to ftp server*/
    async uploadAttachments(folderName, filename, creds, filePath, originalname) {
		const { ftp_path } = creds;
        const folderPath = ftp_path + folderName;

        const client = await FTPUtils.initConection(creds);
        const ftp_promise_client = await FTPUtils.initConectionForPromiseFtp(creds);
        
        const checkDirpromise = client.ensureDir(folderPath);
        const fileStream = fs.createReadStream(filePath);

        const ext = path.extname(originalname);
        const fullName = `${filename}.${ext}`;

        await checkDirpromise;
        await ftp_promise_client.put(fileStream, `/${folderPath}/${fullName}`);

        await client.close();
        await ftp_promise_client.end();

        const encodedCreds = this.encodeCreds(creds, '90d');
        const file_path = `${folderPath}/${fullName}`;

        return this.parseLink(file_path, encodedCreds);
    }

	encodeCreds(creds, expiresIn) {
        return jwt.sign(
            {
                creds,
            },
            process.env.FTP_HTTP_PROXY_KEY,
            { expiresIn },
        );
    }

	parseLink(path, encodedCreds) {
        return `${this.domain}/ftp-http-proxy?path=${path}&store=${encodedCreds}`;
    }
}

module.exports = new FTP();