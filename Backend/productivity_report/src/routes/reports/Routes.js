const router = require('express').Router();

const Productivity = require('./productivity/Productivity.controller');
const insertFunctions = require('./productivity/insert.function');
// const PrductivityReport = require('./productivtyReport/Productivity.controller');
// const ProductivityOld = require('./productivity/Productivity.controller_old');

class ReportsRoute {
    constructor() {
        this.myRoutes = router;
        this.openRoutes = router;
        this.core();
    }

    core() {

        //Productivity
        this.myRoutes.get('/productivity', Productivity.getProductivity);
        this.myRoutes.get('/productivity-list', Productivity.getProductivityList);
        this.openRoutes.post('/activity', insertFunctions.insertActivity);
        // this.openRoutes.post('/activity', PrductivityReport.insertActivity);
        // this.myRoutes.get('/productivity', ProductivityOld.getProductivity);
        // this.myRoutes.get('/productivity-list', ProductivityOld.getProductivityList);

    }

    getRouters() {
        return this.myRoutes;
    }
    getOpenRoutes() {
        return this.openRoutes;
    }
}

module.exports = new ReportsRoute;

require('./productivity/insert.function');