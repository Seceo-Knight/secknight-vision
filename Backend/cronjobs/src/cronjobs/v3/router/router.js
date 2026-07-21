const router = require('express').Router();

const cronsController = require("../cronjobs");

class Router {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Adding all the routes here
        this.myRoutes.get('/enableFailedRestore', cronsController.enableFailedCrons);
        this.myRoutes.get('/disableFailedRestore', cronsController.disableFailedCrons);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Router;