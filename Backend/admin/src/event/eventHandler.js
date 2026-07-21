const _ = require('underscore');

const EmpProductivityReport = require('../models/employee_productivity.schema');
const { EmployeeActivityModel: EmployeeActivitySchma } = require('../models/employee_activities.schema');
const EmailActivitySchema = require('../models/email_activity.schema');
const UserActivitySchema = require('../models/user_activity_data.schema');
const UserModel = require('../routes/v3/useractivity/useractivity.model');
const RoleModel = require('../routes/v3/settings/role-permission/Role.model');
const { GroupsModel: Model } = require('../routes/v3/settings/groups/groups.model');
const CloudStorageServices = require('../routes/v3/useractivity/service/cloudstorageServices/index');
const ActivityRequest = require(`${modelFolder}/activity_request.schema`);
const BreakRequest = require(`${modelFolder}/break_request.schema`);
const mySql = require('../database/MySqlConnection').getInstance();
const { TaskSchemaModel, TimelineDeleteSchemaModel } = require('../models/silah_db.schema');
const configFile = require('../../../config/config')
const activityLoginRecordSchema = require('../routes/v3/auth/services/activitylogs.schema');

const deleteEmployeeScreens = async ({ organization_id, email }) => {
    try {
        const [credsData] = await UserModel.getStorageDetail(organization_id);
        if (!credsData) return null;

        const creds = JSON.parse(credsData.creds);

        let storageType = credsData.short_code;
        const CloudDriveService = CloudStorageServices.getStorage(storageType);
        if (!CloudDriveService) return null;
        const conection = await CloudDriveService.initConection(creds);
        const empFoldersId = await CloudDriveService.getEmployeFolderId(conection, { mainFolderName: 'EmpMonitor', email: email, creds: creds });

        if (!empFoldersId) return null;
        await CloudDriveService.deleteEployeeScreenshots(conection, empFoldersId)
        return null;
    } catch (error) {
        return null
    }
}


exports.updateLocationHandler = async ({ employee_id, location_id }) => {
    try {
        if (employee_id && location_id) {
            await EmpProductivityReport.updateMany({ employee_id }, { $set: { location_id } });
            await EmailActivitySchema.updateMany({ employee_id }, { $set: { location_id } });
        }
    } catch (err) {
        console.error(err);
    }
}

exports.updateDepartmentHandler = async ({ employee_id, department_id }) => {
    try {
        if (employee_id && department_id) {
            await EmpProductivityReport.updateMany({ employee_id }, { $set: { department_id } });
            await EmailActivitySchema.updateMany({ employee_id }, { $set: { department_id } });
        }
    } catch (err) {
        console.error(err);
    }
}

exports.deleteEmployeeDetails = async ({ organization_id, employee_id, attendanceIds, email }) => {
    try {
        if (organization_id && employee_id) {
            await EmpProductivityReport.deleteMany({ organization_id: organization_id, employee_id: employee_id });
            await EmailActivitySchema.deleteMany({ organization_id: organization_id, employee_id: employee_id });
            if (attendanceIds.length > 0) {
                await EmployeeActivitySchma.deleteMany({ attendance_id: { $in: attendanceIds } });
            }
            await UserActivitySchema.deleteMany({ userId: employee_id, adminId: organization_id });
            await ActivityRequest.deleteMany({ employee_id, organization_id })
            await BreakRequest.deleteMany({ employee_id, organization_id });
            await deleteEmployeeScreens({ organization_id, employee_id, email })
            await TaskSchemaModel.deleteMany({ assigned_user: employee_id, organization_id });
            await TimelineDeleteSchemaModel.deleteMany({ employee_id, organization_id });
            await activityLoginRecordSchema.deleteMany({ employeeId: employee_id, organization: organization_id });
        }
    } catch (err) {
        console.error(err);
    }
}

