'use strict';
const router = require('express').Router();
const internalProjectManagement = require('./project.controller');


const customizationProjectTask = (req, res, next) => {
    if([1,].includes(req.decoded.organization_id)) return next();
    else {
        return res.status(200).json({
            status: false,
            message: 'You are not allowed to access this resource.'
        });
    }
}

class ProjectModule {
    constructor() {
        this.routes = router;
        this.core();
    }

    core() {
        this.routes.get("/get-projects", customizationProjectTask, internalProjectManagement.projects);
        this.routes.get('/get-tasks/:project_id', customizationProjectTask, internalProjectManagement.tasks);
        this.routes.post('/add-task-stats', customizationProjectTask, internalProjectManagement.insertProjectTaskStat);
        this.routes.put('/update-task', customizationProjectTask, internalProjectManagement.updateTask);
        this.routes.get('/get-task-stats', customizationProjectTask, internalProjectManagement.getTaskStat);
        // this.routes.post('/add-employee-time-track', internalProjectManagement.addEmployeeTimeTrack);
        // this.routes.get('/get-employee/:from_date/time/:to_date/track', internalProjectManagement.getTimeTrack);
        this.routes.post('/create-project-task', customizationProjectTask, internalProjectManagement.createTask);
        this.routes.get('/get-projects-tasks', customizationProjectTask, internalProjectManagement.getProjectsWithTask);

        /* API Routes for SIlah Project Task API */
        this.routes.get('/get-project-silah', internalProjectManagement.getProjectSilah);
        this.routes.get('/get-project-folder-silah', internalProjectManagement.getProjectFolderSilah);
        this.routes.get('/get-project-task-silah', internalProjectManagement.getProjectTaskSilah);
        this.routes.post('/create-project-tasks', internalProjectManagement.createProjectTask);
        this.routes.post('/update-project-task', internalProjectManagement.updateProjectTask);
        this.routes.delete('/delete-project-task', internalProjectManagement.deleteProjectTask);
        this.routes.get('/start-project-task', internalProjectManagement.startProjectTask);
        this.routes.get('/stop-project-task', internalProjectManagement.stopProjectTask);
        this.routes.get('/finish-project-task', internalProjectManagement.finishedProjectTask);
        this.routes.post('/add-remaining-time', internalProjectManagement.addRemainingTime);

    }

    getRouters() {
        return this.routes;
    }
}

module.exports = ProjectModule;