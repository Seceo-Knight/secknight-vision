const Experience = require('./experience/experience.routes');
const Family = require('./family/family.routes');
const Qualification = require('./qualification/qualification.routes');
const RequestDetails = require('./requestDetails/requestDetails.routes');

const router = require('express').Router();

class EmployeeInfo {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.use('/experience', new Experience().getRouters());
        this.myRoutes.use('/qualification', new Qualification().getRouters());
        this.myRoutes.use('/family', new Family().getRouters());
        this.myRoutes.use('/requestDetails', new RequestDetails().getRouters());
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = EmployeeInfo;