exports.assignEmployee = async ({ organization_id, newEmployee, oldEmployee, role_id }) => {
    try {
        const roleUsers = await UserModel.getRoleUser(role_id, organization_id);
        if (roleUsers.length === 0) return;
        for (const { id } of roleUsers) {
            if (oldEmployee.length > 0) {
                await UserModel.unassignBulk(oldEmployee, id, role_id);
            }
            if (newEmployee.length > 0) {
                const existed = await UserModel.getAssignedEmployee(id, newEmployee, role_id);
                let empIds = _.pluck(existed, 'employee_id');
                empIds = newEmployee.filter(el => !empIds.includes(el));
                empIds = _.unique(empIds);
                let assignEmployee = [];
                empIds.map(e => { if (e != id) { assignEmployee.push([e, id, role_id]) } });
                if (assignEmployee.length === 0) continue;
                if(configFile.AUTO_ASSIGN_USER.includes(+organization_id)) await UserModel.bulkAssign(assignEmployee);
            }
        }

    } catch (err) {
        console.error(err);
    }
}
exports.assignEmployeeOnRegistartion = async ({ employee_id, organization_id, role_ids, department_id, location_id }) => {
    //get roles properties assign with respective roles persons
    try {
        const [roleWithDepartments, roleWithLocations, roleWithLocationAndDept, all] = await Promise.all([
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id IS NULL AND department_id=${department_id}` }),
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id IS NULL` }),
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id=${department_id}` }),
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id IS NULL AND department_id IS NULL` })
        ]);
        await addMemeberToRule(organization_id, location_id, department_id, employee_id);

        // if (roleWithDepartments.length > 0) {
        //     await assignRoles(roleWithDepartments, employee_id, organization_id);
        // }
        // if (roleWithLocations.length > 0) {
        //     await assignRoles(roleWithLocations, employee_id, organization_id);
        // }
        if (roleWithLocationAndDept.length > 0) {
            await assignRoles(roleWithLocationAndDept, employee_id, organization_id);
        }
        // if (all.length > 0) {
        //     await assignRoles(all, employee_id, organization_id);
        // }
        /**assign employee to roles
         * new registered employee roles with assign old users 
         * to which assigned department and location
         */
        for (const role_id of role_ids) {
            const roleData = await RoleModel.getRoleWithDeptAndLoc({ where: `role_id=${role_id}` });
            if (roleData.length === 0) return;
            const empIds = await formatEmployees(roleData, organization_id);
            if (empIds.length === 0) return;
            await assignEmployee(empIds, role_id, employee_id, organization_id);
        }

        const [roleWithGroup, locWithGroup, deptWithGroup, roleLocWithGroup, roleDeptWithGroup, locDeptWithGroup] = await Promise.all([
            RoleModel.getGroupWithDeptAndLoc({ where: `location_id IS NULL AND department_id IS NULL AND employee_id IS NULL AND role_id IN (${role_ids})` }),
            RoleModel.getGroupWithDeptAndLoc({ where: `location_id = ${location_id} AND department_id IS NULL AND employee_id IS NULL AND role_id IS NULL` }),
            RoleModel.getGroupWithDeptAndLoc({ where: `location_id IS NULL AND department_id = ${department_id} AND employee_id IS NULL AND role_id IS NULL` }),
            RoleModel.getGroupWithDeptAndLoc({ where: `location_id = ${location_id} AND department_id IS NULL AND employee_id IS NULL AND role_id IN (${role_ids})` }),
            RoleModel.getGroupWithDeptAndLoc({ where: `location_id IS NULL AND department_id = ${department_id} AND employee_id IS NULL AND role_id IN (${role_ids})` }),
            RoleModel.getGroupWithDeptAndLoc({ where: `location_id = ${location_id} AND department_id = ${department_id} AND employee_id IS NULL AND role_id IS NULL` })
        ]);
        if (roleWithGroup.length > 0) {
            await assignToGroup(roleWithGroup[0].group_id, employee_id, organization_id);
        }
        else if (locWithGroup.length > 0) {
            await assignToGroup(locWithGroup[0].group_id, employee_id, organization_id);
        }
        else if (deptWithGroup.length > 0) {
            await assignToGroup(deptWithGroup[0].group_id, employee_id, organization_id);
        }
        else if (roleLocWithGroup.length > 0) {
            await assignToGroup(roleLocWithGroup[0].group_id, employee_id, organization_id);
        }
        else if (roleDeptWithGroup.length > 0) {
            await assignToGroup(roleDeptWithGroup[0].group_id, employee_id, organization_id);
        }
        else if (locDeptWithGroup.length > 0) {
            await assignToGroup(locDeptWithGroup[0].group_id, employee_id, organization_id);
        }
    } catch (err) {
        console.log('----', err);
    }
}

