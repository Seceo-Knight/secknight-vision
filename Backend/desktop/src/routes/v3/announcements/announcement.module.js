'use strict';

const router = require('express').Router();
const { AnnouncementController } = require('./announcement.controller');

class AnnouncementModule {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.put('/update-announcement', AnnouncementController.updateAnnouncement);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AnnouncementModule;