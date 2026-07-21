"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);
const _ = require('underscore');

const sendResponse = require('../../../utils/myService').sendResponse;
const JoiValidation = require('../../../rules/validation/Team');
const TeamCURD = require('../../shared/TeamCURD');
const Logger = require('../../../Logger').logger;
const async = require('async');

class TeamService {



    async createTeam(req, res) {
        // let organization_id = req.body.organization_id;
        let name = req.body.name;
        let description = req.body.description || null;
        let status = req.body.status || 1;   // 1-for active
        let manager_id = req['decoded'].jsonData.is_manager ? req['decoded'].jsonData.id : null;
        let admin_id = req['decoded'].jsonData.admin_id;
        const user_ids = req.body.user_ids || [];
        const team_lead_ids = req.body.team_lead_ids || [];
        // let role_id = req.body.role_id;

        try {
            let validate = JoiValidation.createTeam(name, description, status, user_ids, team_lead_ids);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let get_team = await TeamCURD.getTeamByName(name, admin_id)
            if (get_team.length > 0) return sendResponse(res, 400, null, 'This Team Name Already Exists.', null);

            let team_data = await TeamCURD.createTeam(name, description, status, admin_id, manager_id)
            if (!team_data) return sendResponse(res, 400, null, 'Unable To Create Team .', null);
            let user_id_list = [];

            if (user_ids.length || user_ids.length) {
                if (user_ids.length) {
                    user_id_list = user_ids.map(id => [id, team_data.insertId, manager_id, admin_id, 1])
                }
                if (team_lead_ids.length) {
                    let team_lead_list = team_lead_ids.map(id => [id, team_data.insertId, manager_id, admin_id, 2])
                    user_id_list = user_id_list.concat(team_lead_list);
                }
                let add_users = await TeamCURD.addUsersTeam(user_id_list)
                if (!add_users) return sendResponse(res, 400, null, 'Unable To Add Users To Team', null);
            }
            const response_data = await getTeamWithMembers(team_data.insertId, admin_id, 1, false, true)
            return sendResponse(res, 200, response_data, 'Team Created Successfully.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Create Team .', null);
        }


    }

    async getTeam(req, res) {

        let manager_id = req['decoded'].jsonData.is_manager ? req['decoded'].jsonData.id : null;
        let is_manager = req['decoded'].jsonData.is_manager
        let admin_id = req['decoded'].jsonData.admin_id;
        let team_id = req.body.team_id || null;
        let is_team_id = req.body.team_id ? true : false;
        let validate = JoiValidation.getTeam(team_id);
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
        let result = []
        let team_with_user = []

        try {
            let team_data = await TeamCURD.getTeams(team_id, is_team_id, admin_id, is_manager, manager_id);
            if (team_data.length <= 0) return sendResponse(res, 400, null, 'No Teams Found.', null);

            let team_users = await TeamCURD.getTeamUser(team_id, admin_id, manager_id, is_manager, is_team_id);
            team_data.forEach(team => {

                let team__members = team_users.filter(getMember)
                function getMember(team_array) {
                    return team_array.team_id == team.id;
                }
                team.members = team__members;

                team_with_user.push(team)

            });
            return sendResponse(res, 200, team_with_user, 'Team Data.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Get Teams.', null);
        }

    }

