'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const router = require('express').Router();
const UserActivityController = require('./useractivity.controller');
const PermissionsMiddleware = require('../permissions/permission.middlewares');

const { APIRateLimiter } = require("./SevenHoursRate.middleware");

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Adding all the routes here
        this.myRoutes.post('/user-register', UserActivityController.registerUser);
        this.myRoutes.post('/user-profile-update', UserActivityController.updateProfile);
        this.myRoutes.post('/fetch-users', UserActivityController.userList);
        this.myRoutes.post('/fetch-employee', UserActivityController.userListCustom);
        this.myRoutes.post('/fetch-all-employees', UserActivityController.userListCustom);
        this.myRoutes.post('/users', UserActivityController.getUsers);
        this.myRoutes.post('/get-user', UserActivityController.getSingleUserDetails);
        this.myRoutes.delete('/user-delete-multiple', UserActivityController.removeMultipleUser);
        this.myRoutes.put('/update-user-status', UserActivityController.updateUserStatus);
        this.myRoutes.post('/user-register-bulk', UserActivityController.userRegisterBulk);
        this.myRoutes.post('/user-delete-bulk', UserActivityController.userDeleteBulk);
        this.myRoutes.post('/bulk-update', UserActivityController.bulkUpdateEmployee);
        this.myRoutes.put('/upgrade-downgrade-user', UserActivityController.upgradeAndDownGradeUser);
        this.myRoutes.post('/user-assign', UserActivityController.assignUser);
        this.myRoutes.post('/employee-assign', UserActivityController.assignEmployee);
        this.myRoutes.post('/get-assigned-employee', UserActivityController.getEmployeeeAssigined);
        this.myRoutes.delete('/unassign-user', UserActivityController.unassignUser);
        this.myRoutes.post('/get-screenshots', UserActivityController.getScreenshootParallel);
        this.myRoutes.post('/get-screenshots-new', UserActivityController.getScreenshootParallel_new_good);
        this.myRoutes.post('/get-screen-records', UserActivityController.getScreenRecords);
        this.myRoutes.post('/upload-profilepic-drive', UserActivityController.uploadProfilePic);
        this.myRoutes.put('/update-user', UserActivityController.updateDetails);
        this.myRoutes.post('/employee-assigned-to', UserActivityController.employeeAssignedTo);
        this.myRoutes.post('/employee-list', UserActivityController.employeeListWithAssigned);
        this.myRoutes.get('/removed-user-list', UserActivityController.removedUsersList);
        this.myRoutes.put('/assign-shift-bulk-employees', UserActivityController.assignShift);
        this.myRoutes.get('/get-non-admin', UserActivityController.getNonAdmin);
        this.myRoutes.post('/get-emp-users',UserActivityController.fetchUsers);
        this.myRoutes.post('/wm-register',UserActivityController.registerAdmin);
        this.myRoutes.post('/wm-user',UserActivityController.updateWorkmanagementStatus);
        this.myRoutes.post('/add-field-users',UserActivityController.addFieldUsers);
        this.myRoutes.post('/fieldAllEmployeeList',UserActivityController.fieldAllEmployeeList);
        this.myRoutes.get('/filter-employees', UserActivityController.filterEmployees);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;