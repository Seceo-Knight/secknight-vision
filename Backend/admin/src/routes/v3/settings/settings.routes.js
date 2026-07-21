'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const router = require('express').Router();
const SettingsController = require('./settings.controller');
const Role = require('./role-permission/Role.controller');
const ProductivityRanking = require('./productivity-ranking/ProductivityRanking.controller');
const Category = require('./category/Category.controller')
const { Controller } = require('./activityrequest/controller');
const { ResellerRoutes } = require('./reseller/Reseller.Routes');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Adding all the routes here
        this.myRoutes.post('/user-tracking-setting', SettingsController.updateEmployeeTrackSettings);
        this.myRoutes.post('/get-emp-setting-trac', SettingsController.getEmpTrackSetting);
        this.myRoutes.get('/options', SettingsController.settingOptions);

        this.myRoutes.post('/group-web-blocking', SettingsController.groupWebBlocking);
        this.myRoutes.get('/get-group-web-blocking', SettingsController.getGroupWebBlocking);
        this.myRoutes.post('/group-app-blocking', SettingsController.groupAppBlocking);
        this.myRoutes.get('/get-group-app-blocking', SettingsController.getGroupAppBlocking);

        this.myRoutes.get('/get-uninstall-password', SettingsController.getUninstallPassword);
        this.myRoutes.post('/update-uninstall-password', SettingsController.updateUninstallPassword);
        this.myRoutes.put('/update-agent-notification-status', SettingsController.updateAgentNotificationStatus);
        this.myRoutes.get('/get-agent-notification-status', SettingsController.getAgentNotificationStatus);

        // Productivity Ranking
        this.myRoutes.get('/productivity-rankings', ProductivityRanking.getProductivityRanking);
        this.myRoutes.put('/productivity-ranking', ProductivityRanking.updateProductivityRanking);
        this.myRoutes.post('/download-productivity-ranking', ProductivityRanking.downloadProductivityRanking);
        this.myRoutes.post('/upload-productivity-ranking', ProductivityRanking.bulkUpdateProductivityRankingCSV);
        this.myRoutes.post('/add-url', ProductivityRanking.addUrl);
        this.myRoutes.post('/add-url-bulk', ProductivityRanking.addUrlBulk);


        // Role Permission
        this.myRoutes.get('/roles', Role.getRolesWithPermissions);
        this.myRoutes.put('/role', Role.editRolePermissionAndLocation);
        this.myRoutes.get('/role/permissions', Role.getPermissions);
        this.myRoutes.delete('/role', Role.deleteRolePermission);
        this.myRoutes.post('/add-HRMS-Role',Role.postHRMSPermission);
        this.myRoutes.post('/add-role', Role.addRole);
        this.myRoutes.post('/clone-role',Role.rolesCopy);


        this.myRoutes.post('/role', Role.addRolePermission);

        // this.myRoutes.get('/role/permission', Role.getRolePermissions);

        //Categories 
        this.myRoutes.get('/category', Category.getOrgCategories);
        this.myRoutes.get('/category-web-apps', Category.getCategoryWebApps);
        this.myRoutes.put('/category-productivity-ranking', Category.updateCategoryProductivity);
        this.myRoutes.get('/category-list', Category.getCategories);

        // Activity requests routes
        this.myRoutes.post('/activity-request/create', Controller.create);
        // this.myRoutes.put('/activity-request/process', Controller.alterActivity);
        this.myRoutes.get('/activity-request/get', Controller.get);
        this.myRoutes.put('/activity-request/update', Controller.update);
        this.myRoutes.delete('/activity-request/delete', Controller.delete);
        this.myRoutes.get('/activity', Controller.getActivities);
        this.myRoutes.get('/activity-request/notification', Controller.getRequestCount)
        this.myRoutes.get('/get-auto-time-claim-status', Controller.getAutoTimeClaimStatus);
        this.myRoutes.put('/update-auto-time-claim-status', Controller.updateAutoTimeClaimStatus);

        this.myRoutes.post('/offline-activity/create', Controller.createOffline)
        this.myRoutes.post('/offline-activity/create-request', Controller.createOfflineRequestNew)
        this.myRoutes.post('/offline-activity/update', Controller.updateOfflineRequest)
        this.myRoutes.post('/offline-activity/update-request', Controller.updateOfflineRequestNew)
        this.myRoutes.get('/offline-activity-breakdown', Controller.getOfflineBreakdown)
        this.myRoutes.post('/accept-multiple-time-claim', Controller.acceptMultipleTimeClaim);

        /* Routes for New Attendance Time Claim Feature */
        this.myRoutes.post('/attendance-request/create', Controller.createAttendanceRequest);
        this.myRoutes.delete('/attendance-request/delete', Controller.deleteAttendanceRequest);
        this.myRoutes.post('/attendance-request/update', Controller.updateAttendanceRequest);
        this.myRoutes.post('/attendance-request/create-by-manager', Controller.createAttendanceRequestForEmployeesByAdminManager);

        this.myRoutes.get('/break-request/get',Controller.getRequests)
        this.myRoutes.post('/break-request/update',Controller.updateBreakRequests)
        this.myRoutes.delete('/break-request/delete', Controller.deleteBreakRequests)

        this.myRoutes.get('/reason/fetch', Controller.fetchOrgTimeclaimReason);
        this.myRoutes.post('/reason/create', Controller.createOrgTimeclaimReason);
        this.myRoutes.delete('/reason/delete', Controller.deleteOrgTimeclaimReason);

        this.myRoutes.get('/time-line', Controller.getTimelineEmployeeWise);
        this.myRoutes.delete('/time-line', Controller.deleteTimeline);
        this.myRoutes.get('/time-line-history', Controller.getDeleteTimelineHistory);
        this.myRoutes.get('/time-line-organization', Controller.getTimelineHistory);

        this.myRoutes.use('/', new ResellerRoutes().getRoutes());

    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;