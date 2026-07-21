const router = require('express').Router();
const PfController = require('./pf.controller');

class PfRoutes {
    constructor() {
        this.pfRoutes = router;
        this.core();
    }

    core() {
        this.pfRoutes.get('/', PfController.getPfSettings);
        this.pfRoutes.put('/', PfController.updatePfSettings);
    }

    getRouters() {
        return this.pfRoutes;
    }
}

module.exports = PfRoutes;