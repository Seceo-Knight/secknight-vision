const { GroupService } = require('./groups.service');

class GroupController {
    static async createGroup(req, res, next) {
        return await GroupService.createGroupNew(req, res, next);
    }

    static async listGroups(req, res, next) {
        return await GroupService.listGroups(req, res, next);
    }

    static async deleteGroup(req, res, next) {
        return await GroupService.deleteGroup(req, res, next);
    }

    static async editGroup(req, res, next) {
        return await GroupService.editGroup(req, res, next);
    }

    static async groupSetting(req, res, next) {
        return await GroupService.updateGroupCustomSetting(req, res, next);
    }
}

module.exports.GroupController = GroupController;