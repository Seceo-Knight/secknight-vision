const router = require('express').Router();

const ProjectController = require('./project/Project.contoller');
const TaskController = require('./task/Task.controller');

class ProjectRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {

        this.myRoutes.post('/add-project', ProjectController.addProject);
        this.myRoutes.post('/get-project', ProjectController.projects);
        this.myRoutes.delete('/delete-project', ProjectController.deleteProject);
        this.myRoutes.put('/update-project', ProjectController.updateProject);
        this.myRoutes.post('/get-project-members', ProjectController.getProjectEmployess);
        this.myRoutes.post('/add-project-module', ProjectController.createProjectModule);
        this.myRoutes.post('/get-project-module', ProjectController.getProjectModule);
        this.myRoutes.put('/update-project-module', ProjectController.updaeProjectModule);
        this.myRoutes.delete('/delete-project-module', ProjectController.deleteProjectModule);
        this.myRoutes.post('/add-project-employees', ProjectController.addEmployeesToProject);
        this.myRoutes.delete('/delete-project-employees', ProjectController.deleteEmplyeesFromProject);
        this.myRoutes.post('/get-project-production-hours', ProjectController.getProductionTime);
        this.myRoutes.post('/get-project-emp-tasks', ProjectController.getProjectTaksAndEmp);
        this.myRoutes.get('/project-complete-details', ProjectController.getCompleateProjectDatils);
        this.myRoutes.get('/app-web', ProjectController.projectWebApps);
        this.myRoutes.post('/create-project', ProjectController.createProject);
        this.myRoutes.get('/get-employees-all-projects', ProjectController.getGroupsEmployeesAllProjects)




        this.myRoutes.post('/add-task', TaskController.createTask);
        this.myRoutes.post('/get-task', TaskController.getTasks);
        this.myRoutes.put('/update-task', TaskController.updateTask);
        this.myRoutes.delete('/delete-task', TaskController.deleteTask);
        this.myRoutes.get('/timesheets', TaskController.getTimesheets);
        this.myRoutes.delete('/delete-timesheet', TaskController.deleteTimesheet);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = ProjectRoutes;