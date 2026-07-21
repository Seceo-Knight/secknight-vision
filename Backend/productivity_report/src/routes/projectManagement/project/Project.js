
const moment = require('moment');
const _ = require('underscore');

const ProjectCURD = require('../../shared/ProjectCURD');
const sendResponse = require('../../../utils/myService').sendResponse;
const JoiValidation = require('../../../rules/validation/Project');
const TeamCURD = require('../../shared/TeamCURD');
const Logger = require('../../../Logger').logger;


class Project {


    async getAllProject(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        if (req['decoded'].jsonData.is_manager == true) {
            let manager_id = req['decoded'].jsonData.id;
            let project_data = await ProjectCURD.getAllProjectsManager(admin_id, manager_id)
            if (!project_data) return sendResponse(res, 400, null, 'No Projects Found. ', null);
            return sendResponse(res, 200, null, 'Project Data. ', null);
        }
        let project_data = await ProjectCURD.getAllProjects(admin_id)
        if (project_data.length <= 0) return sendResponse(res, 400, null, 'No Projects Found. ', null);
        return sendResponse(res, 200, project_data, 'Project Data. ', null);
    }

    async getSingleProject(req, res) {
        try {

            let validate = JoiValidation.getAllOrganization(req.body.project_ids);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            let project_id = req.body.project_id ? req.body.project_id : 0;
            let is_project_id = req.body.project_id ? true : false;
            let admin_id = req['decoded'].jsonData.admin_id;
            const status = req.body.status || null;
            const is_status = req.body.status ? true : false;

            let project_data = await ProjectCURD.getSingleProjects(admin_id, project_id, is_project_id, status, is_status)
            if (project_data.length <= 0) return sendResponse(res, 400, null, 'No Projects Found. ', null);

            var result = [];
            let project_teams = [];
            await Promise.all([
                ProjectCURD.getProjctTeams(is_project_id, project_id, admin_id),
                ProjectCURD.getProjctMembers(is_project_id, project_id, admin_id)
            ]).then((team_and_members) => {

                project_data.forEach(project => {
                    let team = team_and_members[0].filter(findTeam)
                    function findTeam(team_array) {
                        return team_array.project_id == project.project_id;
                    }
                    let members = team_and_members[1].filter(findMember)
                    function findMember(member_array) {
                        return member_array.project_id == project.project_id;
                    }
                    project.members = members;
                    project.teams = team;
                    project_teams.push(project)
                });

            })

            return sendResponse(res, 200, project_teams, 'Project Data. ', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Fetch Projects. ', null);
        }


    }

    async updateProject(req, res) {
        let project_id = req.body.project_id
        let admin_id = req['decoded'].jsonData.admin_id;

        try {

            let validate = JoiValidation.updateProject(req.body.project_id, req.body.name, req.body.description, req.body.start_date, req.body.end_date, req.body.status, req.body.progress);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let project_data = await ProjectCURD.getAllProjectsProjectId(admin_id, project_id)
            if (project_data.length == 0) return sendResponse(res, 400, null, 'No Projects Found. ', null);
            let name = req.body.name ? req.body.name : project_data[0].name
            let description = req.body.description || project_data[0].description;
            let manager_id = req.body.manager_id ? req.body.manager_id : project_data[0].manager_id ? project_data[0].manager_id : null;
            let start_date = req.body.start_date ? moment(req.body.start_date).format('YYYY-MM-DD') : moment(project_data[0].start_date).format('YYYY-MM-DD');
            let end_date = req.body.end_date ? moment(req.body.end_date).format('YYYY-MM-DD') : moment(project_data[0].end_date).format('YYYY-MM-DD');
            let status = req.body.status ? req.body.status : project_data[0].status;
            let progress = req.body.progress ? req.body.progress : project_data[0].progress;
            if (req.body.start_date && req.body.end_date) {
                let date = moment().format("YYYY-MM-DD");
                if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !moment(start_date).isSameOrBefore(end_date)) {
                    return sendResponse(res, 400, null, 'Please Select Valid  Start Date And End Date', null);
                }
            }
            if (progress < project_data[0].progress || progress >= 100) return sendResponse(res, 400, req.body, 'Progress Should Be Greater Than Previous Progress And Less Than Or Equal To 100%.', null);

            if (req.body.name) {
                let check_name = await ProjectCURD.checkProjectName(req.body.name, admin_id, project_id);
                if (check_name.length > 0) return sendResponse(res, 400, null, 'Project Name Is Already Exists. ', null);
            }

            let update_project = await ProjectCURD.updateProject(project_id, name, description, manager_id, start_date, end_date, status, progress, admin_id);
            if (!update_project) {
                return sendResponse(res, 400, null, 'Unable To Update', null);
            }
            else if (update_project.affectedRows > 0) {

                let get_project_details = await getProjectData(admin_id, project_id, true)
                return sendResponse(res, 200, get_project_details, 'Project Successfully Created.', null);
            }
            return sendResponse(res, 400, null, 'Unable To Update', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Update The Project. ', null);
        }

    }

    async deleteProject(req, res) {
        let project_id = req.body.project_id
        let admin_id = req['decoded'].jsonData.admin_id;

        try {

            let validate = JoiValidation.idValidation(project_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let project_data = await ProjectCURD.getAllProjectsProjectId(admin_id, project_id)
            if (!project_data.length) return sendResponse(res, 400, null, 'No Projects Found. ', null);

            let delete_project = await ProjectCURD.deleteProject(admin_id, project_id);
            if (!delete_project) return sendResponse(res, 400, null, 'Unable To Delete Project.', null);
            return sendResponse(res, 200, req.body, 'Project Deleted Successfully.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Delete Project.', null);
        }

    }


    async createProjectModule(req, res) {
        let date = moment().format("YYYY-MM-DD");
        let project_id = req.body.project_id;
        let start_date = moment(req.body.start_date).format('YYYY-MM-DD');
        let end_date = moment(req.body.end_date).format('YYYY-MM-DD');
        let name = req.body.name;
        let admin_id = req['decoded'].jsonData.admin_id;

        try {
            let validate = JoiValidation.createProjectModule(project_id, name, start_date, end_date);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let project_data = await ProjectCURD.getAllProjectsProjectId(admin_id, project_id);
            if (project_data.length == 0) return sendResponse(res, 400, null, 'No Projects Found. ', null);
            if (start_date && end_date) {
                let project_start_date = moment(project_data[0].start_date).format('YYYY-MM-DD');
                let project_end_date = moment(project_data[0].end_date).format('YYYY-MM-DD');

                let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
                let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
                let is_before = moment(start_date).isSameOrBefore(end_date);

                if (!is_start_date || !is_end_date) {
                    return sendResponse(res, 400, null, 'Project Module Start Date and End Date With In The Project Duration.', null);
                }
                else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                    return sendResponse(res, 400, null, 'Please Select Valid  Start Date And End Date', null);
                }
            }

            let check_module = await ProjectCURD.checkModule(name, project_id);
            if (check_module.length > 0) return sendResponse(res, 400, null, 'This Module Is Already Exists In This Project. ', null);

            let add_module = await ProjectCURD.createProjectModule(project_id, name, start_date, end_date);
            if (!add_module) return sendResponse(res, 400, null, 'Unable To Create Project Module.', null);



            let get_module_details = await ProjectCURD.getSingleModule(add_module.insertId, admin_id);
            var result = []
            _.map(_.groupBy(get_module_details, elem => elem.project_name),
                (vals, key) => {
                    result.push({ project_name: key, modules: vals });
                })
            return sendResponse(res, 200, result, 'Successfully Created Project Module.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Create Project Module.', null);
        }


    }

    async getProjectModule(req, res) {
        let project_id = req.body.project_id ? req.body.project_id : 0;
        let module_id = req.body.module_id ? req.body.module_id : 0;
        let admin_id = req['decoded'].jsonData.admin_id;
        let is_project = req.body.project_id ? true : false;
        let is_module = req.body.module_id ? true : false;
        let manager_id = req['decoded'].jsonData.is_manager ? manager_id = req['decoded'].jsonData.id : 0;
        let is_manager = req['decoded'].jsonData.is_manager;
        const status = req.body.status || null;
        const is_status = req.body.status ? true : false;


        try {
            let validate = JoiValidation.getProjectModule(req.body.project_id, req.body.module_id, status);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            let get_project_modules = await ProjectCURD.getProjectModule(module_id, is_module, project_id, is_project, is_manager, manager_id, admin_id, status, is_status);

            if (get_project_modules.length <= 0) return sendResponse(res, 400, null, 'No Project Modules Found.', null);
            var result = []
            _.map(_.groupBy(get_project_modules, elem => elem.project_name),
                (vals, key) => {
                    result.push({ project_name: key, modules: vals });
                })
            return sendResponse(res, 200, result, 'Project Modules Data.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Fetch Project Module.', null);
        }

    }

    async updateModule(req, res) {
        let module_id = req.body.module_id;
        let admin_id = req['decoded'].jsonData.admin_id;
        let date = moment().format("YYYY-MM-DD");

        try {
            let validate = JoiValidation.UpdateProjectModule(module_id, req.body.name, req.body.status, req.body.start_date, req.body.end_date);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let get_module = await ProjectCURD.getSingleModule(module_id, admin_id)
            if (get_module.length <= 0) return sendResponse(res, 400, null, 'No Project Modules Found.', null);
            let name = req.body.name ? req.body.name : get_module[0].name;
            let status = req.body.status ? req.body.status : get_module[0].status;
            let start_date = req.body.start_date ? moment(req.body.start_date).format('YYYY-MM-DD') :
                moment(get_module[0].start_date).format('YYYY-MM-DD');
            let end_date = req.body.end_date ? moment(req.body.end_date).format('YYYY-MM-DD') :
                moment(get_module[0].end_date).format('YYYY-MM-DD');
            if (req.body.name) {
                let check_module_name = await ProjectCURD.checkModuleName(module_id, req.body.name, get_module[0].project_id);
                if (check_module_name.length > 0) return sendResponse(res, 400, null, 'Project Modules Already Exists.', null);
            }
            if (req.body.start_date || req.body.end_date) {
                let project_start_date = moment(get_module[0].project_start_date).format('YYYY-MM-DD');
                let project_end_date = moment(get_module[0].project_end_date).format('YYYY-MM-DD');

                let is_start_date = moment(start_date).isBetween(project_start_date, project_end_date, null, '[]');
                let is_end_date = moment(end_date).isBetween(project_start_date, project_end_date, null, '[]');
                let is_before = moment(start_date).isSameOrBefore(end_date);

                if (!is_start_date || !is_end_date) {
                    return sendResponse(res, 400, null, 'Project Module Start Date and End Date With In The Project Duration.', null);
                }
                else if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !is_before) {
                    return sendResponse(res, 400, null, 'Please Select Valid  Start Date And End Date', null);
                }

            }
            let update_module = await ProjectCURD.updateProjectModule(module_id, name, status, start_date, end_date);
            if (!update_module) return sendResponse(res, 400, null, 'Unable TO Update Project Modules.', null);
            let get_module_details = await ProjectCURD.getSingleModule(module_id, admin_id);
            var result = []
            _.map(_.groupBy(get_module_details, elem => elem.project_name),
                (vals, key) => {
                    result.push({ project_name: key, modules: vals });
                })
            return sendResponse(res, 200, result, ' Updated Successfully.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable TO Update Project Modules.', null);
        }


    }

