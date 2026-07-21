const axios = require('axios');
const qs = require('qs')
const moment = require('moment');

const sendResponse = require('../../../utils/myService').sendResponse;
const ZohoValidation = require('../../../rules/validation/Zoho');
const Zoho = require('../../shared/integrations/Zoho');

class ProjectService {
    async projects(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const skip = parseInt(req.body.skip) || 0;
        const limit = parseInt(req.body.limit) || 10;
        const integration_org_id = req.body.integration_org_id;

        let validate = ZohoValidation.portalIdValidation({ integration_org_id });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let projects = await Zoho.getAllProjects(manager_id, admin_id, skip, limit, integration_org_id);
        if (!projects) return sendResponse(res, 400, null, 'Unable To Get Projects.', null);
        if (projects.length === 0) return sendResponse(res, 400, null, 'Projects Not Found.', null);

        await Promise.all(projects.map(async (project) => {
            let stat = await Zoho.projectStat(project.project_id);
            project.stat = stat[0];
        }));
        let total_count = projects.length > 0 ? projects[0].total_count : 0;
        let has_more_data = (skip + limit) > total_count ? false : true;
        projects.map(e => delete e.total_count);
        return sendResponse(res, 200, { projects, has_more_data, skip_value: skip + limit, total_count }, 'Project Data', null);
    }

    async overView(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        // let admin_id = 2;
        let manager_id = req['decoded'].jsonData.id ? req['decoded'].jsonData.id : null;
        // let integration_org_id = 57;
        let integration_org_id = req.body.integration_org_id;

        let validate = ZohoValidation.portalIdValidation({ integration_org_id });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let stat = await Zoho.overView(admin_id, manager_id, integration_org_id);
        if (!stat) return sendResponse(res, 400, null, 'Unable To Get stat.', null);
        return sendResponse(res, 200, { open_task: stat[0].total_task - stat[0].closed_task, closed_task: stat[0].closed_task, open_issue: stat[0].total_issue - stat[0].closed_issue, closed_issue: stat[0].closed_issue }, 'Orgnization stat.', null);
    }

    async issue(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const is_project_id = req.body.project_id ? true : false;
        const is_status = req.body.status ? true : false;
        const { project_id, status } = req.body;
        const skip = parseInt(req.body.skip) || 0
        const limit = parseInt(req.body.limit) || 10

        let validate = ZohoValidation.projectIdOnlyValidation({ project_id });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let issues = await Zoho.issues(admin_id, manager_id, status, skip, limit, is_project_id, is_status, project_id);
        if (!issues) return sendResponse(res, 400, null, 'Unable To Get issue.', null);

        if (issues.length === 0) return sendResponse(res, 400, null, 'Issues Not Found', null);

        let total_count = issues.length > 0 ? issues[0].total_count : 0;
        let has_more_data = (skip + limit) > total_count ? false : true;
        issues.map(e => delete e.total_count);
        return sendResponse(res, 200, { issues, has_more_data, skip_value: skip + limit, total_count }, 'Issue Data.', null);
    }

    async updateProject(req, res) {
        let { access_token, portal_id, project_name, project_id, status } = req.body;
        let data = { name: project_name, status: status };

        let validate = ZohoValidation.projectValidation({ access_token, portal_id, project_id, project_name, status });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        let url = `https://projectsapi.zoho.com/restapi/portal/${portal_id}/projects/${project_id}`
        axios.post(url, qs.stringify(data), { headers: { Authorization: 'Bearer ' + access_token }, 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' })
            .then((response) => {
                return sendResponse(res, 200, response.data, 'Project Data Updated Successfully.', null);
            })
            .catch((error) => {
                return sendResponse(res, 400, null, 'Unable To Update Project.', error);
            })
    }

    async tasks(req, res) {

        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const { project_id, project_list_id } = req.body;
        const is_status = req.body.status ? true : false;
        const status = req.body.status ? req.body.status : 0;
        const skip = parseInt(req.body.skip) || 0;
        const limit = parseInt(req.body.limit) || 10;

        let validate = ZohoValidation.tasksValidation({ project_id, project_list_id, status });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        if (project_list_id) {
            let task = await Zoho.projectTODO(admin_id, manager_id, status, is_status, project_list_id, skip, limit);
            if (!task) return sendResponse(res, 400, null, 'Unable to get tasks', 'Database Error.');

            let total_count = task.length > 0 ? task[0].total_count : 0;
            let has_more_data = (skip + limit) > total_count ? false : true;
            task.map(e => delete e.total_count);
            if (task.length === 0) return sendResponse(res, 400, null, 'Tasks Not Found.', null);
            return sendResponse(res, 200, { task, has_more_data, total_count }, 'Task Data.', null);
        } else if (project_id) {
            let result = [];
            let task_list = await Zoho.projectList(manager_id, admin_id, project_id);
            if (!task_list) return sendResponse(res, 400, null, 'Unable to get tasks', 'Database Error.');

            if (task_list.length === 0) return sendResponse(res, 400, null, 'Tasks Not Found', null);

            let list = await Promise.all(task_list.map(async (item) => {
                let task = await Zoho.projectTODO(2, null, 0, false, item.project_list_id, skip, limit);

                let total_count = task.length > 0 ? task[0].total_count : 0;
                let has_more_data = (skip + limit) > total_count ? false : true;
                task.map(e => delete e.total_count);

                result.push({ project_list: item, tasks: task, total_count, has_more_data });
            }))
            return sendResponse(res, 200, result, 'Task Data.', null);
        } else {
            let tasks = await Zoho.unicProjectsWithTasks(manager_id, admin_id);
            if (!tasks) return sendResponse(res, 400, null, 'Unable to get tasks', 'Database Error.');

            return sendResponse(res, 200, tasks, 'Task Data.', null);
        }
    }

    async dueTaskAndIssue(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        const manager_id = req['decoded'].jsonData.id || null;
        const today = moment().utc().format('YYYY-MM-DD');
        const integration_org_id = req.body.integration_org_id;
        const is_project_id = req.body.project_id ? true : false;
        const project_id = req.body.project_id ? req.body.project_id : null;

        let validate = ZohoValidation.dueTaskAndBudValidation({ integration_org_id, project_id });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        try {
            Promise.all([
                Zoho.todayDueTask(admin_id, manager_id, today, integration_org_id, project_id, is_project_id),
                Zoho.todayDueIssue(admin_id, manager_id, today, integration_org_id, project_id, is_project_id),
                Zoho.overDueTasks(manager_id, admin_id, integration_org_id, today, project_id, is_project_id),
                Zoho.overDueIssue(manager_id, admin_id, integration_org_id, today, project_id, is_project_id)
            ]).then((result) => {
                return sendResponse(res, 200, { task_due_today: result[0], issue_due_today: result[1], over_due_task: result[2], over_due_issue: result[3] }, 'Today Due and Over Due Data.', null);
            });
        } catch (err) {
            return sendResponse(res, 400, null, 'Unable To Get Today Due And Over Due Data.', 'Database Error.');
        }
    }

}

module.exports = new ProjectService;
