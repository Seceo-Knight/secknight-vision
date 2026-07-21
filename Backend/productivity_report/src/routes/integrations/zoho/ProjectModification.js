const moment = require('moment');

const ZohoHelper = require('./ZohoHelper');
const ZohoAuth = require('./Authentication');
const ZohoCURD = require('../../shared/integrations/ZohoCURD');
const Zoho = require('../../shared/integrations/Zoho');
const ZohoUser = require('../../shared/integrations/User');
const ZohoValidation = require('../../../rules/validation/Zoho');
const User = require('../../shared/integrations/User');
const sendResponse = require('../../../utils/myService').sendResponse;


class ProjectModification {

    async createProject(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const description = req.body.description || null;
        const start_date = req.body.start_date || null;
        const end_date = req.body.end_date || null;

        const {
            ext_org_id,
            project_name,
            integration_org_id
        } = req.body;

        const data = {
            name: project_name,
            description: description,
            start_date: start_date,
            end_date: end_date
        };

        try {
            const validate = ZohoValidation.createProjectValidation({
                ext_org_id,
                project_name,
                integration_org_id,
                description,
                start_date,
                end_date
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);
            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const projects = await ZohoHelper.createProject(access_token, data, ext_org_id);

            if (!(Array.isArray(projects))) return sendResponse(res, 400, null, projects.message, projects.message);

            let new_project = await ZohoCURD.createProject(project_name, description, admin_id, manager_id, start_date, end_date, integration_org_id, projects[0].id_string);

            req.body.ext_project_id = projects[0].id_string;
            req.body.project_id = new_project.insertId;
            return sendResponse(res, 200, req.body, 'Project Successfully Created.', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Create Project.', 'Error while created project');
        }
    }

    async deleteProject(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const {
            ext_org_id,
            ext_project_id,
            project_id
        } = req.body;

        const validate = ZohoValidation.deleteProject({
            ext_org_id,
            ext_project_id,
            project_id
        });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        try {
            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const project = await ZohoHelper.deleteProject(ext_org_id, access_token, ext_project_id);
            if (!project) return sendResponse(res, 400, null, 'Unable To delete Project', 'Error error deleting project on zoho');

            const delete_project = await ZohoCURD.deleteProject(admin_id, project_id);
            if (delete_project.affectedRows === 0) return sendResponse(res, 400, null, 'Unable To delete Project', 'Error error deleting project on zoho');

            return sendResponse(res, 200, null, 'Project Successfully Deleted.', null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Delete Project.', 'Error while Deleteing project');
        }
    }

    async createTasklist(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const {
            ext_org_id,
            ext_project_id,
            project_id,
            name
        } = req.body;

        const data = {
            name: name,
            flag: 'internal'
        }

        try {
            const validate = ZohoValidation.createTasklistValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                name
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);


            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const task_list = await ZohoHelper.createTaskList(ext_org_id, access_token, ext_project_id, data);
            if (!task_list) return sendResponse(res, 400, null, 'Unable To Create Tasklist.', 'Error while creating tasklist.');

            if (!(Array.isArray(task_list.tasklists))) return sendResponse(res, 400, null, task_list.message, task_list.message);

            const new_task = await ZohoCURD.createProjectList(name, task_list.tasklists[0].id_string, project_id, 2);

            req.body.ext_list_id = task_list.tasklists[0].id_string;
            req.body.task_list_id = new_task.insertId;
            return sendResponse(res, 200, req.body, 'TaskList Successfully Created.', null)

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Create Tasklist.', 'Error while creating tasklist.');
        }
    }

    async deleteTaskList(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const {
            ext_org_id,
            ext_project_id,
            project_id,
            task_list_id,
            ext_list_id
        } = req.body;

        try {
            const validate = ZohoValidation.deleteProjectlistValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                task_list_id,
                ext_list_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const task_list = await ZohoHelper.deleteProjectList(ext_org_id, access_token, ext_project_id, ext_list_id);
            if (!task_list) return sendResponse(res, 400, null, 'Unable To delete TaskList', 'Error error deleting TaskList on zoho');

            const delete_project_list = await ZohoCURD.deleteProjectList(project_id, task_list_id);
            if (delete_project_list.affectedRows === 0) return sendResponse(res, 400, null, 'Unable To delete TaskList', 'Error error deleting TaskList on zoho');

            return sendResponse(res, 200, null, 'TaskList Successfully Deleted.', null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Delete TaskList.', err);
        }
    }

    async createTask(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const ext_user_id = req.body.ext_user_id || null;
        const user_id = req.body.user_id ? req.body.user_id : null;
        const project_list_id = req.body.project_list_id || null;
        const ext_list_id = req.body.ext_list_id || null;
        const start_date = req.body.start_date || null;
        const end_date = req.body.end_date || null;
        const duration = req.body.duration || null;
        const duration_type = req.body.duration_type || null;
        const description = req.body.description || null;

        const {
            ext_org_id,
            ext_project_id,
            project_id,
            name
        } = req.body;
        const data = {
            name: name,
            tasklist_id: ext_list_id,
            person_responsible: ext_user_id,
            start_date: start_date,
            end_date: end_date,
            duration,
            duration_type: duration_type,
            description: description
        }
        // , ext_user_id, ext_list_id, start_date, end_date, duration, duration_type, description
        try {
            let validate = ZohoValidation.createTaskValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                name,
                ext_user_id,
                ext_list_id,
                start_date,
                end_date,
                duration,
                duration_type,
                description,
                user_id,
                project_list_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const task = await ZohoHelper.createTask(ext_org_id, access_token, ext_project_id, data);
            if (!task) return sendResponse(res, 400, null, 'Unable To Create Task.', 'Error while creating task.');

            if (!(Array.isArray(task.tasks))) return sendResponse(res, 400, null, task.message, task.message);

            // let new_task = await ZohoCURD.createTask(name, task_list.tasklists[0].id_string, project_id, 2);
            const new_task = await ZohoCURD.createTask(name.replace(/"/g, '\\"').replace(/'/g, '\\"'), description.replace(/"/g, '\\"').replace(/'/g, '\\"'), start_date ? moment(start_date, 'MM-DD-YYYY').format('YYYY-MM-DD HH:mm:SS') : '0000:00:00 00:00:00', end_date ? moment(end_date, 'MM-DD-YYYY').format('YYYY-MM-DD HH:mm:SS') : '0000:00:00 00:00:00', 4, project_id, null, user_id, project_list_id, task.tasks[0].id_string);
            req.body.ext_task_id = task.tasks[0].id_string;
            req.body.task_id = new_task.insertId;
            return sendResponse(res, 200, req.body, 'Task Successfully Created.', null)

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Create Task.', 'Error while creating task.');
        }
    }

    async updateTask(req, res) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            const manager_id = req['decoded'].jsonData.id || null;
            const ext_user_id = req.body.ext_user_id || null;
            const user_id = req.body.user_id ? req.body.user_id : null;
            const start_date = req.body.start_date || null;
            const end_date = req.body.end_date || null;
            const percent_complete = req.body.percent_complete || null;
            const duration = req.body.duration || null;
            const duration_type = req.body.duration_type || null;
            const description = req.body.description || null;
            const custom_status = req.body.custom_status || null;
            let status = req.body.status || null;
            const name = req.body.name || null;

            const {
                ext_org_id,
                ext_project_id,
                project_id,
                ext_project_todo_id
            } = req.body;

            const data = {
                name: name,
                person_responsible: ext_user_id,
                custom_status: status,
                percent_complete: percent_complete,
                duration: duration,
                start_date: start_date,
                end_date: end_date,
                duration_type: duration_type,
                description: description
            }
            // , ext_user_id, ext_list_id, start_date, end_date, duration, duration_type, description

            let validate = ZohoValidation.updateTaskValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                ext_project_todo_id,
                name,
                ext_user_id,
                start_date,
                end_date,
                duration,
                duration_type,
                description,
                user_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let new_status;
            if (status) {
                switch (status) {
                    case '4': // 1557478000000016068   //Open
                        new_status = 'Open';
                        break;
                    case '1': // 1557478000000031001   // In Progress
                        new_status = 'In Progress';
                        break;
                    case '2': // 1557478000000031007   // On Hold
                        new_status = 'On Hold';
                        break;
                    case '5': // 1557478000000031003   // In Review
                        new_status = 'In Review';
                        break;
                    case '6': // 1557478000000031005   //To be Tested
                        new_status = 'To be Tested';
                        break;
                    case '7': // 1557478000000031009    // Delayed
                        new_status = 'Delayed';
                        break;
                    case '8': //  1557478000000031011   //Cancelled
                        new_status = 'Cancelled';
                    default:
                        new_status = 'Closed'; // 1557478000000016071
                }
            }


            const local_task = await Zoho.getTaskByExtenalId(ext_project_todo_id, project_id, admin_id);

            if (!local_task || local_task.length === 0) return sendResponse(res, 400, null, 'Failed To Update Task!', 'Database Error.');

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            if (status) {
                const task_layout = await ZohoHelper.taskLayout(ext_org_id, access_token, ext_project_id);
                if (!task_layout) return sendResponse(res, 400, null, 'Unable To Get Task Layout', 'Error while getting task Layout');
                const result = task_layout.status_details.find(({
                    name
                }) => name === new_status);
                data.custom_status = result.id;
            }
            const task = await ZohoHelper.updateTask(ext_org_id, access_token, ext_project_id, ext_project_todo_id, data);
            if (!task) return sendResponse(res, 400, null, 'Unable To Create Task.', 'Error while creating task.');

            if (!(Array.isArray(task.tasks))) return sendResponse(res, 400, null, task.message, task.message);

            // let new_task = await ZohoCURD.createTask(name, task_list.tasklists[0].id_string, project_id, 2);
            // const new_task = await Zoho.insertTask(task.tasks[0].name.replace(/"/g, '\\"').replace(/'/g, '\\"'), description.replace(/"/g, '\\"').replace(/'/g, '\\"') || null,
            const new_start_date = start_date ? moment(start_date, "MM-DD-YYYY").format('YYYY-MM-DD HH:mm:SS') : moment(local_task[0].start_date, "YYYY-MM-DD HH:mm:SS").format('YYYY-MM-DD');
            const new_end_date = end_date ? moment(end_date, "MM-DD-YYYY").format('YYYY-MM-DD HH:mm:SS') : moment(local_task[0].due_date, "YYYY-MM-DD HH:mm:SS").format('YYYY-MM-DD');

            const update = await ZohoCURD.updateTask(local_task[0].id, task.tasks[0].name.replace(/"/g, '\\"').replace(/'/g, '\\"'), task.tasks[0].description ? task.tasks[0].description.replace(/"/g, '\\"').replace(/'/g, '\\"') : null, new_start_date, new_end_date, status ? status : local_task[0].status, task.tasks[0].percent_complete)
            return sendResponse(res, 200, req.body, 'Task Successfully Updated.', null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Create Task.', 'Error while creating task.');
        }
    }

    async deleteTask(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const {
            ext_org_id,
            ext_project_id,
            project_id,
            task_id,
            ext_task_id
        } = req.body;

        try {
            const validate = ZohoValidation.deletetaskValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                task_id,
                ext_task_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const task = await ZohoHelper.deleteTask(ext_org_id, access_token, ext_project_id, ext_task_id);
            if (!task) return sendResponse(res, 400, null, 'Unable To delete Task', 'Error error deleting Task on zoho');

            const delete_task = await ZohoCURD.deleteTask(project_id, task_id);
            if (delete_task.affectedRows === 0) return sendResponse(res, 400, null, 'Unable To delete Task', 'Error error deleting Task on zoho');

            return sendResponse(res, 200, null, 'Task Successfully Deleted.', null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Delete Task.', err);
        }
    }

    async createBug(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const {
            ext_org_id,
            ext_project_id,
            project_id,
            name
        } = req.body;

        const ext_assignee_id = req.body.ext_assignee_id || null;
        const assignee_user_id = req.body.assignee_user_id || null;
        const description = req.body.description || null;
        const due_date = req.body.due_date || null;

        const data = {
            title: name,
            assignee: ext_assignee_id,
            flag: 'Internal',
            due_date: due_date,
            description: description
        }
        // , ext_user_id, ext_list_id, start_date, end_date, duration, duration_type, description
        try {
            let validate = ZohoValidation.createBugValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                name,
                ext_assignee_id,
                due_date,
                description,
                assignee_user_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const bug = await ZohoHelper.createBug(ext_org_id, access_token, ext_project_id, data);
            if (!bug) return sendResponse(res, 400, null, 'Unable To Create Bug.', 'Error while creating bug.');

            if (!(Array.isArray(bug.bugs))) return sendResponse(res, 400, null, bug.message, bug.message);

            let user = await ZohoUser.getUserByExtID(bug.bugs[0].reporter_id, project_id);
            const assigned_by_id = user.length > 0 ? user[0].user_id : null;

            let new_bug = await ZohoCURD.createBug(name.replace(/"/g, '\\"').replace(/'/g, '\\"'), description.replace(/"/g, '\\"').replace(/'/g, '\\"'), project_id, ext_project_id, bug.bugs[0].id_string, assigned_by_id, assignee_user_id, 4, 5, 1, due_date ? moment(due_date).format('YYYY-MM-DD HH:mm:ss') : '0000:00:00 00:00:00');
            req.body.ext_issue_id = bug.bugs[0].id_string;
            req.body.issue_id = new_bug.insertId;
            return sendResponse(res, 200, req.body, 'TaskList Successfully Created.', null)

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Create Tasklist.', 'Error while creating tasklist.');
        }
    }

    async deleteBug(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const {
            ext_org_id,
            ext_project_id,
            project_id,
            issue_id,
            ext_issue_id
        } = req.body;

        try {
            const validate = ZohoValidation.deleteBugValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                issue_id,
                ext_issue_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const issue = await ZohoHelper.deleteBug(ext_org_id, access_token, ext_project_id, ext_issue_id);
            if (!issue) return sendResponse(res, 400, null, 'Unable To delete Issue', issue);

            const delete_issue = await ZohoCURD.deleteTask(project_id, issue_id);
            if (delete_issue.affectedRows === 0) return sendResponse(res, 400, null, 'Unable To delete Issue', 'Error error deleting Issue on zoho');

            return sendResponse(res, 200, null, 'Issue Successfully Deleted.', null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Delete Issue.', err);
        }
    }

    async addUserToProject(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const {
            ext_org_id,
            ext_project_id,
            project_id,
            email,
            user_id,
            role
        } = req.body;

        const data = {
            email: email,
            role: role
        }

        try {
            const validate = ZohoValidation.addUserToProjectValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                email,
                role,
                user_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const users = await ZohoHelper.addUserToProject(ext_org_id, access_token, ext_project_id, data);

            if (users.status === 0) return sendResponse(res, 400, null, users.error.error.message, null);
            if (!(Array.isArray(users.data))) return sendResponse(res, 400, null, 'Unable To Add Users', null);
            let add_user_to_project = await User.addUserToProject(admin_id, user_id, project_id, ext_project_id, users.data[users.data.length - 1].id)
            return sendResponse(res, 200, null, 'User Added To Project.', null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Add User To Project', err);
        }
    }

    async removeUserToProject(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const {
            ext_org_id,
            ext_project_id,
            project_id,
            ext_user_id,
            user_id
        } = req.body;

        try {
            const validate = ZohoValidation.removeUserToProjectValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                ext_user_id,
                user_id
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            const users = await ZohoHelper.removeUserFromProject(ext_org_id, ext_project_id, access_token, ext_user_id);

            if (users) return sendResponse(res, 400, null, 'Unable To Remove User From Project.', null);
            const delete_user_to_project = await User.deleteUserFromProject(admin_id, user_id, project_id);
            return sendResponse(res, 200, null, 'User Removed From Project.', null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Remove User From Project', err);
        }
    }

    async updateIssue(req, res) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            const manager_id = req['decoded'].jsonData.id || null;
            const ext_user_id = req.body.ext_user_id || null;
            const user_id = req.body.user_id ? req.body.user_id : null;
            const due_date = req.body.due_date || null;
            const title = req.body.title || null;
            const description = req.body.description || null;
            const custom_status = req.body.custom_status || null;
            let status = req.body.status || null;

            const {
                ext_org_id,
                ext_project_id,
                project_id,
                ext_issue_id
            } = req.body;

            const data = {
                title: title,
                assignee: ext_user_id,
                custom_status: status,
                due_date: end_date,
                description: description
            }

            let validate = ZohoValidation.updateIssueValidation({
                ext_org_id,
                ext_project_id,
                project_id,
                ext_issue_id,
                title,
                ext_user_id,
                due_date,
                description,
                user_id,
                status
            });
            if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

            let new_status;
            if (status) {
                switch (status) {
                    case '4': // 1557478000000016068   //Open
                        new_status = 'Open';
                        break;
                    case '1': // 1557478000000031001   // In Progress
                        new_status = 'In Progress';
                        break;
                    case '2': // 1557478000000031007   // On Hold
                        new_status = 'On Hold';
                        break;
                    case '5': // 1557478000000031003   // In Review
                        new_status = 'In Review';
                        break;
                    case '6': // 1557478000000031005   //To be Tested
                        new_status = 'To be Tested';
                        break;
                    case '7': // 1557478000000031009    // Delayed
                        new_status = 'Delayed';
                        break;
                    case '8': //  1557478000000031011   //Cancelled
                        new_status = 'Cancelled';
                    default:
                        new_status = 'Closed'; // 1557478000000016071
                }
            }


            // const local_task = await Zoho.getTaskByExtenalId(ext_project_todo_id, project_id, admin_id);

            // if (!local_task || local_task.length === 0) return sendResponse(res, 400, null, 'Failed To Update Task!', 'Database Error.');

            const access_token = await ZohoAuth.checkaccessToken(manager_id, admin_id);
            if (!access_token) return sendResponse(res, 400, null, 'Invalid Access Token.', 'Error on access token.');

            if (status) {
                const task_layout = await ZohoHelper.taskLayout(ext_org_id, access_token, ext_project_id);
                if (!task_layout) return sendResponse(res, 400, null, 'Unable To Get Task Layout', 'Error while getting task Layout');
                const result = task_layout.status_details.find(({
                    name
                }) => name === new_status);
                data.custom_status = result.id;
            }
            const task = await ZohoHelper.updateTask(ext_org_id, access_token, ext_project_id, ext_project_todo_id, data);
            if (!task) return sendResponse(res, 400, null, 'Unable To Create Task.', 'Error while creating task.');

            if (!(Array.isArray(task.tasks))) return sendResponse(res, 400, null, task.message, task.message);

            // let new_task = await ZohoCURD.createTask(name, task_list.tasklists[0].id_string, project_id, 2);
            // const new_task = await Zoho.insertTask(task.tasks[0].name.replace(/"/g, '\\"').replace(/'/g, '\\"'), description.replace(/"/g, '\\"').replace(/'/g, '\\"') || null,
            const new_start_date = start_date ? moment(start_date, "MM-DD-YYYY").format('YYYY-MM-DD HH:mm:SS') : moment(local_task[0].start_date, "YYYY-MM-DD HH:mm:SS").format('YYYY-MM-DD');
            const new_end_date = end_date ? moment(end_date, "MM-DD-YYYY").format('YYYY-MM-DD HH:mm:SS') : moment(local_task[0].due_date, "YYYY-MM-DD HH:mm:SS").format('YYYY-MM-DD');

            const update = await ZohoCURD.updateTask(local_task[0].id, task.tasks[0].name.replace(/"/g, '\\"').replace(/'/g, '\\"'), task.tasks[0].description ? task.tasks[0].description.replace(/"/g, '\\"').replace(/'/g, '\\"') : null, new_start_date, new_end_date, status ? status : local_task[0].status, task.tasks[0].percent_complete)
            return sendResponse(res, 200, req.body, 'Task Successfully Updated.', null);

        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Create Task.', 'Error while creating task.');
        }
    }
}

module.exports = new ProjectModification;

// (
//     async () => {
//         let access_token = await ZohoAuth.checkaccessToken(null, 2);
//         console.log('==============', access_token);
//     }
// )();


// ,
//   "ext_user_id": "685743228",
//   "user_id": "277",
//   "ext_list_id": "1557478000000042011",
//   "task_list_id": "277",
//   "start_date": "03-15-2020",
//   "end_date": "03-16-2020",
//   "duration": "6",
//   "duration_type": "hrs",
//   "description": "Project Management"
// }
// console.log('===================', moment('10/29/2010', "MM/DD/YYYY").utc().format('DD-MM-YYYY'));
// console.log('===================', moment('10/29/2010', "MM/DD/YYYY").format('MM-DD-YYYY'));