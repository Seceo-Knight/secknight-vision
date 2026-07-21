const { AnnouncemntsModel } = require('../../../models/announcements.schema');

class AnnouncementModel {
    static getAnnouncement({ organizationId, userId, ids = [] }) {
        let match = {
            organization_id: organizationId,
            $or: [{ employees: { "$in": [userId] } }, { type: 1 }],
            'delevered_users.user_id': { "$ne": userId }
        };
        if (ids.length) {
            match = { ...match, "_id": { "$in": ids } };
        }
        return AnnouncemntsModel
            .find({
                "organization_id": organizationId,
                "$or": [{ employees: { "$in": [userId] } }, { type: 1 }],
                'delevered_users.user_id': { "$ne": userId }
            }, {
                _id: 1, description: 1, title: 1, createdAt: 1, delevered_users: 1
            })
            .lean()
            .sort({ _id: -1 })
            .limit(200);
    }

    static updateAnnouncement({ _id, delevered_users }) {
        return AnnouncemntsModel.updateOne(
            { _id: _id },
            { delevered_users: delevered_users });
    }
}

module.exports.AnnouncementModel = AnnouncementModel;