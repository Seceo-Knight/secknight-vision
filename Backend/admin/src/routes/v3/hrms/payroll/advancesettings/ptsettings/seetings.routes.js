const router = require('express').Router();

const { PayRollSetting } = require('./settings.controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/', PayRollSetting.professionalTax);
        this.myRoutes.get('/', PayRollSetting.getPTSettings);
        this.myRoutes.put('/', PayRollSetting.updatePTSettings);
        this.myRoutes.get('/by-location', PayRollSetting.professionalTaxByLocation);
        this.myRoutes.delete('/locations', PayRollSetting.deletePTLocation);
        this.myRoutes.get('/overview', PayRollSetting.getOverview);
        this.myRoutes.put('/overview', PayRollSetting.updateOverview);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports.PTRoutes = Routes;


