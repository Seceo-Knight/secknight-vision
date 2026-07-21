const mySqlHandler = require('./mySqlHandler');
const mongoHandler = require('./mongoHandler');

exports.appDomainHandler = async (appDomains) => {
    const PRService = require('../routes/productivityRanking/ProductivityRanking.model');
    try {
        const appDomainNames = appDomains.map(app => `"${app.name.replace(/\"/g, '""').replace(/\'/g, "''")}"`);

        if (appDomainNames.length === 0) { return; }
        const existingAppDomain = await PRService.getAppDomain('name', `name IN (${appDomainNames.toString()})`);

        const toBeInsertesAppDomain = appDomains
            .filter(item => !existingAppDomain.find(e => e.name === item.name))
            .map(item => `("${item.type}", "${item.name}")`).join(',');

        if (toBeInsertesAppDomain) {
            await PRService.bulkInsertAppDomain(toBeInsertesAppDomain);
        }
    } catch (err) {
        console.log(err);
    }
}

exports.keyStrokeHandler = async ({ userId, adminId, keystrokes, date }) => {
    try {
        // MySql
        if (!keystrokes) return;

        const [attendance_data] = await mySqlHandler.getAttendanceId({
            employee_id: userId,
            organization_id: adminId,
            date: date
        });

        if (!attendance_data) return;
        const { id: attendance_id } = attendance_data;
        if (!attendance_id) return;

        const [keystroke_data] = await mySqlHandler.getKeyStrokeId(attendance_id);

        if (keystroke_data) {
            mySqlHandler.appendKeyStrokes({ keystroke_id: keystroke_data.id, keystrokes });
        } else {
            mySqlHandler.insertKeyStrokes({ attendance_id, keystrokes });
        }

        // Mongo
        mongoHandler.upsertKeyStrokes({ attendance_id, keystrokes });
    } catch (err) {
        console.error(err);
    }
}

exports.empAttendanceHandler = async (dataObj) => {
    try {
        const { employee_id, organization_id, date, start_time, end_time } = dataObj;
        mySqlHandler.insertEmpAttendance([[employee_id, organization_id, date, start_time, end_time]]);
    } catch (err) {
        console.error(err);
    }
}

exports.empActivityHandler = async (appDomains) => {

}
exports.assignEmployeeOnRegistartion = async ({ employee_id, organization_id, role_id, department_id, location_id }) => {
    return true;
    //get roles properties assign with respective roles persons
    const [roleWithDepartments, roleWithLocations, roleWithLocationAndDept, all] = await Promise.all([
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id IS NULL AND department_id=${department_id}` }),
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id IS NULL` }),
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id=${department_id}` }),
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id IS NULL AND department_id IS NULL` })
    ]);

    await addMemeberToRule(organization_id, location_id, department_id, employee_id);
    if (roleWithDepartments.length > 0) {
        await assignRoles(roleWithDepartments, employee_id, organization_id);
    }
    if (roleWithLocations.length > 0) {
        await assignRoles(roleWithLocations, employee_id, organization_id);
    }
    if (roleWithLocationAndDept.length > 0) {
        await assignRoles(roleWithLocationAndDept, employee_id, organization_id);
    }
    if (all.length > 0) {
        await assignRoles(all, employee_id, organization_id);
    }
    // assign employee to roles
    const roleData = await mySqlHandler.getRoleWithDeptAndLoc({ where: `role_id=${role_id}` });
    if (roleData.length === 0) return;
    const empIds = await formatEmployees(roleData, organization_id);
    if (empIds.length === 0) return;
    await assignEmployee(empIds, role_id, employee_id);

}

exports.onLocationChange = async ({ old_location_id, location_id, department_id, employee_id, organization_id }) => {
    const [roleWithLocations, roleWithLocationAndDept] = await Promise.all([
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id=${old_location_id} AND department_id IS NULL` }),
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id=${old_location_id} AND department_id=${department_id}` })
    ]);
    if (roleWithLocations.length > 0) {
        await unAssignRoles(roleWithLocations, employee_id, organization_id);
    }
    if (roleWithLocationAndDept.length > 0) {
        await unAssignRoles(roleWithLocationAndDept, employee_id, organization_id);
    }
    const [newRoleWithLocations, newRoleWithLocationAndDept] = await Promise.all([
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id IS NULL` }),
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id=${department_id}` })
    ]);
    if (newRoleWithLocations.length > 0) {
        await assignRoles(newRoleWithLocations, employee_id, organization_id);
    }
    if (newRoleWithLocationAndDept.length > 0) {
        await assignRoles(newRoleWithLocationAndDept, employee_id, organization_id);
    }
}

