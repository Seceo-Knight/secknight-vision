// Organization Details Routes

const router = require('express').Router();
const controller = require('./organizationDetails.controller');


class OrganizationDetailsRoutes {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/', controller.getOrganizationDetails);
        this.myRoutes.post('/basicDetails', controller.basicDetails);
        this.myRoutes.post('/bankDetails', controller.bankDetails);
        this.myRoutes.post('/complianceDetails', controller.complianceDetails);
        this.myRoutes.get('/org-logo', controller.getOrgLogo);
        this.myRoutes.post('/upload-org-logo', controller.uploadImage);
    }

    getRouters() {
        return this.myRoutes;
    }
}


// exports
module.exports = OrganizationDetailsRoutes;