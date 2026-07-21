const AWS = require("aws-sdk");
const fs = require('fs');

class AmzonSSS {

    /**Check folder exists on specific day */
    async checkDataExists(accessKeyId, secretAccessKey, region, bucket, prefix, cb) {
        AWS.config.update({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            region: region,
        });

        const s3 = new AWS.S3();

        const params = {
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: 1
        };
        s3.listObjectsV2(params, (err, data) => {
            if (err) {
                cb(err, null);
            } else {
                cb(null, data.Contents)
            }
        })
    }
    /**Get screenshot from s3 bucket */
    async getScreenshots(accessKeyId, secretAccessKey, region, bucket, prefix, marker, cb) {
        AWS.config.update({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            region: region,
        });
        const s3 = new AWS.S3();

        const params = {
            Bucket: bucket,
            Delimiter: "/",
            Prefix: prefix,
            MaxKeys: 500,
            Marker: marker
        };

        s3.listObjects(params, function (err, data) {
            if (err) {
                cb(err, null);
            } else {
                cb(null, data.Contents);
            }
        });
    }

    /**Get screenshot from s3 bucket */
    async uploadProfilePic(accessKeyId, secretAccessKey, region, bucket, key, cb) {

        const fileContent = fs.readFileSync(`${__dirname.split('src')[0]}/public/images/profilePic/${key}`);
        const s3 = new AWS.S3({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        });
        // Setting up S3 upload parameters
        const params = {
            Bucket: bucket,
            Key: `EmpmonitorProfilePic/${key}.jpg`, // File name you want to save as in S3
            Body: fileContent,
            ACL: 'public-read',

        };
        // Uploading files to the bucket
        s3.upload(params, function (err, data) {
            if (err) {
                cb(err, null);
            } else {
                cb(null, data.Location);
            }
        });
    }

    deleteFileFromLocal(name) {
        fs.unlinkSync(`${__dirname.split('src')[0]}/public/images/profilePic/${name}`);
        return;
    }
}

module.exports = new AmzonSSS;