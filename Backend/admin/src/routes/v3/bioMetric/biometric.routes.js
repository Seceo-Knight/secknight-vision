const router = require('express').Router();

const BiometricController = require('./biometric.controller');
const AuthMiddleware = require('../../v3/auth/services/auth.middleware');
const BioMiddlewareService = require('./biometric.middleware');


const multer = require('multer');



let processFile = multer({
    storage: multer.memoryStorage(),
}).array('files');

class BiometricRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    
    core() {
        //New Biometric Routes
        this.myRoutes.post('/enable-biometric',AuthMiddleware.authenticate, BiometricController.enableBiometric);
        this.myRoutes.get('/status',AuthMiddleware.authenticate, BiometricController.checkStatus);
        this.myRoutes.post('/set-password',AuthMiddleware.authenticate, BiometricController.setPassword);
        this.myRoutes.post('/auth', BiometricController.auth);
        this.myRoutes.get('/get-users',BioMiddlewareService.authenticate, BiometricController.fetchUser);
        this.myRoutes.post('/update-user', processFile, BioMiddlewareService.authenticate,BiometricController.updateUser);
        this.myRoutes.post('/get-user-info',BioMiddlewareService.authenticate, BiometricController.getUser);
        this.myRoutes.post('/forgot-secret-key',BiometricController.forgotSecretKey)
        this.myRoutes.post('/verify-secret-key',BiometricController.verifyKey)
        this.myRoutes.get('/get-locations', BioMiddlewareService.authenticate, BiometricController.getLocations)
        this.myRoutes.post('/attendance-summary',BioMiddlewareService.authenticate, BiometricController.attendanceSummary)
        this.myRoutes.post('/attendance-details',BioMiddlewareService.authenticate,BiometricController.attendanceDetails)
        this.myRoutes.get('/holidays',BioMiddlewareService.authenticate,BiometricController.getHolidays);
        this.myRoutes.get('/fetch-employee-password-enable-status',BioMiddlewareService.authenticate,BiometricController.fetchEmployeePasswordStatusEnable);
        this.myRoutes.post('/verify-secretKey', BioMiddlewareService.authenticate,BiometricController.verifySecretKey);
        this.myRoutes.get('/get-department', BioMiddlewareService.authenticate, BiometricController.getDepartment);
        this.myRoutes.get('/qr-code', BiometricController.getQrCode);
        this.myRoutes.delete('/delete-user-profile-image', BioMiddlewareService.authenticate, BiometricController.deleteUserProfileImage);

    }
    
    getRouters() {
        return this.myRoutes;
    }
}

module.exports = BiometricRoutes;