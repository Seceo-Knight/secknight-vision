const router = require('express').Router();
const declarationSettingController = require('./declaration-setting.controller');

class DeclarationSettingRoutes {
    constructor() {
        this.declarationSettingRoutes = router;
        this.core();
    }

    core() {
        this.declarationSettingRoutes.get('/', declarationSettingController.getDeclarationSettings);
        this.declarationSettingRoutes.put('/', declarationSettingController.putDeclarationSettings);
    }

    getRouters() {
        return this.declarationSettingRoutes;
    }
}

module.exports = DeclarationSettingRoutes;