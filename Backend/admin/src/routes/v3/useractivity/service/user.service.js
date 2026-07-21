const _ = require('underscore');

const UserModel = require('../useractivity.model');
const { sendResponse } = require('../../../../utils/myService');
const UserValidation = require('../useractivity.validation');
const PasswordEncodeDecoder = require('../../../../utils/helpers/PasswordEncoderDecoder');
const { userMessages } = require("../../../../utils/helpers/LanguageTranslate");
const useractivityModel = require('../useractivity.model');
const ConfigData = require("../../../../../../config/config");

class UserService {
    async employeeListWithAssigned(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;
            const department_id = req.body.department_id;
            const location_id = req.body.location_id || 0;
            const role_id = req.body.role_id;
            const project_name=req.body.project_name;
            const name = req.body.name;
            const emp_ids = req.body.employee_ids || [];
            const status = req.body.status || null;
            const employee_id = req.decoded.employee_id || req.body.non_admin_id || null ;
            const employee_role_id = req.decoded.role_id || null;

            const validate = UserValidation.usersValidataion({ department_id: department_id, location_id: location_id, role_id: role_id, name: name, employee_ids: emp_ids,project_name:project_name });
            if (validate.error) return sendResponse(res, 404, null, userMessages.find(x => x.id === "2")[language] || userMessages.find(x => x.id === "2")["en"], validate.error.details[0].message);

            let users = await UserModel.userListNoLimit(organization_id, location_id, department_id, role_id, name, emp_ids, status, employee_id, employee_role_id);
            if (users.length === 0) return sendResponse(res, 400, null, userMessages.find(x => x.id === "7")[language] || userMessages.find(x => x.id === "7")["en"], null);

            const employee_ids = _.pluck(users, 'id');
            const user_roles = await UserModel.getRolesByUserId(employee_ids)
            users = users.map(itr => ({ ...itr, roles: user_roles.filter(i => i.id == itr.id).map(x => ({ role_id: x.role_id, role: x.role, role_type: x.role_type })) }));

            const assignData = await UserModel.getAssignRole(employee_ids);
            await Promise.all(
                users.map(async (employee) => {
                    if (employee.password && employee.password !== 'null' && employee.password !== ' ') {
                        employee.encriptedpassword = employee.password;
                        employee.password = await PasswordEncodeDecoder.decryptText(employee.password, process.env.CRYPTO_PASSWORD);
                    }
                    const data = assignData.filter(obj => { return obj.employee_id === employee.id });
                    if (data) {
                        employee.assigned = data;
                    } else {
                        employee.assigned = [];
                    }
                }))

            if(ConfigData.EMPLOYEE_DETAILS_LAST_LOGIN.includes(+organization_id)) {
                let userIds = _.pluck(users, 'id');
                let employeeAttendance = await useractivityModel.getEmployeeLastAttendance(userIds);
                users = users.map(user => {
                    let attendance = employeeAttendance.find(att => att.id === user.id);
                    return {
                        ...user,
                        last_login: attendance ? attendance.end_time : null
                    }
                })
            }
            return sendResponse(res, 200, users, userMessages.find(x => x.id === "8")[language] || userMessages.find(x => x.id === "8")["en"], null);
        } catch (err) {
            console.log('--------', err);
            next(err);
        }
    }

    async fieldAllEmployeeList(req, res, next) {
        try {
            const organization_id = req.body.orgId;
            const language = 'en';
            const department_id = req.body.department_id;
            const location_id = req.body.location_id || 0;
            const role_id = req.body.role_id;
            const name = req.body.name;
            const project_name=req.body.project_name;
            const emp_ids = req.body.employee_ids || [];
            const status = req.body.status || null;
            const employee_id = req.body.non_admin_id || null ;
            const employee_role_id = req.body.role_id || null;
            const skip = req.body.skip;
            const limit = req.body.limit;
            const validate = UserValidation.usersValidataion({ department_id: department_id, location_id: location_id, role_id: role_id, name: name, employee_ids: emp_ids,project_name:project_name });
            if (validate.error) return sendResponse(res, 404, null, userMessages.find(x => x.id === "2")[language] || userMessages.find(x => x.id === "2")["en"], validate.error.details[0].message);
            let users = await UserModel.userListNoLimitField(skip,limit,organization_id, location_id, department_id, role_id, name, emp_ids, status, employee_id, employee_role_id);
            if (users.length === 0) return sendResponse(res, 400, null, userMessages.find(x => x.id === "7")[language] || userMessages.find(x => x.id === "7")["en"], null);
            const employee_ids = _.pluck(users, 'id');
            const user_roles = await UserModel.getRolesByUserId(employee_ids)
            users = users.map(itr => ({ ...itr, roles: user_roles.filter(i => i.id == itr.id).map(x => ({ role_id: x.role_id, role: x.role, role_type: x.role_type })) }));
            const assignData = await UserModel.getAssignRole(employee_ids);
            await Promise.all(
                users.map(async (employee) => {
                    if (employee.password && employee.password !== 'null' && employee.password !== ' ') {
                        employee.encriptedpassword = employee.password;
                        employee.password = await PasswordEncodeDecoder.decryptText(employee.password, process.env.CRYPTO_PASSWORD);
                    }
                    const data = assignData.filter(obj => { return obj.employee_id === employee.id });
                    if (data) {
                        employee.assigned = data;
                    } else {
                        employee.assigned = [];
                    }
                }))
            return sendResponse(res, 200, users, userMessages.find(x => x.id === "8")[language] || userMessages.find(x => x.id === "8")["en"], null);
        } catch (err) {
            next(err);
        }
    }

    async removedUserList(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;
            const validate = UserValidation.removedUsers(req.query);
            if (validate.error) return sendResponse(res, 404, null, 'Validation error.', validate.error.details[0].message);
            const { fromDate, toDate, skip = 0, limit, sortColumn, sortOrder, search } = validate.value;

            const userList = await UserModel.removedUsers({ organization_id, fromDate, toDate, skip, search, limit, sortColumn, sortOrder });
            return res.json({ code: 200, data: { list: userList, count: userList.length === 0 ? 0 : userList[0].total_count }, error: null, message: 'User List' });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserService;

// (async () => {


// })()