const { AnnouncementModel } = require('./announcement.model');
const { AnnouncementValidation } = require('./announcement.validation');
const { getAsync, setAsync } = require('../../../utils/redis/redis.utils');

class AnnouncementService {
    static async updateAnnouncement(req, res, next) {
        try {
            const { organization_id: organizationId, user_id: userId } = req.decoded;
            const { ids } = await AnnouncementValidation.updateAnnouncement().validateAsync(req.body);

            const announcementData = await AnnouncementModel.getAnnouncement({ organizationId, userId, ids });
            if (!announcementData.length) {
                return res.json({ code: 200, data: null, error: null, message: 'Updated.' });
            }

            for (const announcement of announcementData) {
                const a = announcement.delevered_users.find(a => a.user_id == userId);
                if (a) continue;
                announcement.delevered_users.push({ user_id: userId, delivered_at: new Date() });
                await AnnouncementModel.updateAnnouncement({ _id: announcement._id, delevered_users: announcement.delevered_users });
            }

            let tempData = await getAsync(userId);
            tempData = JSON.parse(tempData);
            if (tempData.setting.system.visibility) {
                const announcements = await AnnouncementModel.getAnnouncement({ organizationId, userId });
                tempData.setting.announcemnts = announcements.map(a => {
                    delete a.delevered_users;
                    return a;
                });
                await setAsync(userId, JSON.stringify(tempData));
            }

            return res.json({ code: 200, data: null, error: null, message: 'Updated.' });
        } catch (err) {
            next(err);
        }
    }
}

module.exports.AnnouncementService = AnnouncementService;