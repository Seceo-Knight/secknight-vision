const router = require('express').Router();

const ZohoAuth = require('./Authentication');
const ZohoService = require('./ZohoService');
const ZohoProjects = require('./ProjectService');
const ProjectModification = require('./ProjectModification');
const ZohoUser = require('./ZohoUserManagement');

class ZohoRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.get('/authenticate', ZohoAuth.authenticate);
        this.myRoutes.post('/access-token', ZohoAuth.accessToken);
        this.myRoutes.get('/regenarate-access-token', ZohoAuth.regenarateAccessToken);
        this.myRoutes.get('/portals', ZohoService.portals);
        this.myRoutes.get('/portals-sync', ZohoService.portalsSync);
        this.myRoutes.get('/user-sync', ZohoService.userSync);
        this.myRoutes.post('/project-sync', ZohoService.projectSync);
        this.myRoutes.post('/projects-zoho', ZohoProjects.projects);
        this.myRoutes.post('/overview-zoho', ZohoProjects.overView);
        this.myRoutes.post('/tasks', ZohoProjects.tasks);
        this.myRoutes.post('/issues', ZohoProjects.issue);
        this.myRoutes.post('/due-task-issue', ZohoProjects.dueTaskAndIssue);
        this.myRoutes.post('/create-project', ProjectModification.createProject);
        this.myRoutes.delete('/delete-project', ProjectModification.deleteProject);
        this.myRoutes.post('/create-task-list', ProjectModification.createTasklist);
        this.myRoutes.put('/update-project', ZohoProjects.updateProject);
        this.myRoutes.delete('/delete-tasklist', ProjectModification.deleteTaskList);
        this.myRoutes.post('/create-task', ProjectModification.createTask);
        this.myRoutes.put('/update-task', ProjectModification.updateTask);
        this.myRoutes.delete('/delete-task', ProjectModification.deleteTask);
        this.myRoutes.post('/create-bug', ProjectModification.createBug);
        this.myRoutes.delete('/delete-bug', ProjectModification.deleteBug);
        this.myRoutes.post('/project-user', ZohoUser.projectUsers);
        this.myRoutes.post('/add-user-project', ProjectModification.addUserToProject);
        this.myRoutes.delete('/remove-user-from-project', ProjectModification.removeUserToProject);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = new ZohoRoutes;