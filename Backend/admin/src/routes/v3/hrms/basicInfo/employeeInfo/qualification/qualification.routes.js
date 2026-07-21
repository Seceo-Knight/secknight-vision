const qualificationController = require('./qualification.controller');

const router = require('express').Router();

class Qualification {
    constructor() {
        this.myRoutes = router;
        this.core();    
    }

    core() {
        this.myRoutes.get('/', qualificationController.getQualification);
        this.myRoutes.post('/', qualificationController.postQualification);
        this.myRoutes.put('/', qualificationController.putQualification);
        this.myRoutes.delete('/', qualificationController.deleteQualification);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Qualification;