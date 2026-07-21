const experienceController = require('./experience.controller');

const router = require('express').Router();

class Experience {
    constructor() {
        this.myRoutes = router;
        this.core();    
    }

    core() {
        this.myRoutes.get('/', experienceController.getExperience);
        this.myRoutes.post('/', experienceController.postExperience);
        this.myRoutes.put('/', experienceController.putExperience);
        this.myRoutes.delete('/', experienceController.deleteExperience);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Experience;