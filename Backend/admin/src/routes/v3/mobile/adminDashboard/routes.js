'use strict';

const router = require('express').Router();
const adminDashboard = require('./adminDashboard.controller');
const authMiddleware = require('../auth/auth.middleware');

class AuthModule {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {

        // All below routes for Project Crud Operations Dashboard
        this.myRoutes.post('/create-project', authMiddleware.authenticate, adminDashboard.createProject);
        this.myRoutes.put('/update-project', authMiddleware.authenticate, adminDashboard.updateProject);
        this.myRoutes.delete('/delete-project', authMiddleware.authenticate, adminDashboard.deleteProject);
        this.myRoutes.get('/fetch-project', authMiddleware.authenticate, adminDashboard.fetchProject);
        this.myRoutes.post('/assign-employee-project', authMiddleware.authenticate, adminDashboard.assignEmployeeProject);
        this.myRoutes.post('/remove-employee-project', authMiddleware.authenticate, adminDashboard.removeEmployeeProject);
        this.myRoutes.get('/view-project-assigned-employee', authMiddleware.authenticate, adminDashboard.viewAssignEmployee);
        this.myRoutes.get('/project-employee-wise', authMiddleware.authenticate, adminDashboard.fetchProjectEmployeeWise);

        //* Fetch Project API for Mobile App
        this.myRoutes.get('/fetch-project-mobile', authMiddleware.authenticateMobile, adminDashboard.fetchProjectMobile);

        // All below routes for Folders Crud Operations Dashboard
        this.myRoutes.post('/create-project-folder', authMiddleware.authenticate, adminDashboard.createProjectFolder);
        this.myRoutes.put('/update-project-folder', authMiddleware.authenticate, adminDashboard.updateProjectFolder);
        this.myRoutes.delete('/delete-project-folder', authMiddleware.authenticate, adminDashboard.deleteProjectFolder);
        this.myRoutes.get('/fetch-project-folder', authMiddleware.authenticate, adminDashboard.fetchProjectFolder);

         //* Fetch Project Folder API for Mobile App
        this.myRoutes.get('/fetch-project-folder-mobile', authMiddleware.authenticateMobile, adminDashboard.fetchProjectFolder);

        //* All below routes for Tasks Crud Operations Dashboard
        this.myRoutes.post('/create-project-task', authMiddleware.authenticate, adminDashboard.createProjectTask);
        this.myRoutes.post('/bulk-create-project-task', authMiddleware.authenticate, adminDashboard.bulkCreateProjectTask);
        this.myRoutes.post('/bulk-create-project', authMiddleware.authenticate, adminDashboard.bulkCreateProject);
        this.myRoutes.put('/update-project-task', authMiddleware.authenticate, adminDashboard.updateProjectTask);
        this.myRoutes.delete('/delete-project-task', authMiddleware.authenticate, adminDashboard.deleteProjectTask);
        this.myRoutes.get('/fetch-project-task', authMiddleware.authenticate, adminDashboard.fetchProjectTask);
        this.myRoutes.get('/fetch-task-list', authMiddleware.authenticate, adminDashboard.fetchTaskList);
        this.myRoutes.get('/fetch-task-list-multiple-employee', authMiddleware.authenticate, adminDashboard.fetchTaskListMultipleEmployee);
        this.myRoutes.get('/fetch-task-list-attendance-claim', authMiddleware.authenticate, adminDashboard.fetchTaskListAttendanceClaim);
        this.myRoutes.get('/fetch-task-list-download', authMiddleware.authenticate, adminDashboard.fetchTaskListDownload);
        this.myRoutes.get('/fetch-task-list-download-multiple-employee', authMiddleware.authenticate, adminDashboard.fetchTaskListDownloadMultipleEmployee);
        this.myRoutes.get('/fetch-task-list-download-non-consolidated', authMiddleware.authenticate, adminDashboard.fetchTaskListDownloadNonConsolidated);
        this.myRoutes.get('/fetch-task-list-download-non-consolidated-multiple-employee', authMiddleware.authenticate, adminDashboard.fetchTaskListDownloadNonConsolidatedMultipleEmployee);
        this.myRoutes.get('/fetch-project-details', authMiddleware.authenticate, adminDashboard.fetchProjectDetails);
        this.myRoutes.post('/assign-employee-task', authMiddleware.authenticate, adminDashboard.assignEmployeeTask);
        this.myRoutes.delete('/remove-assign-employee-task', authMiddleware.authenticate, adminDashboard.removeAssignEmployeeTask);
        this.myRoutes.post('/task-assign-to-employee', authMiddleware.authenticate, adminDashboard.taskAssignEmployee);