exports.onDepartmentChange = async ({ old_department_id, location_id, department_id, employee_id, organization_id }) => {
    const [roleWithDepartments, roleWithLocationAndDept] = await Promise.all([
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id IS NULL AND department_id=${old_department_id}` }),
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id=${old_department_id}` })
    ]);
    if (roleWithDepartments.length > 0) {
        await unAssignRoles(roleWithDepartments, employee_id, organization_id);
    }
    if (roleWithLocationAndDept.length > 0) {
        await unAssignRoles(roleWithLocationAndDept, employee_id, organization_id);
    }
    const [newRoleWithDepartments, newRoleWithLocationAndDept] = await Promise.all([
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id IS NULL AND department_id=${department_id}` }),
        mySqlHandler.getRoleWithDeptAndLoc({ where: `location_id=${location_id} AND department_id=${department_id}` })
    ]);
    if (newRoleWithDepartments.length > 0) {
        await assignRoles(newRoleWithDepartments, employee_id, organization_id);
    }
    if (newRoleWithLocationAndDept.length > 0) {
        await assignRoles(newRoleWithLocationAndDept, employee_id, organization_id);
    }
}

const assignRoles = async (roles, employee_id, organization_id) => {
    for (const { role_id } of roles) {
        const roleUsers = await mySqlHandler.getRoleUser(role_id, organization_id);
        if (roleUsers.length === 0) continue;
        for (const { id } of roleUsers) {
            const existed = await mySqlHandler.getAssignedEmployee(id, [employee_id], role_id);
            if (existed.length > 0) continue;
            if (employee_id == id) continue;
            await mySqlHandler.bulkAssign([[employee_id, id, role_id]]);
        }
    }
}
const formatEmployees = async (roleData, organization_id) => {
    let empIds = [];
    for (const { location_id, department_id } of roleData) {
        if (location_id == null && department_id == null) {
            const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id}` });
            empIds = empIds.concat(_.pluck(e, 'id'));
        } else if (location_id != null && department_id != null) {
            const e = await mySqlHandler.employees({ select: `id`, where: `organization_id=${organization_id} AND department_id=${department_id} AND location_id=${location_id}` });
            empIds = empIds.concat(_.pluck(e, 'id'));
        } else if (location_id != null && department_id == null) {
            const e = await mySqlHandler.employees({ select: `id`, where: `organization_id=${organization_id} AND location_id=${location_id}` });
            empIds = empIds.concat(_.pluck(e, 'id'));
        } else {
            const e = await mySqlHandler.employees({ select: `id`, where: `organization_id=${organization_id} AND department_id=${department_id}` });
            empIds = empIds.concat(_.pluck(e, 'id'));
        }
    }
    return _.unique(empIds);
}
const assignEmployee = async (employees, role_id, employee_id) => {
    const existed = await mySqlHandler.getAssignedEmployee(employee_id, employees, role_id);
    let empIds = _.pluck(existed, 'employee_id');
    empIds = employees.filter(function (el) {
        return !empIds.includes(el);
    });
    if (empIds.length === 0) return;
    let assignEmployee = [];
    empIds = _.unique(empIds);
    empIds.map(e => { if (e != employee_id) { assignEmployee.push([e, employee_id, role_id]) } });
    await mySqlHandler.bulkAssign(assignEmployee);

}

const unAssignRoles = async (roles, employee_id, organization_id) => {
    for (const { role_id } of roles) {
        const roleUsers = await mySqlHandler.getRoleUser(role_id, organization_id);
        if (roleUsers.length === 0) continue;
        for (const { id } of roleUsers) {
            await mySqlHandler.unassignBulk([employee_id], id, role_id);
        }
    }
}

const addMemeberToRule = async (organization_id, location_id, department_id, employee_id) => {
    const alerts = await mySqlHandler.alertList(organization_id);
    if (alerts.length === 0) return;

    for (const alert of alerts) {
        const include = JSON.parse(alert.include_employees);
        include.ids.push(employee_id);
        if (include.all_locations == 1 || include.all_departments == 1) {
            await mySqlHandler.updateRule(alert.id, include);
        } else if (include.departments && include.locations) {
            if (include.departments.includes(department_id) && include.locations.includes(location_id)) {
                await mySqlHandler.updateRule(alert.id, include);
            }
        }
    }
}

