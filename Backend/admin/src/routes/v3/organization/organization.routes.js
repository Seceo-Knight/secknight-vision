'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const router = require('express').Router();
const OrganizationController = require('./organization.controller');
const { Routes: AppNameRoutes } = require('./appNames');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Adding all the routes here
        this.myRoutes.get('/get-role', OrganizationController.getRoles);
        this.myRoutes.get('/admin-feature', OrganizationController.getOrganizationFeature);
        // this.myRoutes.post('/update-feature', OrganizationController.UpdateFeature);
        this.myRoutes.post('/update-feature-new', OrganizationController.updateSettigFeatures);
        this.myRoutes.put('/update-org-details', OrganizationController.updateOrgnizationDetails);
        this.myRoutes.get('/organization-details', OrganizationController.orgDetails);
        this.myRoutes.get('/upload-logo', OrganizationController.orgGetUploadLogo);
        this.myRoutes.post('/upload-logo', OrganizationController.orgUploadLogo);
        this.myRoutes.use('/app-names', new AppNameRoutes().getRouters());
        this.myRoutes.post('/product-tour-status', OrganizationController.updateProductTourStatus);
        
        this.myRoutes.post('/update-2fa-status', OrganizationController.update2FAStatus);
        this.myRoutes.get('/get-2fa-status', OrganizationController.get2FAStatus);

        this.myRoutes.get('/mfa-config', OrganizationController.getMFAConfig);
        this.myRoutes.post('/verify-mfa', OrganizationController.verifyMFA);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;