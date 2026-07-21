const router = require('express').Router();
const EsiController = require('./esi.controller');

class EsiRoutes {
    constructor() {
        this.esiRoutes = router;
        this.core();
    }

    core() {
        this.esiRoutes.get('/', EsiController.getEsiSettings);
        this.esiRoutes.put('/', EsiController.updateEsiSettings);
    }

    getRouters() {
        return this.esiRoutes;
    }
}

module.exports = EsiRoutes;