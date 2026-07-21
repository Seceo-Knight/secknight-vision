const axios = require('axios');
const moment = require('moment');
const ZohoHelper = require('./ZohoHelper');
const async = require('async');

const sendResponse = require('../../../utils/myService').sendResponse;
const Zoho = require('../../shared/integrations/Zoho');
const ZohoValidation = require('../../../rules/validation/Zoho');
const ZohoUserManagement = require('./ZohoUserManagement');
const User = require('../../shared/integrations/User');

class PortalService {

    async portalsSync_old(req, res) {
        try {
            let admin_id = req['decoded'].jsonData.admin_id;
            let manager_id = req['decoded'].jsonData.id ? req['decoded'].jsonData.id : null;
            let access_token;
            let current_time = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            let last_one_hour = moment().utc().subtract(58, "minutes").format('YYYY-MM-DD HH:mm:ss');

            //Chech token valid or not, if invalid get new access token
            let integration_data = await Zoho.zohointegrationData(admin_id, manager_id);
            if (!integration_data) return sendResponse(res, 400, null, 'Unable To Portal Data.', null);
            if (integration_data.length === 0) return sendResponse(res, 400, null, 'Integration Data Not Found.', null);

            if (!(last_one_hour <= moment().utc(integration_data[0].updated_at).format('YYYY-MM-DD HH:mm:ss') && moment().utc(integration_data[0].updated_at).format('YYYY-MM-DD HH:mm:ss') <= current_time)) {
                access_token = await ZohoHelper.regenarateToken(integration_data[0].refresh_token);
                if (!access_token) return sendResponse(res, 400, null, 'Unable To Get Integration Data', null);
                let updated_token = await Zoho.updateIntegrationData(admin_id, manager_id, access_token);
                if (!updated_token) return sendResponse(res, 400, null, 'Unable To Update Integration Data', null);
            } else {
                access_token = integration_data[0].access_token;
            }
            let portal = await ZohoHelper.getPortals(access_token);
            if (!portal) return sendResponse(res, 400, null, 'Unable To Get Portals', null);

            //User sync from zoho, only zoho auth can do.
            await Promise.all(portal.map(async (p, i) => {
                let users = await ZohoHelper.getUsersByPortal(p.id_string, access_token);
                if (!users) return portal.splice(i, 1);
                if (users.length === 0) return;
                for (const user of users) {
                    let user_reg = await ZohoUserManagement.AddUser(admin_id, user.name, user.email, user.id, p.id_string);
                }
            }))
            if (portal.length === 0) return sendResponse(res, 400, null, 'Portals Not Found.', null);

            let organization = await Zoho.getOrginization(admin_id, manager_id, access_token, integration_data[0].integration_id);

            let new_portals = portal.filter(e => !organization.find(org => org.ext_org_id === e.id_string));

            let final_poratal = new_portals.map(e => [e.name, e.id_string, admin_id, manager_id, integration_data[0].integration_id, integration_data[0].id]);

            if (new_portals.length > 0) {
                let inserted = await Zoho.addPortals(final_poratal);
            }

            //After getting portal add portal,get projects and add to db and also check already exists. 
            let organization_new = await Zoho.getOrginization(admin_id, manager_id, access_token, integration_data[0].integration_id);

            for (const p of organization_new) {
                // async.forEach(organization_new, async (p, cb) => {
                let projects = await ZohoHelper.getProjects(access_token, p.ext_org_id);
                if (projects.projects.length > 0) {

                    for (const project of projects.projects) {
                        let upsert_project = await Zoho.upsertProjects(project.name, project.description ? project.description : null, admin_id, manager_id, project.id_string, p.id, project.start_date ? moment().utc(project.start_date).format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00', project.end_date ? moment().utc(project.end_date).format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00', '0000:00:00 00:00:00', '0000:00:00 00:00:00', project.status === 'active' ? 1 : 3, project.project_percent);
                        let project_user = await ZohoHelper.getUsersByProject(p.ext_org_id, access_token, project.id_string);
                        if (project_user.length > 0) {
                            let ext_user_ids = project_user.map(a => a.id);
                            let local_user = await User.portalUser(admin_id, ext_user_ids);

                            for (const user of local_user) {
                                let check_user = await User.checkUserExistsInProject(admin_id, user.user_id, upsert_project.insertId)
                                if (check_user.length === 0) {
                                    let add_user_to_project = await User.addUserToProject(admin_id, user.user_id, upsert_project.insertId, project.id_string, user.ext_user_id)
                                }
                            }
                        }
                    }
                }
            }
            // cb()
            // let old_projects = await Zoho.getLocalProject(p.id, admin_id, manager_id);
            // let new_projects = projects.projects.filter(e => !old_projects.find(project => project.ext_project_id === e.id_string));
            // let final_projects = new_projects.map(e => [e.name, e.description ? e.description : null, admin_id, manager_id, e.id_string, p.id, e.start_date ? moment.utc(e.start_date).format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00', e.end_date ? moment.utc(e.end_date).format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00', e.status === 'active' ? 1 : 3, e.project_percent]);
            // if (new_projects.length > 0) {
            //     let new_inserted_projects = await Zoho.addprojects(final_projects);
            // }
            // }, () => {
            // })
            return sendResponse(res, 200, null, 'Portal Sync Done.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Something Went Wrong.', null);
        }
    }
    async portalsSync(req, res) {
        try {
            let admin_id = req['decoded'].jsonData.admin_id;
            let manager_id = req['decoded'].jsonData.id ? req['decoded'].jsonData.id : null;
            let access_token;
            let current_time = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            let last_one_hour = moment().utc().subtract(58, "minutes").format('YYYY-MM-DD HH:mm:ss');

            //Chech token valid or not, if invalid get new access token
            let integration_data = await Zoho.zohointegrationData(admin_id, manager_id);
            if (!integration_data) return sendResponse(res, 400, null, 'Unable To Portal Data.', null);
            if (integration_data.length === 0) return sendResponse(res, 400, null, 'Integration Data Not Found.', null);

            if (!moment(integration_data[0].updated_at).isBetween(last_one_hour, current_time, null, '[]')) {
                access_token = await ZohoHelper.regenarateToken(integration_data[0].refresh_token);
                if (!access_token) return sendResponse(res, 400, null, 'Unable To Get Integration Data', null);
                let updated_token = await Zoho.updateIntegrationData(admin_id, manager_id, access_token);
                if (!updated_token) return sendResponse(res, 400, null, 'Unable To Update Integration Data', null);
            } else {
                access_token = integration_data[0].access_token;
            }
            let portal = await ZohoHelper.getPortals(access_token);
            if (!portal) return sendResponse(res, 400, null, 'Unable To Get Portals', null);

            if (portal.length === 0) return sendResponse(res, 400, null, 'Portals Not Found.', null);

            let organization = await Zoho.getOrginization(admin_id, manager_id, access_token, integration_data[0].integration_id);

            let new_portals = portal.filter(e => !organization.find(org => org.ext_org_id === e.id_string));

            let final_poratal = new_portals.map(e => [e.name, e.id_string, admin_id, manager_id, integration_data[0].integration_id, integration_data[0].id]);

            if (new_portals.length > 0) {
                let inserted = await Zoho.addPortals(final_poratal);
            }

            //After getting portal add portal,get projects and add to db and also check already exists. 
            let organization_new = await Zoho.getOrginization(admin_id, manager_id, access_token, integration_data[0].integration_id);

            for (const p of organization_new) {
                // async.forEach(organization_new, async (p, cb) => {
                let projects = await ZohoHelper.getProjects(access_token, p.ext_org_id);
                if (projects.projects.length > 0) {

                    for (const project of projects.projects) {
                        let upsert_project = await Zoho.upsertProjects(project.name, project.description ? project.description : null, admin_id, manager_id, project.id_string, p.id, project.start_date ? moment(project.start_date, "MM-DD-YYYY").format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00', project.end_date ? moment(project.end_date, "MM-DD-YYYY").format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00', '0000:00:00 00:00:00', '0000:00:00 00:00:00', project.status === 'active' ? 1 : 3, project.project_percent);
                    }
                }
            }
            return sendResponse(res, 200, null, 'Portal Sync Done.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Something Went Wrong.', null);
        }
    }

