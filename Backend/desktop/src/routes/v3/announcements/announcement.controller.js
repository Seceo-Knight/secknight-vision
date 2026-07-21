const { AnnouncementService } = require('./announcement.service');

class AnnouncementController {

    static async updateAnnouncement(req, res, next) {
        return await AnnouncementService.updateAnnouncement(req, res, next);
    }
}

module.exports.AnnouncementController = AnnouncementController;

