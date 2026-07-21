const router = require('express').Router();

const { ResellerController } = require('./Reseller.Controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/reseller', ResellerController.get);
        this.myRoutes.post('/reseller', ResellerController.upsert);
        this.myRoutes.post('/add-client', ResellerController.addClient);
        this.myRoutes.get('/client-stats', ResellerController.clientStats);
        this.myRoutes.delete('/remove-client', ResellerController.removeClient);
        this.myRoutes.get('/reseller-stats', ResellerController.resellerStats);
        this.myRoutes.put('/client-edit', ResellerController.clientEdit);
        this.myRoutes.get('/client-profile', ResellerController.clientProfile);
    }
    getRoutes() {
        return this.myRoutes;
    }
}

module.exports.ResellerRoutes = Routes;