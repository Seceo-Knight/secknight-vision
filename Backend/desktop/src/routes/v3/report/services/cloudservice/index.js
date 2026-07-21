const { promisify } = require('util');
const fs = require('fs');

const storages = {
    GD: require('./googleDrive.service'),
    S3: require('./s3.service'),
    MO: require('./oneDrive.service'),
    FTP: require('./ftp.service'),
    ZH: require('./zohoWorkDrive.service')
}

class CloudStorageServices {

    deleteFileFromLocal(name) {
        const unlinkWithPromise = promisify(fs.unlink);

        return unlinkWithPromise(name);
    }

    getStorage(name) {
        return storages[name];
    }
}

module.exports = new CloudStorageServices;