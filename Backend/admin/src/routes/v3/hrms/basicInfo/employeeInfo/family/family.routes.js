const familyController = require('./family.controller');

const router = require('express').Router();

class Family {
    constructor() {
        this.myRoutes = router;
        this.core();    
    }

    core() {     
        this.myRoutes.get('/', familyController.getFamily);
        this.myRoutes.post('/', familyController.postFamily);
        this.myRoutes.put('/', familyController.putFamily);
        this.myRoutes.delete('/', familyController.deleteFamily);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Family;