        //* Project Task API for Mobile App
        this.myRoutes.post('/create-project-task-mobile', authMiddleware.authenticateMobile, adminDashboard.createProjectTaskTaskMobile);
        this.myRoutes.put('/update-project-task-mobile', authMiddleware.authenticateMobile, adminDashboard.updateProjectTaskMobile);
        this.myRoutes.delete('/delete-project-task-mobile', authMiddleware.authenticateMobile, adminDashboard.deleteProjectTask);
        this.myRoutes.post('/delete-project-task-multiple-mobile', authMiddleware.authenticateMobile, adminDashboard.deleteProjectTaskMultiple);
        this.myRoutes.get('/fetch-project-task-mobile', authMiddleware.authenticateMobile, adminDashboard.fetchProjectTaskMobile);
        this.myRoutes.get('/fetch-project-task-mobile-list', authMiddleware.authenticateMobile, adminDashboard.fetchTaskListMobile);
        this.myRoutes.get('/start-project-task-mobile', authMiddleware.authenticateMobile, adminDashboard.startProjectTaskMobile);
        this.myRoutes.get('/stop-project-task-mobile', authMiddleware.authenticateMobile, adminDashboard.stopProjectTaskMobile);
        this.myRoutes.get('/finish-project-task-mobile', authMiddleware.authenticateMobile, adminDashboard.finishProjectTaskMobile);
        this.myRoutes.post('/finish-project-task-multiple-mobile', authMiddleware.authenticateMobile, adminDashboard.finishProjectTaskMultipleMobile);
        this.myRoutes.post('/add-task-reminder', authMiddleware.authenticateMobile, adminDashboard.addTaskReminder);
        //* Get Dashboard Stats for Self
        this.myRoutes.get('/get-dashboard-stats', authMiddleware.authenticateMobile, adminDashboard.getWeeklyTaskDetail);

        //* Get assigned users status, get assigned user list, get dashboard stats of assigned users
        this.myRoutes.get('/get-assigned-user-status', authMiddleware.authenticateMobile, adminDashboard.getAssignedUserStatus);
        this.myRoutes.get('/get-assigned-user-list', authMiddleware.authenticateMobile, adminDashboard.getAssignedUserList);
        this.myRoutes.get('/get-assigned-dashboard-stats', authMiddleware.authenticateMobile, adminDashboard.getDashboardStatsAssignedEmployees);

        this.myRoutes.get('/get-task-details', authMiddleware.authenticate, adminDashboard.getTaskDetail);

        this.myRoutes.get('/current-localization-status', authMiddleware.authenticateMobile, adminDashboard.getCurrentLocalizationStatus)
        this.myRoutes.get('/update-localization-status', authMiddleware.authenticateMobile, adminDashboard.updateCurrentLocalizationStatus)

        
        this.myRoutes.use(authMiddleware.authenticate);
        /* New Endpoints to control project task from the employee respective dashboard in Web App  */
        this.myRoutes.get('/get-project-silah', adminDashboard.getProjectSilah);
        this.myRoutes.get('/get-project-folder-silah', adminDashboard.getProjectFolderSilah);
        this.myRoutes.get('/get-project-task-silah', adminDashboard.getProjectTaskSilah);
        this.myRoutes.post('/create-project-tasks', adminDashboard.createProjectTaskNew);
        this.myRoutes.post('/update-project-task-employee', adminDashboard.updateProjectTaskNew);
        this.myRoutes.delete('/delete-project-task-employee', adminDashboard.deleteProjectTaskNew);
        this.myRoutes.get('/start-project-task', adminDashboard.startProjectTask);
        this.myRoutes.get('/stop-project-task', adminDashboard.stopProjectTask);
        this.myRoutes.get('/finish-project-task', adminDashboard.finishedProjectTask);
        this.myRoutes.post('/add-remaining-time', adminDashboard.addRemainingTime);
        this.myRoutes.get('/assign-all-employee-to-all-projects', adminDashboard.assignAllEmployeeToAllProjects);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = AuthModule;