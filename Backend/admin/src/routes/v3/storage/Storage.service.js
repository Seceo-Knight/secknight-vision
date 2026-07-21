const _ = require('lodash');
const S3Utils = require(`${utilsFolder}/helpers/S3Utils`);
const GDUtils = require(`${utilsFolder}/helpers/GoogleDriveUtils`);
const ODUtils = require(`${utilsFolder}/helpers/OneDriveUtils`); 
const ZohoUtils = require(`${utilsFolder}/helpers/ZohoUtils`);
const FTPUtils = require(`${utilsFolder}/helpers/FTPUtils`);
const DropboxUtils = require(`${utilsFolder}/helpers/Dropbox`);

const checkStorages = {
    S3: (creds) => S3Utils.checkS3CorsPolicy(creds),
    GD: (creds) => GDUtils.checkAccess(creds),
    MO: (creds) => ODUtils.checkAccess(creds),
    ZH: (creds) => ZohoUtils.checkAccess(creds),
    FTP: (creds) => FTPUtils.initConection(creds),
    DB: (creds) => DropboxUtils.checkAccess(creds)
}

class StorageService {
    customAssign(object, sources) {
        return _.assignInWith(object, sources, (objValue, srcValue) => srcValue || objValue);
    }

    getFTPPath(path) {
        if (path) {
            const end = _.last(path.split(''));

            return end === '/' ? path : path + '/';
        }

        return null;
    }

    isUniqStore(field, fieldName, dbCreds) {
        return dbCreds.every(credRow => {
            const creds = JSON.parse(credRow.creds);
            return creds[fieldName] !== field;
        });
    }

    isUniqStoreFTP({ host, username }, dbCreds) {
        return dbCreds.every(credRow => {
            const creds = JSON.parse(credRow.creds);
            if (host === creds.host) {
                return creds.username !== username;
            }

            return true;
        });
    }

    checkAccessToStorage(type, creds) {
        return checkStorages[type](creds);
    }
}

module.exports = new StorageService();