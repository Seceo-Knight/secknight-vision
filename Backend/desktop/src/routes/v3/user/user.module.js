'use strict';
const router = require('express').Router();
const userController = require('./user.controller');

const { APIRateLimiterSystemInfo } = require("../auth/services/Rate.middleware");
const fs = require('fs');
const multer = require('multer');

// Ensure attachments directory exists for temporary storage
const attachmentsDir = __dirname.split('src')[0] + 'public/attachments';
if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Multer middleware to handle email monitoring attachments
const uploadEmailMonitoringAttachments = multer({
    dest: attachmentsDir
}).array('attachments', 100);

class UserModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.get('/me', userController.me);
        this.routes.get('/config', userController.configs);
        // this.routes.post('/system-info', APIRateLimiterSystemInfo, userController.systemInfo);
        this.routes.post('/system-info', userController.systemInfo);
        this.routes.post('/uninstall-auth', userController.uninstallCodeCheck);
        this.routes.get('/log-out', userController.userLogOut);
        this.routes.post('/raised-alert', userController.raisedAlert);
        this.routes.get('/get-storage-details', userController.getStorageDetails);
        this.routes.post('/save-system-log', userController.saveSystemLog);

        // Attach multer middleware so req.body and req.files are populated for multipart/form-data
        this.routes.post('/save-email-monitoring-log', uploadEmailMonitoringAttachments, userController.saveEmailMonitoringLog);
    }

    getRouters() {
        return this.routes;
    }
}

module.exports = UserModule;