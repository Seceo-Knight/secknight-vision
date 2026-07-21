
const adminModel = require('./admin.model');
const sendResponse = require('../../../utils/myService').sendResponse;
class AdminController {
    async getRoles(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        try {
            const roles = await adminModel.getRoles(admin_id);
            if (roles.length === 0) return sendResponse(res, 404, null, 'Roles not found', null);
            return sendResponse(res, 200, roles, 'Role data', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Error while getting roles', err);
        }

    }
}

module.exports = new AdminController;
