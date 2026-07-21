
const router = require('express').Router();
const declarationController = require('./declaration.controller');
const { DeductionsRoutes } = require('./deductions/deductions.routes');
class DeclarationRoutes {
    constructor() {
        this.declarationRoutes = router;
        this.core();
    }

    core() {
        this.declarationRoutes.post('/', declarationController.postDeclaration);
        this.declarationRoutes.post('/upload-data', declarationController.postDeclarationData);
        this.declarationRoutes.post('/upload-file', declarationController.postDeclarationUpload);
        this.declarationRoutes.get('/employees-tax-scheme', declarationController.getEmployeesTaxschemeDetails);
        this.declarationRoutes.get('/tax-correction', declarationController.getTaxCorrectionData);
        this.declarationRoutes.post('/tax-correction', declarationController.postTaxCorrectionData);
        this.declarationRoutes.get('/schemes', declarationController.schemesList);
        this.declarationRoutes.put('/update-schemes', declarationController.updateSchemes);
        this.declarationRoutes.use('/deductions', new DeductionsRoutes().getRouters());
    }

    getRouters() {
        return this.declarationRoutes;
    }
}

module.exports = DeclarationRoutes;