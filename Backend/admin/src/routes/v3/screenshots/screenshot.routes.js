'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const router = require('express').Router();
const ScreenshotController = require('./screenshot.controller');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/get-screenshots-new', ScreenshotController.getScreenshootParallel_new);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;