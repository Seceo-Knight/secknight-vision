const permissionConstants = require('./permision.constants');

class Permission_Accessibility {

    async Employee_Browse(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_browse) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Create(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_create) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Modify(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_modify) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Delete(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_delete) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Assign_Employee(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_assign_employee) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Change_Role(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_change_role) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Screenshot_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_screenshot_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Screenshot_Delete(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_screenshot_delete) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Screenshot_Download(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_screenshot_download) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Web_Usage_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_web_usage_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Web_Usage_Delete(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_web_usage_delete) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Web_Usage_Download(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_web_usage_download) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Application_Usage_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_application_usage_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Application_Usage_Delete(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_application_usage_delete) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Application_Usage_Download(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_application_usage_download) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Keystrokes_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_keystrokes_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Keystrokes_Delete(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_keystrokes_delete) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Employee_Keystrokes_Download(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.employee_keystrokes_download) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Dashboard_Registered_Users_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.dashboard_registered_users_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Dashboard_Online_Users_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.dashboard_online_users_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Dashboard_Offline_Users_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.dashboard_offline_users_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Dasboard_Absent_Users_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.dashboard_absent_users_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Dashboard_Total_Productivity_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.dashboard_total_productivity_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }

    async Dashboard_Total_Non_Productivity_View(req, res, next) {
        if (req.decoded.permissionData.includes(permissionConstants.dashboard_total_non_productivity_view) || req.decoded.is_admin)
            next();
        else return res.status(401).json({ code: 401, error: 'Unautherized access', message: 'You are not allowed to access this route', data: null });
    }
}

module.exports = new Permission_Accessibility;