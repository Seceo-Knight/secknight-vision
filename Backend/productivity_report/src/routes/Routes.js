'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const router = require('express').Router();
const RootIndexRoute = require('./root/Index');
const DepartmentService = require('./department/DepartmentService');
const LocationService = require('./location/LocationService');
const UserService = require('./user/UserService');
const DesktopService = require('./desktop/DesktopService');
const StorageService = require('./storages/StorageService');
const Auth = require('./admin/Auth');
const Admin = require('./admin/AdminService');
const Report = require('./reports/ReportService');
const Firewall = require('./firewall/FirewallService');
const Dashboard = require('./dashboard/DashbordService');
const UserStatsService = require('./user/UserStatsService');
const ZohoService = require('./integrations/zoho/ZohoService');
const TrelloRoutes = require('./integrations/trello/Trello.routes');
const ZohoRoutes = require('./integrations/zoho/routes');
const projectManagementRoutes = require('./projectManagement/Routes');
const UserDetails = require('./user/UserDetails');
const ResellerService = require('./reseller/ResellerService')
const AutoReport = require('./reports/AutoReportService');
const SettingsRoute = require('./settings/Routes');
const ReportsRoute = require('./reports/Routes');
const TeamLeadService = require('./user/TeamLeadService');
const EmployeeService = require('./employee/EmployeeService');
const EmployeeAuth = require('./employee/Auth');

const TimesheetController = require('./timesheet/timesheet.controller');
const UserController = require('./user/details/User.controller');
const UserActivityController = require('./user/userActivity/useractivity.controller');
const ActivityInsertController = require('./reports/productivity/insert.function');
const { ProductivtyController } = require('./reports/productivtyReport/Productivity.controller');


