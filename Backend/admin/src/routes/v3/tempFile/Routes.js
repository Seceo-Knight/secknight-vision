'use strict';

const router = require('express').Router();
const tempFileController = require('./tempFile.controller');

class TempFileRoutes {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/', tempFileController.tempFileAction);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = TempFileRoutes;