    async userSync(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let manager_id = req['decoded'].jsonData.id ? req['decoded'].jsonData.id : null;
        let access_token;

        let current_time = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        let last_one_hour = moment().utc().subtract(58, "minutes").format('YYYY-MM-DD HH:mm:ss');

        //Chech token valid or not, if invalid get new access token
        try {

            let integration_data = await Zoho.zohointegrationData(admin_id, manager_id);
            if (!integration_data) return sendResponse(res, 400, null, 'Unable To Portal Data.', null);
            if (integration_data.length === 0) return sendResponse(res, 400, null, 'Integration Data Not Found.', null);

            if (moment(integration_data[0].updated_at).isBetween(last_one_hour, current_time, null, '[]')) {
                access_token = await ZohoHelper.regenarateToken(integration_data[0].refresh_token);
                if (!access_token) return sendResponse(res, 400, null, 'Unable To Get Integration Data', null);
                let updated_token = await Zoho.updateIntegrationData(admin_id, manager_id, access_token);
                if (!updated_token) return sendResponse(res, 400, null, 'Unable To Update Integration Data', null);
            } else {
                access_token = integration_data[0].access_token;
            }

            let portal = await Zoho.getOrginization(admin_id, manager_id, access_token, integration_data[0].integration_id);
            if (!portal) return sendResponse(res, 400, null, 'Unable Sync Users', null);

            //User sync from zoho, only zoho auth can do.
            // await Promise.all(portal.map(async (p, i) => {
            //     let users = await ZohoHelper.getUsersByPortal(p.ext_org_id, access_token);
            //     console.log('===============', users);
            //     if (!users) return;
            //     if (users.length === 0) return;
            //     for (const user of users) {
            //         let user_reg = await ZohoUserManagement.AddUser(admin_id, user.name, user.email, user.id, p.ext_org_id);
            //     }
            // }))
            // return;
            for (const p of portal) {
                // async.forEach(organization_new, async (p, cb) => {
                let projects = await Zoho.getLocalProject(p.id, admin_id, manager_id);
                if (projects.length > 0) {

                    for (const project of projects) {
                        let project_user = await ZohoHelper.getUsersByProject(p.ext_org_id, access_token, project.ext_project_id);
                        if (project_user.length > 0) {
                            for (const user of project_user) {
                                let id = await ZohoUserManagement.AddUser(admin_id, user.name, user.email, user.id, p.ext_org_id);
                                if (id) {
                                    let check_user = await User.checkUserExistsInProject(admin_id, id, project.id)
                                    if (check_user.length === 0) {
                                        let add_user_to_project = await User.addUserToProject(admin_id, id, project.id, project.ext_project_id, user.id)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return sendResponse(res, 200, null, 'User sync Done.', null);
        } catch (err) {
            if (!portal) return sendResponse(res, 400, null, 'Unable Sync Users', null);
        }

    }

    async projectSync(req, res) {

        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id ? req['decoded'].jsonData.id : null;
        const current_time = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        const last_one_hour = moment().utc().subtract(58, "minutes").format('YYYY-MM-DD HH:mm:ss');
        const {
            project_id
        } = req.body;
        let access_token;

        const validate = ZohoValidation.projectIdValidation({
            project_id
        });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        try {
            //Chech token valid or not, if invalid get new access token
            let integration_data = await Zoho.zohointegrationData(admin_id, manager_id);
            if (!integration_data) return sendResponse(res, 400, null, 'Unable To Portal Data.', null);
            if (integration_data.length === 0) return sendResponse(res, 400, null, 'Integration Data Not Found.', null);

            if (!moment(integration_data[0].updated_at).isBetween(last_one_hour, current_time, null, '[]')) {
                // console.log
                // return
                access_token = await ZohoHelper.regenarateToken(integration_data[0].refresh_token);
                if (!access_token) return sendResponse(res, 400, null, 'Unable To Get Integration Data', null);
                let updated_token = await Zoho.updateIntegrationData(admin_id, manager_id, access_token);
                if (!updated_token) return sendResponse(res, 400, null, 'Unable To Update Integration Data', null);
            } else {
                access_token = integration_data[0].access_token;
            }
            // return
            //Get project details for task and issue sync
            let project_details = await Zoho.getProject(project_id, manager_id, admin_id);
            if (!project_details) return sendResponse(res, 400, null, 'Unable To Find Project', null);

            //Get project task and store it in db
            if (project_details.length === 0) return sendResponse(res, 400, null, 'Project Not Found', null);

            let project_user = await ZohoHelper.getUsersByProject(project_details[0].ext_org_id, access_token, project_details[0].ext_project_id);
            if (!project_user) return sendResponse(res, 400, null, 'Invalid OAuth access token.', null);

            if (project_user.length > 0) {
                for (const user of project_user) {
                    let id = await ZohoUserManagement.AddUser(admin_id, user.name, user.email, user.id, project_details[0].ext_org_id);
                    if (id) {
                        let check_user = await User.checkUserExistsInProject(admin_id, id, project_details[0].project_id);
                        if (check_user.length === 0) {
                            let add_user_to_project = await User.addUserToProject(admin_id, id, project_id, project_details[0].ext_project_id, user.id)
                        }
                    }
                }
            }

            let tasks = await ZohoHelper.getTasks(access_token, project_details[0].ext_org_id, project_details[0].ext_project_id);
            if (!tasks) return sendResponse(res, 400, null, 'Unable To Get tasks Data.', null);

            if (tasks.tasks.length > 0) {
                for (const task of tasks.tasks) {
                    let task_list_id;
                    let task_list = await Zoho.getTaskListByExtenalId(task.tasklist.id, project_id);

                    if (task_list.length !== 0) {
                        task_list_id = task_list[0].id;
                    } else {
                        let new_task_list = await Zoho.addNewTaskList(task.tasklist.id, task.tasklist.name, project_id, 2);
                        task_list_id = new_task_list.insertId;
                    }
                    let status;
                    switch (task.status.name) {
                        case 'Open': // 1557478000000016068   //Open
                            status = 4;
                            break;
                        case 'In Progress': // 1557478000000031001   // In Progress
                            status = 1;
                            break;
                        case 'On Hold': // 1557478000000031007   // On Hold
                            status = 2;
                            break;
                        case 'In Review': // 1557478000000031003   // In Review
                            status = 5;
                            break;
                        case 'To be Tested': // 1557478000000031005   //To be Tested
                            status = 6;
                            break;
                        case 'Delayed': // 1557478000000031009    // Delayed
                            status = 7;
                            break;
                        case 'Cancelled': //  1557478000000031011   //Cancelled
                            status = 8;
                        default:
                            status = 3; // 1557478000000016071
                    }
                    let user_id;

                    let insert_task = await Zoho.insertTask(task.id_string, task.name.replace(/"/g, '\\"').replace(/'/g, '\\"'), task.description ? task.description.replace(/"/g, '\\"').replace(/'/g, '\\"') : null, project_id, task_list_id, task.end_date ? moment(task.end_date, "MM-DD-YYYY").format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00', task.completed, task.start_date ? moment(task.start_date, "MM-DD-YYYY").format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00', status, task.percent_complete);
                    if (task.details.owners[0].id) {
                        for (const owner of task.details.owners) {
                            let portal_user = await User.getUserByExtId(owner.id, admin_id, project_id);
                            if (portal_user && portal_user.length > 0) {
                                const task_to_user = await User.taskToUser(portal_user[0].user_id, insert_task.insertId, task.id_string, owner.id);
                            }
                        }
                    }
                    // if (task.details.owners[0].id) {
                    //     let portal_user = await User.getUserByExtId(task.details.owners[0].id, admin_id, project_id);
                    //     if (!portal_user || portal_user.length === 0) {
                    //         user_id = null;
                    //     } else {
                    //         user_id = portal_user[0].user_id;
                    //     }
                    // } else {
                    //     user_id = null;
                    // }
                }
            }
            let issues = await ZohoHelper.getBugs(access_token, project_details[0].ext_org_id, project_details[0].ext_project_id);
            if (!issues) return sendResponse(res, 400, null, 'Task Sync Done And Issue Not Found.', null);
            let result = '';

            for (const bug of issues.bugs) {
                let severity;
                switch (bug.severity.type) {
                    case 'Critical': // 1557478000000033000
                        severity = 2;
                        break;
                    case 'Major': // 1557478000000033000
                        severity = 3;
                        break;
                    case 'Minor':
                        severity = 4; //  1557478000000033000
                        break;
                    default:
                        severity = 1; // 1557478000000033000
                }
                let status;
                switch (bug.status.type) {
                    case 'Open': // 1557478000000033081 //Open
                        status = 4;
                        break;
                    case 'InProgress': // 1557478000000033083 // InProgress
                        status = 1;
                        break;
                    case 'ToBeTested': // 1557478000000033085  // ToBeTested
                        status = 2;
                        break;
                    case 'Reopen': // 1557478000000033089  // Reopen
                        status = 5;
                        break;
                    default:
                        status = 3; //  1557478000000033087
                }
                let assigned_by_id = null;
                let assign_by_user = await User.getUserByExtId(bug.reporter_id, admin_id, project_id);
                if (!assign_by_user || assign_by_user.length === 0) {
                    assigned_by_id = null;
                } else {
                    assigned_by_id = assign_by_user[0].user_id;
                }
                let assigned_to_id = null;
                if (bug.assignee_id) {
                    let assign_to_user = await User.getUserByExtId(bug.assignee_id, admin_id, project_id);
                    if (!assign_to_user || assign_to_user.length === 0) {
                        assigned_to_id = null;
                    } else {
                        assigned_to_id = assign_to_user[0].user_id;
                    }
                } else {
                    assigned_to_id = null;
                }
                console.log(bug.due_date);
                let due_date_format = bug.due_date ? moment(bug.due_date, 'MM-DD-YYYY').format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00';
                result = result.concat(`("${bug.title.replace(/"/g, '\\"').replace(/'/g, '\\"')}", "${bug.description.replace(/"/g, '\\"').replace(/'/g, '\\"')}", ${parseInt(project_id)},"${bug.id_string}","${project_details[0].ext_project_id}",${status}, 5, ${severity}, "${due_date_format}",${assigned_by_id},${assigned_to_id}),`);
            }
            result = result.slice(0, -1);
            const inserted_bug = await Zoho.insertIssueBulk(result);
            return sendResponse(res, 200, null, 'Project Sync Done.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Something Went Wrong.', err);
        }
    }

    async integration(req, res) {
        const integration = await Zoho.integration();
        if (!integration) return sendResponse(res, 400, null, 'Unable To Get Integration Data.', null);
        return sendResponse(res, 200, integration, 'Integration Data.', null);
    }

    async integrationData(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;

        const integration = await Zoho.integrationData(manager_id, admin_id);
        if (!integration) return sendResponse(res, 400, null, 'Unable To Get Integration Data.', null);
        if (integration.length === 0) return sendResponse(res, 400, null, "You didn't added any portal, please add portal to get all datas.", null);
        return sendResponse(res, 200, integration, 'Integration Data.', null);
    }

    async deleteIntegrationData(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let manager_id = req['decoded'].jsonData.id ? req['decoded'].jsonData.id : null;
        let integration_data_id = req.body.integration_data_id;

        let validate = ZohoValidation.portalIdValidation({
            integration_org_id: integration_data_id
        });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let integration = await Zoho.deleteIntegrationData(manager_id, admin_id, integration_data_id);
        if (!integration) return sendResponse(res, 400, null, 'Unable To Get Integration Data.', null);
        if (integration.affectedRows === 0) return sendResponse(res, 400, null, "Invalid Input.", null);
        return sendResponse(res, 200, integration, 'Successfully Deleted Integration Data.', null);
    }

    async portals(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;

        let portals = await Zoho.portals(manager_id, admin_id);
        if (!portals) return sendResponse(res, 400, null, 'Unable To Get portal Data.', null);
        if (portals.length === 0) return sendResponse(res, 400, null, "You Didn't Added Any Portal.", null);
        return sendResponse(res, 200, portals, 'Portal Data.', null);
    }

}
module.exports = new PortalService;