class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Adding all the routes here
        this.myRoutes.get('/', RootIndexRoute.entryRoute);
        this.myRoutes.post('/body', RootIndexRoute.showReqRoute);

        //Admin routes
        this.myRoutes.post('/admin-authentication', Auth.adminAuthentication);
        this.myRoutes.post('/manager-auth', Auth.managerAuth);
        this.myRoutes.post('/forgot-password', Auth.forgotPassword);
        this.myRoutes.put('/reset-password', Auth.restPassword);

        // Employee specific routes
        this.myRoutes.post('/emp/auth', EmployeeAuth.employeeAuth);
        this.myRoutes.get('/emp/user', EmployeeAuth.Employee_Authorise, EmployeeService.userDetails);
        this.myRoutes.post('/emp/log', EmployeeAuth.Employee_Authorise, EmployeeService.logDetailsRange);
        this.myRoutes.put('/emp/update-user', EmployeeAuth.Employee_Authorise, EmployeeService.updateDetails);

        // activity track routes
        // this.myRoutes.post('/reports/activity', ActivityInsertController.insertActivity);
        this.myRoutes.post('/reports/activity', ProductivtyController.insertActivity);
        this.myRoutes.post('/reports/activity2', ProductivtyController.insertActivity2);
        this.myRoutes.post('/reports/checkServerHealth', ProductivtyController.checkServerHealth);

        this.myRoutes.use(Auth.Authorise);

        this.myRoutes.get('/details', Admin.adminDetails);
        this.myRoutes.post('/admin-profile-update', Admin.updateAdminDetails);
        this.myRoutes.put('/update-interval', Admin.updateInterval);
        this.myRoutes.get('/admin-feature', Admin.getAdminFeatures);
        this.myRoutes.post('/admin-feature-update', Admin.updateAdminFeatures);

        //Department routes
        this.myRoutes.post('/create-departments', DepartmentService.createDepartment);
        this.myRoutes.post('/get-departments', DepartmentService.retrieveDepartment);
        this.myRoutes.put('/update-department', DepartmentService.updateDepartment);
        this.myRoutes.delete('/delete-department', DepartmentService.deleteDepartment);

        //Location routes
        this.myRoutes.post('/add-location', LocationService.addLocation);
        this.myRoutes.post('/get-locations', LocationService.retriveLocation);
        this.myRoutes.delete('/delete-location', LocationService.deleteLocation);
        this.myRoutes.put('/update-location', LocationService.updateLocation);
        this.myRoutes.post('/get-locations-dept', LocationService.fetchLocationWithDepartment);
        this.myRoutes.post('/get-locations-dept', LocationService.fetchLocationWithDepartment);
        // this.myRoutes.post('/add-dept-location', LocationService.addDepartmentToLocation_old);
        this.myRoutes.post('/add-department-location', LocationService.addDepartmentToLocation);
        this.myRoutes.delete('/delete-dept-location', LocationService.deleteDepartmentFromLocation);
        this.myRoutes.post('/get-department-by-location', LocationService.getDepartmentsByLocations);
        this.myRoutes.post('/add-old-dept-location-by-name', LocationService.addDepartmentToLocationName);
        this.myRoutes.post('/add-dept-location-by-name', LocationService.addNewDepartmentToLocationName);
        this.myRoutes.post('/add-multiple-dept-location-by-name', LocationService.addMultipleDepartmentToLocationName);

        //User routes
        this.myRoutes.post('/add-role', UserService.addRole);
        this.myRoutes.get('/get-role', UserService.getRole);
        this.myRoutes.post('/user-register', UserService.registerUser);
        this.myRoutes.post('/upload-profilepic', UserService.uploadProfilePic);
        this.myRoutes.post('/users-search', UserService.searchUser);
        this.myRoutes.post('/fetch-users', UserService.userList);
        this.myRoutes.post('/users', UserService.getUsers);
        this.myRoutes.post('/get-user', UserService.getSingleUserDetails);
        this.myRoutes.post('/user-register-new', UserActivityController.registerUser);
        this.myRoutes.post('/fetch-users-new', UserActivityController.userList);

        this.myRoutes.post('/get-browser-history', process.env.API_VERSION == 'v2' ? UserController.getBrowserHistory : UserService.getBrowserHistory);
        this.myRoutes.post('/application-used', process.env.API_VERSION == 'v2' ? UserController.getApplicationsUsed : UserService.userApplicationUsed);

        this.myRoutes.post('/get-browser-history-new', UserController.getBrowserHistory);
        this.myRoutes.post('/application-used-new', UserController.getApplicationsUsed);

        this.myRoutes.post('/log-detail', UserService.userLogDetails);
        this.myRoutes.post('/log-detail-kamal', UserService.userLogDetailsKamal);
        this.myRoutes.post('/log-detail-range', UserService.userLogDetailsRange);
        this.myRoutes.post('/log-detail-range-kamal', UserService.userLogDetailsRangeKamal);
        this.myRoutes.post('/top-apps', UserService.topApps);
        this.myRoutes.post('/top-websites', UserService.topWebsites);
        this.myRoutes.post('/get-keystrokes', process.env.API_VERSION == 'v2' ? UserController.getKeyStrokes : UserService.getKeyStrokes);
        this.myRoutes.post('/get-keystrokes-new', UserController.getKeyStrokes);
        this.myRoutes.post('/get-screenshots', UserService.getScreenshootParallel);
        this.myRoutes.post('/download-screenshots', UserDetails.downloadScreenshootParallel);
        this.myRoutes.post('/user-profile-update', UserService.updateProfile);
        this.myRoutes.delete('/user-delete', UserService.removeUser);
        this.myRoutes.delete('/user-delete-multiple', UserService.removeMultipleUser);
        this.myRoutes.put('/update-user-status', UserService.updateUserStatus);
        this.myRoutes.post('/assign-user-manager', UserService.assignUserToManger);
        this.myRoutes.post('/assign-user-manager-multi', UserService.assignUserToMangerMulti);
        this.myRoutes.delete('/unassign-user-manager', UserService.unassignUserToManger);
        this.myRoutes.put('/upgrade-downgrade-manager', UserService.upgradeAndDownGradeManager);
        this.myRoutes.post('/get-assigned-employee-to-manager', UserService.getAssignedEmployeeToManager);
        this.myRoutes.post('/upload-profilepic-drive', UserService.uploadProfilePic_new);
        this.myRoutes.post('/working-hours', UserService.getUserWorkingHours);
        this.myRoutes.post('/apps-activity-track', UserService.AppsActivityTrack);
        this.myRoutes.post('/browser-activity-track', UserService.browserActivityTrack);
        this.myRoutes.post('/user-register-bulk', UserDetails.userRegisterBulk);
        this.myRoutes.post('/assign-user-teamlead', TeamLeadService.assignEmployeeTeamLead);
        this.myRoutes.delete('/unassign-user-teamlead', TeamLeadService.unassignUserToTeamLead);
        this.myRoutes.post('/user-assign', UserService.assignEmpToTeamleadAndManager);

        //Desktop control related routes
        this.myRoutes.post('/desktop-settings', DesktopService.desktopControl);
        this.myRoutes.post('/desktop-settings-multi-user', DesktopService.desktopControlMultipleUser);
        this.myRoutes.post('/user-list-desktop', DesktopService.userList);

        //Storage routes
        this.myRoutes.post('/add-storage-type', StorageService.addStorageType);
        this.myRoutes.get('/get-storage-types', StorageService.getStorageTypes);
        this.myRoutes.post('/add-storage-data', StorageService.addStorageData);
        this.myRoutes.get('/get-storage-type-with-data', StorageService.getStorageDataWithsorageType);
        this.myRoutes.delete('/delete-storage-data', StorageService.deleteStorageData);
        this.myRoutes.put('/update-storage-data', StorageService.updateStorageData);
        this.myRoutes.put('/update-storage-option', StorageService.updateStorageOption);

        //Report routes
        this.myRoutes.post('/employees-list-report', Report.ReportUserList);
        this.myRoutes.post('/download-user-report', Report.downloadReport);
        this.myRoutes.get('/get-download-option', Report.getDownloadOption);
        this.myRoutes.post('/user-report', Report.MultipleUserAllReport);
        this.myRoutes.get('/production-stats', Report.getProductionStats);
        this.myRoutes.get('/auto-email', AutoReport.autoEmailData);
        this.myRoutes.put('/update-auto-email', AutoReport.updateAutoEmailReoprt);
        this.myRoutes.post('/download-user-report-multiple-users', Report.multipleUserWithMultpleReport);

        //Firewall routes
        this.myRoutes.post('/add-category', Firewall.addCategory);
        this.myRoutes.put('/update-category', Firewall.updateCategory);
        this.myRoutes.delete('/delete-category', Firewall.deleteCategory);
        this.myRoutes.get('/get-days', Firewall.getDays);
        this.myRoutes.post('/add-domain', Firewall.addDomain);
        this.myRoutes.post('/add-domain-bulk', Firewall.bulkDomainAdd);
        this.myRoutes.get('/get-category-domains', Firewall.getCategoryAndDomainData);
        this.myRoutes.get('/get-category', Firewall.getCategory);
        this.myRoutes.post('/block-user-dept-domains', Firewall.blockUserDepartmentBlock);
        this.myRoutes.post('/get-blocked-user-dept-domains', Firewall.getBlockedUserDepatment);
        this.myRoutes.post('/single-rule-blocked-user-dept-domains', Firewall.getSingleBlockedUserDepatment);
        this.myRoutes.delete('/delete-blocked-user-dept-domains', Firewall.deleteUserDepartmentBlockDetails);
        this.myRoutes.put('/update-blocked-user-dept-domains', Firewall.updateUserDepartmentBlockDetails);
        this.myRoutes.put('/update-status-blocked-user-dept-domains', Firewall.updateUserDepartmentBlockDetailsStatus);
        this.myRoutes.post('/domain-search', Firewall.domainSearch);
        this.myRoutes.put('/update-domain', Firewall.updateDomain);
        this.myRoutes.post('/user-department-domain-blocked', Firewall.UserAndDepartmentDomainUsed);
        this.myRoutes.get('/domains', Firewall.domain);
        this.myRoutes.delete('/delete-domains', Firewall.deleteDomains);
        this.myRoutes.put('/change-domain-category', Firewall.changeDomainCategory);
        this.myRoutes.post('/upload-domains', Firewall.domainUploadCSV);
        this.myRoutes.post('/upload-category-domains', Firewall.domainUploadCSVWithCategory);


        /**ip white list */
        this.myRoutes.post('/add-ip-whitelist', Firewall.addIpWhiteList);
        this.myRoutes.post('/get-ip-whitelist', Firewall.getWhiteListIps);
        this.myRoutes.post('/delete-ip-whitelist', Firewall.deleteIpFromWhitelist);
        this.myRoutes.post('/edit-ip-whitelist', Firewall.editWhitelistIp);
        this.myRoutes.post('/search-ip-whitelist', Firewall.searchWhitelistIp);

        /**Dashboard  routes*/
        this.myRoutes.get('/dashboard', Dashboard.getDashboardData);
        this.myRoutes.get('/stats', Dashboard.userStat);
        this.myRoutes.get('/absent-emp', Dashboard.getAbsentEmp);
        this.myRoutes.get('/registered-emp', Dashboard.getRegisteredEmp);
        this.myRoutes.get('/suspended-emp', Dashboard.getSuspendedEmp);
        this.myRoutes.get("/online-emp", Dashboard.getOnlineEmp);
        this.myRoutes.get("/offline-emp", Dashboard.getOfflineEmp);
        this.myRoutes.post('/dashboard-manager', Dashboard.getDashboardDataManager);
        this.myRoutes.post('/dashboard-production', Dashboard.getProductionHours);
        this.myRoutes.post('/dashboard-active-days', Dashboard.getActiveDays);
        this.myRoutes.post('/dashboard-location-hours', Dashboard.getLocationWorkHours);
        this.myRoutes.post('/dashboard-present-rate', Dashboard.getPresenceRate);

        /** Setting routes*/
        this.myRoutes.use('/settings', SettingsRoute.getRouters());

        /** Report routes*/
        this.myRoutes.use('/reports', ReportsRoute.getRouters());

        // Admin user stats
        this.myRoutes.post('/top-apps-admin', UserStatsService.topApps);
        this.myRoutes.post('/top-websites-admin', UserStatsService.topWebsites);

        // integrations
        this.myRoutes.get('/integration', ZohoService.integration);
        this.myRoutes.get('/integration-data', ZohoService.integrationData);
        this.myRoutes.delete('/delete-integration', ZohoService.deleteIntegrationData);
        this.myRoutes.use('/integrations/trello', TrelloRoutes.getRouters());
        this.myRoutes.use('/integrations/zoho', ZohoRoutes.getRouters());
        // this.myRoutes.use('/integrations/jira', JiraRoutes.getRouters());

        //Project management routes 
        this.myRoutes.use('/project-management', projectManagementRoutes.getRouters());

        this.myRoutes.post('/add-reseller-data', ResellerService.addResellerData);
        this.myRoutes.get('/get-reseller-data', ResellerService.getResellerData);

        // Timesheet routes
        this.myRoutes.post('/timesheet/user-attendance', TimesheetController.getUserAttendanceBasedOnLocationDepartment);
        this.myRoutes.post('/timesheet/user-timesheet-details', TimesheetController.getUserTimeSheetBreakUp);

        //settings routes
        this.myRoutes.post('/settings/user-tracking-setting', UserActivityController.updateEmployeeTrackSettings);
        this.myRoutes.post('/settings/get-emp-setting-trac', UserActivityController.getEmpTrackSetting);
        this.myRoutes.get('*', function (req, res) {
            res.json({
                code: 400,
                data: null,
                message: 'Not Found.',
                error: null
            });
        });

    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;