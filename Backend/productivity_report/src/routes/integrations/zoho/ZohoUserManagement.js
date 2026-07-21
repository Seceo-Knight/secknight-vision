const User = require('../../shared/integrations/User');
const ZohoCURD = require('../../shared/integrations/ZohoCURD');
const ZohoValidation = require('../../../rules/validation/Zoho');
const sendResponse = require('../../../utils/myService').sendResponse;
class ZohoUserManagement {
    async projectUsers(req, res) {
        const project_id = req.body.project_id;

        let validate = ZohoValidation.projectIdOnlyValidation({
            project_id
        });
        if (validate.error) return sendResponse(res, 404, null, 'Validation failed', validate.error.details[0].message);

        const users = await ZohoCURD.projectUsers(project_id);
        if (users.length === 0) return sendResponse(res, 400, null, 'User Not Found.', 'User not found error.');
        return sendResponse(res, 200, users, 'User Data.', null);
    }

    async AddUser_old(admin_id, name, email, ext_user_id, ext_org_id) {
        let location_id;
        let department_id;
        let user = await User.userBymail(email);
        if (user.length > 0) {
            let portal_user = await User.checkPortalUser(user[0].id, admin_id);
            if (!portal_user) return 0;
            if (portal_user.length > 0) return 1;
            let new_portal_user = await User.registerPortalUser(admin_id, user[0].id, ext_org_id, ext_user_id);
            if (!new_portal_user) return 0;
            return 1;
        } else {
            let location = await User.getLocationByName('NA', admin_id);
            if (!location) return 0;
            if (location.length === 0) {
                let new_location = await User.addLocation('NA', admin_id);
                if (!location) return 0;
                location_id = new_location.insertId;
            } else {
                location_id = location[0].id;
            }

            let department = await User.getDepartmentByName(admin_id, 'NA');
            if (!department) return 0;
            if (department.length === 0) {
                let new_department = await User.createDepartment(admin_id, 'NA');
                if (!department) return 0;
                department_id = new_department.insertId
            } else {
                department_id = department[0].id;
            }

            let new_user = await User.registerUser(name, null, email, '587d3a4e7862291989e2e8e62660d551:af71bd1baf787308441b8323af99777b', null, null, null, location_id, department_id, '/default/profilePic/user.png', null, 1, 1, admin_id, 5, ext_user_id);
            if (!new_user) return 0;
            let new_portal_user = await User.registerPortalUser(admin_id, new_user.insertId, ext_org_id, ext_user_id);
            if (!new_portal_user) return 0;
            return 1;
        }
    }

    async AddUser(admin_id, name, email, ext_user_id, ext_org_id) {
        let location_id;
        let department_id;
        let user = await User.userBymail(email);
        if (user.length > 0) {
            return user[0].id
        } else {
            let location = await User.getLocationByName('NA', admin_id);
            if (!location) return null;
            if (location.length === 0) {
                let new_location = await User.addLocation('NA', admin_id);
                if (!location) return null;
                location_id = new_location.insertId;
            } else {
                location_id = location[0].id;
            }

            let department = await User.getDepartmentByName(admin_id, 'NA');
            if (!department) return null;
            if (department.length === 0) {
                let new_department = await User.createDepartment(admin_id, 'NA');
                if (!department) return null;
                department_id = new_department.insertId
            } else {
                department_id = department[0].id;
            }

            let new_user = await User.registerUser(name, null, email, '587d3a4e7862291989e2e8e62660d551:af71bd1baf787308441b8323af99777b', null, null, null, location_id, department_id, '/default/profilePic/user.png', null, 1, 1, admin_id, 5, ext_user_id);
            if (!new_user) return null;
            return new_user.insertId;
        }
    }

}

module.exports = new ZohoUserManagement;
// (async () => {
//     let location_id;
//     let department_id;
//     let user = await User.userBymail('basavarajshiralashetti1@globussoft.in');
//     if (user.length > 0) return 1;

//     let location = await User.getLocationByName('NA', 2);
//     if (!location) return 0;
//     if (location.length === 0) {
//         let new_location = await User.addLocation('NA', 2);
//         if (!location) return 0;
//         location_id = new_location.insertId;
//     } else {
//         location_id = location[0].id;
//     }

//     let department = await User.getDepartmentByName(2, 'NA');
//     if (!department) return 0;
//     if (department.length === 0) {
//         let new_department = await User.createDepartment(2, 'NA');
//         if (!department) return 0;
//         department_id = new_department.insertId
//     } else {
//         department_id = department[0].id;
//     }

//     // let new_user = await User.registerUser('name', null, 'email', '587d3a4e7862291989e2e8e62660d551:af71bd1baf787308441b8323af99777b', null, null, null, location_id, department_id, '/default/profilePic/user.png', null, 1, 1, 2);

//     return;
//     // let new_user=await Zoho.
// })