    async updateTeam(req, res) {
        let team_id = req.body.team_id;
        let admin_id = req['decoded'].jsonData.admin_id;
        try {
            let validate = JoiValidation.idValidation(team_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let team_data = await TeamCURD.checkTeam(team_id, admin_id);
            if (team_data.length <= 0) return sendResponse(res, 400, null, 'No Teams Found.', null);

            let name = req.body.name || team_data[0].name;
            let description = req.body.description || team_data[0].description;
            let status = req.body.status || team_data[0].description;
            let manager_id = req.body.manager_id || team_data[0].manager_id;

            if (req.body.name) {
                let check_update_name = await TeamCURD.cheakUpdateName(name, team_id, admin_id);
                if (check_update_name.length > 0) sendResponse(res, 400, null, 'Team Name Already Exists.', null);
            }

            let update_team = await TeamCURD.updateTeam(name, description, status, manager_id, admin_id, team_id)
            if (!update_team) return sendResponse(res, 400, null, 'Unable Update Team.', null);

            const response_data = await getTeamWithMembers(team_id, admin_id, 1, false, true)
            return sendResponse(res, 200, response_data, 'Updated Successfully.', null);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable Update Team.', null);
        }

    }

    async deleteTeam(req, res) {
        let team_id = req.body.team_id;
        let admin_id = req['decoded'].jsonData.admin_id;

        try {
            let validate = JoiValidation.idValidation(team_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let delete_team = await TeamCURD.deleteTeam(team_id, admin_id);
            if (!delete_team) {
                return sendResponse(res, 400, null, 'Unable Delete Team.', null);
            } else if (delete_team.affectedRows > 0) {
                return sendResponse(res, 200, req.body, 'Team Deleted Successfully.', null);
            }
            return sendResponse(res, 400, null, 'Unable Delete Team.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable Delete Team.', null);
        }

    }

    async addUsersToTeam(req, res) {
        let team_id = req.body.team_id;
        let user_ids = req.body.user_ids;
        let role_id = req.body.role_id;
        let admin_id = req['decoded'].jsonData.admin_id;
        let manager_id = req['decoded'].jsonData.is_manager ? req['decoded'].jsonData.id : null;

        try {
            let validate = JoiValidation.addUsersToTeam(team_id, user_ids, role_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let check_users_team = await TeamCURD.checkUsesTeam(team_id, user_ids);
            if (check_users_team.length > 0) return sendResponse(res, 401, check_users_team, 'Selected User Already Exists In This Team.', null);

            let user_id_list = user_ids.map(id => [id, team_id, manager_id, admin_id, role_id])
            let add_users = await TeamCURD.addUsersTeam(user_id_list)
            if (!add_users) return sendResponse(res, 400, null, 'Unable To Add Users To Team', null);
            const response_data = await getTeamWithMembers(team_id, admin_id, 1, false, true, 1, false)
            return sendResponse(res, 200, response_data, 'Successfully Added Users To Team.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Add Users To Team', null);
        }
    }

    async getUsersFromTeam(req, res) {
        let organization_id = req.body.organization_id || null;
        let is_organization = req.body.organization_id ? true : false;
        let team_id = req.body.team_id || 0;
        let admin_id = req['decoded'].jsonData.admin_id;
        let manager_id = req['decoded'].jsonData.is_manager ? req['decoded'].jsonData.id : null;
        let is_team_id = req.body.team_id ? true : false;
        let is_manager = manager_id ? true : false;
        // manager_id = 0;

        try {
            let validate = JoiValidation.getTeam(team_id, organization_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const response_data = await getTeamWithMembers(team_id, admin_id, manager_id, is_manager, is_team_id, organization_id, is_organization)
            if (response_data.length == 0) return sendResponse(res, 400, null, ' Teams Not Found.', null);
            return sendResponse(res, 200, response_data, ' Teams Data ', null);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Get Team Members', null);
        }
    }

    async deleteUsesFromTeam(req, res) {
        let team_id = req.body.team_id;
        let user_ids = req.body.user_ids;

        try {
            let validate = JoiValidation.DeleteTemUsers(team_id, user_ids);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let delete_team = await TeamCURD.deleteUsesFromTeam(team_id, user_ids);
            if (!delete_team) {
                return sendResponse(res, 400, null, 'Unable To Delete Users From Team.', null);
            }
            else if (delete_team.affectedRows > 0) {
                return sendResponse(res, 200, req.body, 'Users deleted Successfully', null);
            }
            return sendResponse(res, 400, null, 'Unable To Delete Users From Team.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Delete Users From Team.', null);
        }
    }

    async updateUsersTeam(req, res) {
        let team_id = req.body.team_id;
        let user_id = req.body.user_id;
        let admin_id = req['decoded'].jsonData.admin_id;

        try {

            let validate = JoiValidation.updateUsersTeam(team_id, user_id, req.body.reason, req.body.status, req.body.role_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let get_user = await TeamCURD.getSingleUser(user_id, team_id, admin_id);
            if (get_user.length <= 0) return sendResponse(res, 400, null, 'User Does not Exist.', null);

            let reason = req.body.reason || get_user[0].reason;
            let status = req.body.status || get_user[0].status;
            let role_id = req.body.role_id || get_user[0].role;
            let update_user = await TeamCURD.updateUsersTeam(team_id, user_id, reason, status, admin_id, role_id);
            if (!update_user) {
                return sendResponse(res, 400, null, 'Unable To Update User.', null);
            } else if (update_user.affectedRows > 0) {
                const response_data = await getTeamData(team_id, admin_id);
                return sendResponse(res, 200, response_data, 'Updated Successfully. ', null);
            }
            return sendResponse(res, 400, null, 'Unable To Update User.', null);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, ' Unable To Update User. ', null);
        }

    }

    async addTeamToProject(req, res) {
        let team_id = req.body.team_ids;
        let project_id = req.body.project_id;
        let admin_id = req['decoded'].jsonData.admin_id;
        let manager_id = req['decoded'].jsonData.is_manager ? req['decoded'].jsonData.id : null;

        try {

            let validate = JoiValidation.addTeamToProject(team_id, project_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let check_team_to_project = await TeamCURD.checkTeamToProject(team_id, project_id, admin_id);
            if (check_team_to_project.length > 0) return sendResponse(res, 400, null, 'These Teams Already Added in This Project', null);

            let check_project = await TeamCURD.checkProject(project_id, admin_id);
            if (check_project.length <= 0) return sendResponse(res, 400, null, 'Project Not Found. ', null);

            let team_data = await TeamCURD.checkTeam(team_id, admin_id);
            if (team_data.length <= 0) return sendResponse(res, 400, null, 'No Teams Found.', null);

            let team_id_list = team_id.map(id => [id, project_id, manager_id, admin_id])
            let add_team_to_project = await TeamCURD.addTeamToProject(team_id_list);
            if (!add_team_to_project) {
                return sendResponse(res, 400, add_team_to_project, 'Unable Add Teams To Projects ', null);

            } else if (add_team_to_project.affectedRows > 0) {
                return sendResponse(res, 200, req.body, 'Successfully Added Teams To Projects ', null);
            }
            return sendResponse(res, 400, add_team_to_project, 'Unable Add Teams To Projects ', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable Add Teams To Projects ', null);
        }

    }

    async getTeamsFromProject(req, res) {
        let project_id = req.body.project_id || 0;
        let admin_id = req['decoded'].jsonData.admin_id;
        let manager_id = req['decoded'].jsonData.id ? req['decoded'].jsonData.id : null;
        let is_manager = req['decoded'].jsonData.is_manager;
        let is_project = req.body.project_id ? true : false;

        try {
            let validate = JoiValidation.getTeamsFromProject(project_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            let teams = await getProjectTeams(project_id, is_project, admin_id, manager_id, is_manager)
            if (teams.length <= 0) return sendResponse(res, 400, null, 'No Project Teams Found.', null);

            return sendResponse(res, 200, teams, 'Project Teams.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Get Project Teams.', null);
        }

    }

    async deleteTeamsFromProject(req, res) {
        let team_ids = req.body.team_ids;
        let project_id = req.body.project_id;
        let admin_id = req['decoded'].jsonData.admin_id;

        try {
            let validate = JoiValidation.addTeamToProject(team_ids, project_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let check_team_to_project = await TeamCURD.checkTeamToProject(team_ids, project_id, admin_id);
            if (check_team_to_project.length <= 0) return sendResponse(res, 400, null, 'Teams Not Found.', null);

            let delete_team = await TeamCURD.deleteTeamsFromProject(team_ids, project_id, admin_id);
            if (!delete_team) {
                return sendResponse(res, 400, null, 'Unable To Delete Teams From Project', null);
            } else if (delete_team.affectedRows > 0) {
                return sendResponse(res, 200, req.body, 'Teams Deleted Successfully From Project', null);
            }
            return sendResponse(res, 400, null, 'Unable To Delete Teams From Project', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Delete Teams From Project', null);
        }


    }

    async getProjectMembers(req, res) {
        const project_id = req.params.project_id;
        let admin_id = req['decoded'].jsonData.admin_id;
        let members = [];
        try {

            const validate = JoiValidation.idValidation(project_id)
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const get_team_members = await TeamCURD.teamMembers(project_id, admin_id);
            let user_ids = [0];
            if (get_team_members.length) {
                members.push(get_team_members);
                user_ids = get_team_members.map(user => [user.user_id]);
            }
            const project_members = await TeamCURD.projectMembers(project_id, admin_id, user_ids);
            if (members.length) {

                members.includes(project_members);
            } else {
                members.push(project_members);

            }
            if (members.length > 0) {
                return sendResponse(res, 200, members, 'Project Members', null);
            }

            return sendResponse(res, 400, null, 'No Project Members Found.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable Get Project Members', null);
        }

    }


}
module.exports = new TeamService;


async function getTeamData(team_id, admin_id) {
    try {
        let team_data = await TeamCURD.getTeamUser(team_id, admin_id, 0, false, true, 0, false);
        var result = []
        _.map(_.groupBy(team_data, elem => elem.team_name),
            (vals, key) => {
                result.push({ team_name: key, members: vals });
            })
        return result;
    } catch (err) {
        return null;
    }

}

async function getTeamWithMembers(team_id, admin_id, manager_id, is_manager, is_team_id) {

    try {
        let result = []
        let team_with_user = []
        let team_data = await TeamCURD.getTeams(team_id, is_team_id, admin_id, is_manager, manager_id);

        if (team_data.length) {
            let team_users = await TeamCURD.getTeamUser(team_id, admin_id, manager_id, is_manager, is_team_id);
            team_data.forEach(team => {
                let team__members = team_users.filter(getMember)
                function getMember(team_array) {
                    return team_array.team_id == team.id;
                }
                team.members = team__members;
                team_with_user.push(team)
            });
            return team_with_user;
        }
    } catch (err) {
        return null
    }


}


async function getProjectTeams(project_id, is_project, admin_id, manager_id, is_manager) {
    let team = [];

    let project_team_data = await TeamCURD.getProjectTeams(project_id, is_project, admin_id, manager_id, is_manager);
    if (project_team_data) {
        let team_ids = [];
        project_team_data.forEach(function (item) {
            if (team_ids.indexOf(item.team_id) < 0) {
                team_ids.push(item.team_id);
            }
        });

        async.forEachSeries(team_ids, (element1, callback) => {

            function checkAdult(data) {
                return data.team_id == element1
            }

            let single_team = project_team_data.filter(checkAdult);
            let members = [];

            async.forEachSeries(single_team, (element2, callback) => {
                members.push(element2)
                callback();
            });
            team.push({ id: members[0].team_id, name: members[0].team_name, status: members[0].status, description: members[0].description, created_at: members[0].created_at, members: members })
            callback();
        });


        return team;
    }
    return [];
}


