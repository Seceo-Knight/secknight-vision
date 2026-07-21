/** Announcements Routes */

// Imports 
const router = require("express").Router();
const AnnouncementsController = require("./announcement.controller");


/**
 * @class AnnouncementsRoutes
 * All Announcements routes 
 */
class AnnouncementsRoutes {

    constructor() {

        // router 
        this.router = router;

        // Initialize Routes
        this.core();
    }

    // Initialize Routes
    core() {

        // Announcements Routes 
        this.router.get("/events", new AnnouncementsController().getEvents);
        this.router.get("/", new AnnouncementsController().getAnnouncements);
        this.router.post("/", new AnnouncementsController().createAnnouncements);
        this.router.put("/", new AnnouncementsController().updateAnnouncements);
        this.router.delete("/", new AnnouncementsController().deleteAnnouncements);
    }

    // Get Announcements Router
    getRouters() {
        return this.router;
    }
}


/** Exports */
module.exports = AnnouncementsRoutes;