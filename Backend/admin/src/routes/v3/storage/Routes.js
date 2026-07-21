const router = require('express').Router();

const StorageController = require('./Storage.controller')

const multer  = require('multer')
const upload = multer({ dest: __dirname.split('src')[0]+"public/pem_keys" })

class EmployeeRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/get-storage-types', StorageController.getStorageTypes);
        this.myRoutes.post('/add-storage-data', StorageController.addStorageData);
        this.myRoutes.post("/add-sftp-integration", upload.single("file"), StorageController.addSftpIntegrationData);
         this.myRoutes.post("/add-webdav-integration", StorageController.addWebdavIntegrationData);
        this.myRoutes.get('/get-storage-type-with-data', StorageController.getStorageTypeWithData);
        this.myRoutes.delete('/delete-storage-data', StorageController.deleteStorageData);
        this.myRoutes.put('/update-storage-data', StorageController.updateStorageData);
        this.myRoutes.put('/update-storage-option', StorageController.UpdateStorageOption);
        this.myRoutes.get('/active-storage-type', StorageController.getActiveStorageType);
        this.myRoutes.post('/add-storage-reseller', StorageController.addStorageDataForReseller);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = EmployeeRoutes;