    async deleteProjectModule(req, res) {
        let module_ids = req.body.module_ids;

        try {
            let validate = JoiValidation.deleteProjectModule(module_ids);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let delete_project_module = await ProjectCURD.deleteProjectModule(module_ids);
            if (!delete_project_module) {
                return sendResponse(res, 400, null, 'Unable TO Delete Project Modules.', null);
            }
            else if (delete_project_module.affectedRows > 0) {

                return sendResponse(res, 200, req.body, 'Project Modules Deleted Successfully.', null);
            }
            return sendResponse(res, 400, null, 'Unable TO Delete Project Modules.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable TO Delete Project Modules.', null);
        }

    }

    async createProjectWithTeam(req, res) {
        let date = moment().format("YYYY-MM-DD");
        let manager_id = req.body.manager_id || [];
        let role_id = req.body.role_id || 0;
        let members_role_id = req.body.members_role_id || 1
        let name = req.body.name;
        let description = req.body.description || null;
        let admin_id = req['decoded'].jsonData.admin_id;
        let start_date = moment(req.body.start_date).format('YYYY-MM-DD');
        let end_date = moment(req.body.end_date).format('YYYY-MM-DD');
        const team_id = req.body.team_ids;
        const members_id = req.body.members_ids;
        let teamData;
        let members_data;
        try {

            const validate = JoiValidation.createProjectWithTeam(name, description, start_date, end_date, manager_id, team_id, members_id, role_id, members_role_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            if (!moment(date).isSameOrBefore(start_date) || !moment(date).isSameOrBefore(end_date) || !moment(start_date).isSameOrBefore(end_date)) {
                return sendResponse(res, 400, null, 'Please Select Valid  Start Date And End Date', null);
            }

            let get_project = await ProjectCURD.getProjectByName(name, admin_id)
            if (get_project.length > 0) return sendResponse(res, 400, null, 'Project Is Already Exists With Same Name', null);

            let projet = await ProjectCURD.createProject(name, description, admin_id, start_date, end_date)
            if (!projet) return sendResponse(res, 400, null, 'Faled To Create Project', null);

            let { team_ids, members_ids, ...project_details } = req.body;
            delete project_details.name;
            project_details.project_name = req.body.name
            project_details.project_id = projet.insertId;
            project_details.status = 1;
            project_details.progress = 0;

            if (role_id && manager_id.length > 0) {
                let manager_list = manager_id.map(id => [admin_id, id, projet.insertId, role_id])
                const add_manager = await ProjectCURD.addManagerToProject(manager_list);
                if (!add_manager) return sendResponse(res, 400, null, 'Unable To Add Managers', null);
            }


            if (team_id && !members_id) {
                let team_data = await TeamCURD.checkTeam(team_id, admin_id);
                if (team_data.length <= 0) return sendResponse(res, 400, null, 'Teams Not Found.', null);
                teamData = await TeamCURD.getTeamByIds(team_id);

                let team_id_list = team_id.map(id => [id, projet.insertId, null, admin_id])
                let add_team_to_project = await TeamCURD.addTeamToProject(team_id_list);

                if (!add_team_to_project) return sendResponse(res, 400, null, 'Unable Add Teams To Projects ', null);
                project_details.teams_data = teamData;
            }
            else if (!team_id && members_id) {
                let members_list = members_id.map(id => [admin_id, id, projet.insertId, members_role_id]);
                const add_members = await ProjectCURD.addManagerToProject(members_list);
                if (!add_members) return sendResponse(res, 400, null, 'Unable TO Add Members TO Team', null);
                members_data = await ProjectCURD.getMembersToProject(members_id);
                project_details.members_data = members_data;
            }
            else if (team_id && members_id) {
                let team_data = await TeamCURD.checkTeam(team_id, admin_id);
                if (team_data.length <= 0) return sendResponse(res, 400, null, 'No Teams Found.', null);
                teamData = await TeamCURD.getTeamByIds(team_id);

                let team_id_list = team_id.map(id => [id, projet.insertId, null, admin_id])
                let add_team_to_project = await TeamCURD.addTeamToProject(team_id_list);
                if (!add_team_to_project) return sendResponse(res, 400, add_team_to_project, 'Unable Add Teams To Projects ', null);


                let members_list = members_id.map(id => [admin_id, id, projet.insertId, members_role_id]);
                const add_members = await ProjectCURD.addManagerToProject(members_list);
                if (!add_members) return sendResponse(res, 400, null, 'Unable TO Add Members TO Team', null);

                members_data = await ProjectCURD.getMembersToProject(members_id);
                project_details.members_data = members_data;
                project_details.teams_data = teamData;
            }
            let get_project_details = await getProjectData(admin_id, projet.insertId, true)
            return sendResponse(res, 200, get_project_details, 'Project Successfully Created.', null);

        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Faled To Create Project', null);
        }


    }

    async addProjectMember(req, res) {
        const member_ids = req.body.members_ids || [];
        const project_id = req.body.project_id;
        const role_id = req.body.role_id;
        let admin_id = req['decoded'].jsonData.admin_id;

        try {
            const validate = JoiValidation.addProjectMember(member_ids, project_id, role_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const check_member = await ProjectCURD.getMembersByUser(member_ids, project_id);
            if (check_member.length > 0) {
                return sendResponse(res, 400, check_member, 'Selected Member Already Exists In This Project.', null);
            }

            let members_list = member_ids.map(id => [admin_id, id, project_id, role_id]);
            const add_members = await ProjectCURD.addManagerToProject(members_list);
            if (!add_members) {
                return sendResponse(res, 400, null, 'Unable To ADd Project Members.', null);
            } else if (add_members.affectedRows) {
                return sendResponse(res, 200, req.body, 'Successfully Added Members To Project.', null);
            }
            return sendResponse(res, 400, null, 'Unable To Project Members.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Add Project Members.', null);
        }


    }
    async deleteProjectMember(req, res) {
        const member_ids = req.body.members_ids || [];
        const project_id = req.body.project_id;
        let admin_id = req['decoded'].jsonData.admin_id;

        try {
            const validate = JoiValidation.deleteProjectMember(member_ids, project_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const delete_member = await ProjectCURD.deleteProjectMember(member_ids, project_id, admin_id);
            if (!delete_member) {
                return sendResponse(res, 400, null, 'Unable To Delete Project Members.', null);
            } else if (delete_member.affectedRows) {
                return sendResponse(res, 200, req.body, 'Successfully Deleted Project Members.', null);
            }
            return sendResponse(res, 400, null, 'Unable To Delete Project Members.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Delete Project Members.', null);
        }
    }

    async updateProjectMember(req, res) {
        const project_id = req.body.project_id;
        const member_id = req.body.member_id;
        const role_id = req.body.role_id;
        const admin_id = req['decoded'].jsonData.admin_id;

        try {
            const validate = JoiValidation.updateProjectMember(member_id, project_id, role_id);
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const update_project_member = await ProjectCURD.updateProjectMember(admin_id, project_id, member_id, role_id);
            if (!update_project_member) {
                return sendResponse(res, 400, null, 'Unable To Update Project Members.', null);
            } else if (update_project_member.affectedRows) {
                return sendResponse(res, 200, req.body, 'Successfully Updated Project Member.', null);
            }
            return sendResponse(res, 400, null, 'Unable To Add Project Members.', null);
        } catch (err) {
            Logger.error(`----error-----${err}------${__filename}----`);
            return sendResponse(res, 400, null, 'Unable To Add Project Members.', null);
        }

    }

}
module.exports = new Project;




async function getProjectData(admin_id, project_id, is_project_id) {

    var result = [];
    let project_teams = [];

    let project_data = await ProjectCURD.getSingleProjects(admin_id, project_id, is_project_id, 1, false)
    if (project_data.length != 0) {
        await Promise.all([
            ProjectCURD.getProjctTeams(is_project_id, project_id, admin_id),
            ProjectCURD.getProjctMembers(is_project_id, project_id, admin_id)
        ]).then((team_and_members) => {
            project_data.forEach(project => {
                let team = team_and_members[0].filter(findTeam)
                function findTeam(team_array) {
                    return team_array.project_id == project.project_id;
                }
                let members = team_and_members[1].filter(findMember)
                function findMember(member_array) {
                    return member_array.project_id == project.project_id;
                }
                project.members = members;
                project.teams = team;
                project_teams.push(project)
            });
        })

    }

    return project_teams;
}







// console.log( moment('2020-10-11').isSameOrBefore('2020-10-12'))