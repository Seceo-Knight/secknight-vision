const UserValidation = require('../../rules/validation/User');
const User = require('../shared/User');
const sendResponse = require('../../utils/myService').sendResponse;

class TeamLeadService {

    async assignEmployeeTeamLead(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_ids = req.body.user_ids;
        let teamlead_id = req.body.teamlead_id;
        let already_assigned = [];
        let assigned_users = [];
        try {
            let validate = UserValidation.TeamLeadValidation({
                user_ids,
                teamlead_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            for (const user_id of user_ids) {
                let assigned = await User.checkAssignedUserToTeamLead(user_id, teamlead_id, admin_id);
                if (assigned.length === 0) {
                    let assign_users = await User.assignMultiUserToTeamLead(user_id, teamlead_id, admin_id);
                    let user_details = await User.getUserDetails(user_id, admin_id);
                    assigned_users.push({
                        user_id: user_details[0].id,
                        status: user_details[0].status,
                        first_name: user_details[0].name,
                        last_name: user_details[0].full_name
                    });
                } else {
                    already_assigned.push(assigned[0]);
                }
            }
            return sendResponse(res, 200, {
                assigned_users,
                already_assigned
            }, 'Employee assigned successfully.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable to assign');
        }
    }

    async unassignUserToTeamLead(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let user_ids = req.body.user_ids;
        let teamlead_id = req.body.teamlead_id;

        try {
            let validate = UserValidation.validateUnassignToTeamLead({
                user_ids,
                teamlead_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let data = await User.unassignUserToTeamLead(admin_id, user_ids, teamlead_id)
            if (data.affectedRows > 0) {
                return sendResponse(res, 200, req.body, 'Unassigned Successfully !', null);
            } else {
                return sendResponse(res, 400, null, 'Invalid Input !', null);
            }
        } catch (err) {
            if (err) return sendResponse(res, 400, null, 'Unable To Unassign.', err);
        }
    }
}

module.exports = new TeamLeadService;