// exports.onRoleChange = async ({ oldRole, newRole, employee_id, organization_id }) => {
//     //remove old role employees
//     const roleData = await RoleModel.getRoleWithDeptAndLoc({ where: `role_id=${oldRole}` });
//     if (roleData.length > 0) {
//         const empIds = await formatEmployees(roleData, organization_id);
//         if (empIds.length > 0) {
//             await UserModel.unassignBulk(empIds, employee_id, null);
//         }
//     }
//     //add new employees to new role
//     const roleDataNew = await RoleModel.getRoleWithDeptAndLoc({ where: `role_id=${newRole}` });
//     if (roleDataNew.length > 0) {
//         const newEmpIds = await formatEmployees(roleDataNew, organization_id);
//         if (newEmpIds.length > 0) {
//             const existed = await UserModel.getAssignedEmployee(employee_id, newEmpIds, null);
//             let empIds = _.pluck(existed, 'employee_id');
//             empIds = newEmpIds.filter(el => !empIds.includes(el));
//             let assignEmployee = [];
//             empIds.map(e => { if (e != employee_id) { assignEmployee.push([e, employee_id, newRole]) } });
//             if (assignEmployee.length === 0) return;
//             await UserModel.bulkAssign(assignEmployee);
//         }
//     }
// }
exports.onRoleChange = async ({ role_ids, employee_id, organization_id }) => {
    //remove old role employees
    // const roleData = await RoleModel.getRoleWithDeptAndLoc({ where: `role_id=${oldRole}` });
    // if (roleData.length > 0) {
    //     const empIds = await formatEmployees(roleData, organization_id);
    //     if (empIds.length > 0) {
    //         await UserModel.unassignBulk(empIds, employee_id, null);
    //     }
    // }
    //add new employees to new role
    try {
        for (const newRole of role_ids) {
            const roleDataNew = await RoleModel.getRoleWithDeptAndLoc({ where: `role_id=${newRole}` });
            if (roleDataNew.length > 0) {
                const newEmpIds = await formatEmployees(roleDataNew, organization_id);
                if (newEmpIds.length > 0) {
                    const existed = await UserModel.getAssignedEmployee(employee_id, newEmpIds, newRole);
                    let empIds = _.pluck(existed, 'employee_id');
                    empIds = newEmpIds.filter(el => !empIds.includes(el));
                    let assignEmployee = [];
                    empIds = _.unique(empIds);
                    empIds.map(e => { if (e != employee_id) { assignEmployee.push([e, employee_id, newRole]) } });
                    if (assignEmployee.length === 0) return;
                    if(configFile.AUTO_ASSIGN_USER.includes(+organization_id))  await UserModel.bulkAssign(assignEmployee);
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
}

exports.onLocationChange = async ({ old_location_id, location_id, department_id, employee_id, organization_id }) => {
    try {
        const [roleWithLocations, roleWithLocationAndDept] = await Promise.all([
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id=${old_location_id} AND department_id IS NULL` }),
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id=${old_location_id} AND department_id=${department_id}` })
        ]);
        if (roleWithLocations.length > 0) {
            await unAssignRoles(roleWithLocations, employee_id, organization_id);
        }
        if (roleWithLocationAndDept.length > 0) {
            await unAssignRoles(roleWithLocationAndDept, employee_id, organization_id);
        }
        const [newRoleWithLocations, newRoleWithLocationAndDept] = await Promise.all([
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id IS NULL` }),
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id=${department_id}` })
        ]);
        if (newRoleWithLocations.length > 0) {
            await assignRoles(newRoleWithLocations, employee_id, organization_id);
        }
        if (newRoleWithLocationAndDept.length > 0) {
            await assignRoles(newRoleWithLocationAndDept, employee_id, organization_id);
        }
    } catch (err) {
        console.log(err);
    }
}

exports.onDepartmentChange = async ({ old_department_id, location_id, department_id, employee_id, organization_id }) => {
    try {
        const [roleWithDepartments, roleWithLocationAndDept] = await Promise.all([
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id IS NULL AND department_id=${old_department_id}` }),
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id=${old_department_id}` })
        ]);
        if (roleWithDepartments.length > 0) {
            await unAssignRoles(roleWithDepartments, employee_id, organization_id);
        }
        if (roleWithLocationAndDept.length > 0) {
            await unAssignRoles(roleWithLocationAndDept, employee_id, organization_id);
        }
        const [newRoleWithDepartments, newRoleWithLocationAndDept] = await Promise.all([
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id IS NULL AND department_id=${department_id}` }),
            RoleModel.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id=${department_id}` })
        ]);
        if (newRoleWithDepartments.length > 0) {
            await assignRoles(newRoleWithDepartments, employee_id, organization_id);
        }
        if (newRoleWithLocationAndDept.length > 0) {
            await assignRoles(newRoleWithLocationAndDept, employee_id, organization_id);
        }
    } catch (err) {
        console.log(err);
    }
}


