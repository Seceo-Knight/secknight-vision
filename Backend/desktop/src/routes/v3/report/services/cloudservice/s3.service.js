const fs = require('fs');
const AWS = require("aws-sdk");
const path = require('path');

class S3 {

    /**upload to s3*/
    async uploadAttachments(folderName, name, { client_id, client_secret, bucket_name, region }, filePath, orginalPath) {
        try {
            const fileContent = fs.readFileSync(filePath);
            const ext = path.extname(orginalPath);

            const s3 = new AWS.S3({ accessKeyId: client_id, secretAccessKey: client_secret });
            const params = {
                Bucket: bucket_name,
                Key: `${folderName}/${name}${ext}`,
                Body: fileContent,
            };
            const final = await s3.upload(params).promise();
            return final.Location;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = new S3();