// assign employee with specific role person which is assigned department and location.
const assignRoles = async (roles, employee_id, organization_id) => {
    try {
        for (const { role_id } of roles) {
            const roleUsers = await UserModel.getRoleUser(role_id, organization_id);
            if (roleUsers.length === 0) continue;
            for (const { id } of roleUsers) {
                if (employee_id == id) continue;
                const existed = await UserModel.getAssignedEmployee(id, [employee_id], role_id);
                if (existed.length > 0) continue;
                if(configFile.AUTO_ASSIGN_USER.includes(+organization_id))  await UserModel.bulkAssign([[employee_id, id, role_id]]);
            }
        }
    } catch (err) {
        throw err;
    }
}

const assignEmployee = async (employees, role_id, employee_id, organization_id) => {
    try {
        const existed = await UserModel.getAssignedEmployee(employee_id, employees, role_id);
        let empIds = _.pluck(existed, 'employee_id');
        empIds = employees.filter(el => !empIds.includes(el));
        if (empIds.length === 0) return;
        let assignEmployee = [];
        empIds = _.unique(empIds);
        empIds.map(e => { if (e != employee_id) { assignEmployee.push([e, employee_id, role_id]) } });
        if(configFile.AUTO_ASSIGN_USER.includes(+organization_id)) await UserModel.bulkAssign(assignEmployee);
    } catch (err) {
        throw err;
    }
}

const formatEmployees = async (roleData, organization_id) => {
    try {
        let empIds = [];
        for (const { location_id, department_id } of roleData) {
            if (location_id == null && department_id == null) {
                const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id}` });
                empIds = empIds.concat(_.pluck(e, 'id'));
            } else if (location_id != null && department_id != null) {
                const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND department_id=${department_id} AND location_id=${location_id}` });
                empIds = empIds.concat(_.pluck(e, 'id'));
            } else if (location_id != null && department_id == null) {
                const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND location_id=${location_id}` });
                empIds = empIds.concat(_.pluck(e, 'id'));
            } else {
                const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND department_id=${department_id}` });
                empIds = empIds.concat(_.pluck(e, 'id'));
            }
        }
        return _.unique(empIds);
    } catch (err) {
        throw err;
    }
}
const unAssignRoles = async (roles, employee_id, organization_id) => {
    try {
        for (const { role_id } of roles) {
            const roleUsers = await UserModel.getRoleUser(role_id, organization_id);
            if (roleUsers.length === 0) continue;
            for (const { id } of roleUsers) {
                await UserModel.unassignBulk([employee_id], id, role_id);
            }
        }
    } catch (err) {
        throw err;
    }
}


const assignToGroup = async (group_id, employee_id, organization_id) => {
    try {
        const [orgnizationSettings] = await Model.orgnizationSetting(organization_id);
        await Model.updateEmployeeSettings({ set: `custom_tracking_rule='${orgnizationSettings.rules}', tracking_rule_type =2 , group_id=${group_id}`, where: `id IN(${employee_id})` });
    }
    catch (err) {
        throw err;
    }
}

const addMemeberToRule = async (organization_id, location_id, department_id, employee_id) => {
    const alertQuery = `SELECT id, include_employees 
                         FROM notification_rules 
                         WHERE organization_id = ? AND 
                         (JSON_EXTRACT(include_employees,'$.all_employees')=1
                             OR JSON_EXTRACT(include_employees,'$.all_locations')=1 
                             OR JSON_EXTRACT(include_employees,'$.all_departments')=1);
                        `;
    const alerts = await mySql.query(alertQuery, [organization_id]);
    if (alerts.length === 0) return;
    for (const alert of alerts) {
        const include = JSON.parse(alert.include_employees);
        include.ids.push(employee_id);
        if (include.all_locations == 1 || include.all_departments == 1) {
            await updateRule(alert.id, include);
        } else if (include.departments && include.locations) {
            if (include.departments.includes(department_id) && include.locations.includes(location_id)) {
                await updateRule(alert.id, include);
            }
        }
    }
}

const updateRule = async (rule_id, include_employees) => {
    const query = `UPDATE notification_rules
                SET include_employees = '${JSON.stringify(include_employees)}'
                WHERE id = ${rule_id};`;

    return mySql.query(query);
}
// const employees = [1, 3, 5];
// let empIds = [1, 3,];
// empIds = employees.filter(el => !empIds.includes(el));

// console.log('--------', empIds);