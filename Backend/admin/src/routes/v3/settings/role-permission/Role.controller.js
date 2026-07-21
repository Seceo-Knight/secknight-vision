const _ = require('underscore');
const RoleModel = require('./Role.model');
const RoleValidator = require('./Role.validator');
const actionsTracker = require('../../services/actionsTracker');
const eventEmitter = require('../../../../event/eventEmitter');
const Validator = require('../../shifts/Validator');
const { rolePermissionMessages, productivityMessages, shiftMessages } = require("../../../../utils/helpers/LanguageTranslate");
const translate = require('../../../../utils/messageTranslation').translate

class RoleController {
    async getRoles(req, res, next) {
        try {
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;
            actionsTracker(req, 'Roles requested.');

            // const roles = await RoleModel.getRoles(organization_id);
            const roles = await RoleModel.getRolesWithPermissions(organization_id, null, 0, 1000, null, null);
            return res.json({ code: 200, data: roles, message: rolePermissionMessages.find(x => x.id === "1")[language] || rolePermissionMessages.find(x => x.id === "1")["en"], error: null });
        } catch (err) {
            next(err);
        }
    }
    async addRolePermission(req, res, next) {
        try {
            const { name, permission_ids } = await RoleValidator.addRole().validateAsync(req.body);
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const [roleExist] = await RoleModel.getRoleByName(name, organization_id);

            if (roleExist) {
                return res.status(400).json({ code: 400, data: null, error: rolePermissionMessages.find(x => x.id === "3")[language] || rolePermissionMessages.find(x => x.id === "3")["en"], message: `Role \"${roleExist.name}\" already exists.` });
            }

            await RoleModel.insertPermissionRole({
                role_id: (await RoleModel.insertRole({ name, organization_id })).insertId,
                permission_ids,
                organization_id,
                created_by: req.decoded.user_id
            });
            actionsTracker(req, 'Role ? created.', [name]);
            return res.json({ code: 200, data: null, message: rolePermissionMessages.find(x => x.id === "4")[language] || rolePermissionMessages.find(x => x.id === "4")["en"], error: null });
        } catch (err) {
            next(err);
        }
    }
    async editRolePermission(req, res, next) {
        try {
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;
            const { name, role_id, permission_ids } = await RoleValidator.editRole().validateAsync(req.body);

            const roleUpdateResult = await RoleModel.updateRole({ name, role_id, organization_id });

            if (!roleUpdateResult.affectedRows) {
                return res.status(400).json({ code: 400, data: null, error: rolePermissionMessages.find(x => x.id === "3")[language] || rolePermissionMessages.find(x => x.id === "3")["en"], message: rolePermissionMessages.find(x => x.id === "5")[language] || rolePermissionMessages.find(x => x.id === "5")["en"] });
            }

            const permissionRoles = await RoleModel.getPermissionRolesByRoleId(role_id, organization_id);
            const permissionRoleIds = _.pluck(permissionRoles, 'permission_id');

            const toBeInsertedPermissions = permission_ids.filter(item => !permissionRoleIds.includes(item));
            const toBeDeletedPermissions = permissionRoleIds.filter(item => !permission_ids.includes(item));

            await Promise.all([
                RoleModel.deletePermissionRoleByPermissionIds({ role_id, organization_id, permission_ids: toBeDeletedPermissions }),
                RoleModel.insertPermissionRole({ role_id, permission_ids: toBeInsertedPermissions, organization_id, created_by: req.decoded.user_id })
            ]);

            actionsTracker(req, 'Role %i updated.', [role_id]);
            return res.json({ code: 200, data: null, message: rolePermissionMessages.find(x => x.id === "4")[language] || rolePermissionMessages.find(x => x.id === "4")["en"], error: null });
        } catch (err) {
            next(err);
        }
    }
    async deleteRolePermission(req, res, next) {
        try {
            const { role_id } = await RoleValidator.deleteRole().validateAsync(req.body);
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const [role] = await RoleModel.getRole(role_id);

            if (!role) {
                return res.status(404).json({ code: 404, data: null, error: rolePermissionMessages.find(x => x.id === "6")[language] || rolePermissionMessages.find(x => x.id === "6")["en"], message: rolePermissionMessages.find(x => x.id === "7")[language] || rolePermissionMessages.find(x => x.id === "7")["en"] });
            }
            if (!role.organization_id) {
                return res.status(400).json({ code: 400, data: null, error: rolePermissionMessages.find(x => x.id === "3")[language] || rolePermissionMessages.find(x => x.id === "3")["en"], message: rolePermissionMessages.find(x => x.id === "7")[language] || rolePermissionMessages.find(x => x.id === "7")["en"] });
            }
            if (role.organization_id !== organization_id) {
                return res.status(400).json({ code: 400, data: null, error: rolePermissionMessages.find(x => x.id === "3")[language] || rolePermissionMessages.find(x => x.id === "3")["en"], message: rolePermissionMessages.find(x => x.id === "9")[language] || rolePermissionMessages.find(x => x.id === "9")["en"] });
            }
            const employees = await RoleModel.employeeExistedWithRole(role_id, organization_id);
            if (employees.length > 0) return res.status(400).json({ code: 400, data: null, error: rolePermissionMessages.find(x => x.id === "3")[language] || rolePermissionMessages.find(x => x.id === "3")["en"], message: rolePermissionMessages.find(x => x.id === "10")[language] || rolePermissionMessages.find(x => x.id === "10")["en"] });

            await RoleModel.deleteRoleAssigned(role_id);
            await RoleModel.deleteAllRolePermissions(role_id, organization_id);
            await RoleModel.deleteRole(role_id, organization_id);

            actionsTracker(req, 'Role %i deleted.', [role_id]);
            return res.json({ code: 200, data: null, message: rolePermissionMessages.find(x => x.id === "4")[language] || rolePermissionMessages.find(x => x.id === "4")["en"], error: null });
        } catch (err) {
            next(err);
        }
    }

    async getPermissions(req, res, next) {
        try {
            const language = req.decoded.language;
            const permissions = await RoleModel.getAllPermissions();
            actionsTracker(req, 'Permissions requested.');

            return res.json({ code: 200, data: permissions, message: rolePermissionMessages.find(x => x.id === "11")[language] || rolePermissionMessages.find(x => x.id === "11")["en"], error: null });
        } catch (err) {
            next(err);
        }
    }
    async getRolePermissions(req, res, next) {
        try {
            const language = req.decoded.language;
            const { role_id } = await RoleValidator.getRolePermissions().validateAsync(req.query);
            const permissions = await RoleModel.getAllPermissions();

            return res.json({ code: 200, data: permissions, message: rolePermissionMessages.find(x => x.id === "11")[language] || rolePermissionMessages.find(x => x.id === "11")["en"], error: null });
        } catch (err) {
            next(err);
        }
    }
    //new
    async addRole(req, res, next) {
        const language = req.decoded.language;
        try {
            const { organization_id } = req.decoded;
            let validation;
            try {
                validation = await RoleValidator.addRoleByName().validateAsync(req.body);
            } catch (errors) {
                return res.json({ code: 400, data: null, message: errors.message, error: errors.message });
            }
            let { name, location, department_ids, permission } = validation;
            const [roleExist] = await RoleModel.roleByName(name, organization_id);

            if (roleExist) {
                return res.json({ code: 400, data: null, error: rolePermissionMessages.find(x => x.id === "3")[language] || rolePermissionMessages.find(x => x.id === "3")["en"], message: translate(rolePermissionMessages, 'ROLE_ALREADY_EXISTS', language).replace('{{roleName}}', roleExist.name) });
            }
            if (name.toLowerCase() === 'admin') return res.json({ code: 400, data: null, message: translate(rolePermissionMessages, '13', language), error: null });
            if (permission) permission = JSON.stringify(permission);
            const inserted = await RoleModel.insertRole({ name, organization_id, type: 0, permission });

            let role_data = [];
            if (location.length > 0) {
                location.map(loc => {
                    if (loc.department_ids.length > 0) {
                        loc.department_ids.map(id => role_data.push([inserted.insertId, loc.location_id, id]));
                    } else {
                        role_data.push([inserted.insertId, loc.location_id, null]);
                    }
                });
            }
            department_ids = _.unique(department_ids);
            if (department_ids.length > 0) {
                department_ids.map(id => {
                    role_data.push([inserted.insertId, null, id]);
                });
            }
            // role_data = _.unique(role_data.map(x => x.toString()));
            // role_data = role_data.map(x => JSON.parse(`[${x}]`));

            if (location.length === 0 && department_ids.length === 0) {
                role_data.push([inserted.insertId, null, null]);
            }
            await RoleModel.addAudience({ role_data });
            actionsTracker(req, 'Role ? created.', [name]);
            const roles = await RoleModel.getRolesWithPermissions(organization_id, inserted.insertId, 0, 1, null, null);
            const roleIds = _.pluck(roles, 'id');
            const audience = await RoleModel.listRoleAudience({ role_ids: roleIds });
            roles.map((role) => {
                role.locations = audience.filter(obj => { return obj.role_id === role.id && obj.location_id != null });
                if (role.locations.length > 0) {
                    let temp = _.pluck(role.locations, 'location_id');
                    temp = _.unique(temp);
                    let result = [];
                    temp.map(t => {
                        result.push({
                            location_id: t,
                            location: role.locations.find(x => x.location_id == t).location,
                            departments: role.locations.filter(x => x.location_id == t && x.department_id != null)
                        });
                    })
                    role.locations = result;
                }
                role.permission = role.permission ? JSON.parse(role.permission) : { "read": 1, "write": 0, "delete": 0, "send_mail": 1 }
                role.departments = audience.filter(obj => { return obj.role_id === role.id && obj.department_id != null && obj.location_id == null });
            })
            return res.json({ code: 200, data: roles, message: rolePermissionMessages.find(x => x.id === "12")[language] || rolePermissionMessages.find(x => x.id === "12")["en"], error: null });
        } catch (err) {
            return res.json({ code: 400, data: null, message: translate(productivityMessages, '16', language), error: null });
        }
    }
    async getRolesWithPermissions(req, res, next) {
        try {
            const organization_id = req.decoded.organization_id;
            const language = req.decoded.language;

            const { role_id, location_id, skip, limit, name, sortOrder } = await RoleValidator.getRole().validateAsync(req.query);

            actionsTracker(req, 'Roles requested.');
            if (role_id && location_id) {
                const locations = await RoleModel.listRoleAudienceWithLocation({ role_id, location_id });
                return res.json({ code: 200, data: locations.filter(x => x.department_id != null), message: rolePermissionMessages.find(x => x.id === "1")[language] || rolePermissionMessages.find(x => x.id === "1")["en"], error: null });
            }
            const roles = await RoleModel.getRolesWithPermissions(organization_id, role_id, skip, limit, name, sortOrder);
            const roleIds = _.pluck(roles, 'id');
            if (roleIds.length === 0) return res.json({ code: 400, data: roles, message: rolePermissionMessages.find(x => x.id === "6")[language] || rolePermissionMessages.find(x => x.id === "6")["en"], error: null });

            const audience = await RoleModel.listRoleAudience({ role_ids: roleIds });
            roles.map((role) => {
                role.locations = audience.filter(obj => { return obj.role_id === role.id && obj.location_id != null });
                if (role.locations.length > 0) {
                    let temp = _.pluck(role.locations, 'location_id');
                    temp = _.unique(temp);
                    let result = [];
                    temp.map(t => {
                        result.push({
                            location_id: t,
                            location: role.locations.find(x => x.location_id == t).location,
                            departments: role.locations.filter(x => x.location_id == t && x.department_id != null)
                        });
                    })
                    role.locations = result;
                }
                role.permission = role.permission ? JSON.parse(role.permission) : { "read": 1, "write": 0, "delete": 0, "send_mail": 1 };
                role.permission.hrms_permission = role?.permission_ids && role.permission_ids.match(/203/g) ? '1' : '0';
                role.departments = audience.filter(obj => { return obj.role_id === role.id && obj.department_id != null && obj.location_id == null });
            })
            return res.json({ code: 200, data: roles, totalCount: roles[0].total_count, hasMoreData: (skip + limit) >= roles[0].total_count ? false : true, skipValue: (skip + limit), message: rolePermissionMessages.find(x => x.id === "1")[language] || rolePermissionMessages.find(x => x.id === "1")["en"], error: null });
        } catch (err) {
            console.log(err)
            next(err);
        }
    }
    async editRolePermissionAndLocation(req, res, next) {
        const language = req.decoded.language;
        try {
            const organization_id = req.decoded.organization_id;
            let validation;
            try {
                validation = await RoleValidator.editRole().validateAsync(req.body);
            } catch (errors) {
                return res.json({ code: 401, data: null, message: errors.message, error: errors.message });
            }
            let { name, role_id, permission_ids, location, department_ids, permission, loc_dept_edit, type } = validation;
            if (name || permission) {
                const [roleExist] = await RoleModel.roleByNameWithId(name, role_id, organization_id);

                if (roleExist) {
                    return res.status(400).json({ code: 400, data: null, error: rolePermissionMessages.find(x => x.id === "3")[language] || rolePermissionMessages.find(x => x.id === "3")["en"], message: `Role \"${roleExist.name}\" already exists.` });
                }
                if (name.toLowerCase() === 'admin') return res.json({ code: 400, data: null, message: translate(rolePermissionMessages, '13', language), error: null });

                if (permission) permission = JSON.stringify(permission);
                const roleUpdateResult = await RoleModel.updateRole({ name, role_id, organization_id, permission });

                if (!roleUpdateResult.affectedRows) {
                    return res.status(400).json({ code: 400, data: null, error: rolePermissionMessages.find(x => x.id === "3")[language] || rolePermissionMessages.find(x => x.id === "3")["en"], message: rolePermissionMessages.find(x => x.id === "5")[language] || rolePermissionMessages.find(x => x.id === "5")["en"] });
                }
            }

            if (permission_ids.length > 0) {
                const permissionRoles = await RoleModel.getPermissionRolesByRoleId(role_id, organization_id);
                type = type == 2 ? 1 : 2;
                permission_ids = _.unique([...permission_ids, ..._.pluck(permissionRoles.filter(x => x.type == type), 'permission_id')]);
                const permissionRoleIds = _.pluck(permissionRoles, 'permission_id');

                const toBeInsertedPermissions = permission_ids.filter(item => !permissionRoleIds.includes(item));
                let toBeDeletedPermissions = permissionRoleIds.filter(item => !permission_ids.includes(item));
                toBeDeletedPermissions = toBeDeletedPermissions.filter(item => item != 203);
                if (toBeDeletedPermissions.includes(210)) {
                    let nonAdminId = await RoleModel.getAdminIdByRoles(role_id, organization_id);
                    nonAdminId = _.pluck(nonAdminId, "user_id");
                    await RoleModel.updateAutoAccept(nonAdminId);
                }
                await Promise.all([
                    RoleModel.deletePermissionRoleByPermissionIds({ role_id, organization_id, permission_ids: toBeDeletedPermissions }),
                    RoleModel.insertPermissionRole({ role_id, permission_ids: toBeInsertedPermissions, organization_id, created_by: req.decoded.user_id })
                ]);
            }

            if (permission_ids.length == 0) {
                const permissionRoles = await RoleModel.getPermissionRolesByRoleId(role_id, organization_id);
                type = type == 2 ? 1 : 2;
                permission_ids = _.unique([...permission_ids, ..._.pluck(permissionRoles.filter(x => x.type == type), 'permission_id')]);
                const permissionRoleIds = _.pluck(permissionRoles, 'permission_id');

                let toBeDeletedPermissions = permissionRoleIds.filter(item => !permission_ids.includes(item));
                toBeDeletedPermissions = toBeDeletedPermissions.filter(item => item != 203);
                await Promise.all([
                    RoleModel.deletePermissionRoleByPermissionIds({ role_id, organization_id, permission_ids: toBeDeletedPermissions }),
                ]);
            }
            if (loc_dept_edit == true) {
                let empIds = [];
                const audience = await RoleModel.listRoleAudience({ role_ids: [role_id] });
                if (audience.length > 0) {
                    for (const { location_id, department_id } of audience) {
                        if (location_id != null && department_id != null) {
                            const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND department_id=${department_id} AND location_id=${location_id}` });
                            empIds = empIds.concat(_.pluck(e, 'id'));
                        } else if (location_id != null && department_id == null) {
                            const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND location_id=${location_id}` });
                            empIds = empIds.concat(_.pluck(e, 'id'));
                        } else if (location_id == null && department_id == null) {
                            const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id}` });
                            empIds = empIds.concat(_.pluck(e, 'id'));
                        } else {
                            const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND department_id=${department_id}` });
                            empIds = empIds.concat(_.pluck(e, 'id'));
                        }
                    }
                }
                await RoleModel.deleteRoleWithLocAndDept({ role_id });
                let role_data = [];
                let newEmpIds = [];
                if (location.length > 0) {
                    for (const loc of location) {
                        if (loc.department_ids.length > 0) {
                            loc.department_ids.map(id => role_data.push([role_id, loc.location_id, id]));
                            const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND department_id IN(${loc.department_ids}) AND location_id=${loc.location_id}` });
                            newEmpIds = newEmpIds.concat(_.pluck(e, 'id'));
                        } else {
                            role_data.push([role_id, loc.location_id, null]);
                            const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND location_id=${loc.location_id}` });
                            newEmpIds = newEmpIds.concat(_.pluck(e, 'id'));
                        }
                    }
                }
                department_ids = _.unique(department_ids);
                if (department_ids.length > 0) {
                    department_ids.map(id => { role_data.push([role_id, null, id]); });
                    const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id} AND department_id IN(${department_ids})` });
                    newEmpIds = newEmpIds.concat(_.pluck(e, 'id'));
                }
                // role_data = _.unique(role_data.map(x => x.toString()));
                // role_data = role_data.map(x => JSON.parse(`[ ${x}]`));

                if (location.length === 0 && department_ids.length === 0) {
                    role_data.push([role_id, null, null]);
                    const e = await RoleModel.employees({ select: `id`, where: `organization_id=${organization_id}` });
                    newEmpIds = newEmpIds.concat(_.pluck(e, 'id'));
                }
                await RoleModel.addAudience({ role_data });
                const newEmployee = _.unique(newEmpIds.filter(val => !empIds.includes(val)));
                const oldEmployee = _.unique(empIds.filter(val => !newEmpIds.includes(val)));

                eventEmitter.emit('update_role_permission', { organization_id, newEmployee, oldEmployee, role_id });
            }
            const roles = await RoleModel.getRolesWithPermissions(organization_id, role_id, 0, 1, null, null);
            const roleIds = _.pluck(roles, 'id');
            const audience = await RoleModel.listRoleAudience({ role_ids: roleIds });
            roles.map((role) => {
                role.locations = audience.filter(obj => { return obj.role_id === role.id && obj.location_id != null });
                if (role.locations.length > 0) {
                    let temp = _.pluck(role.locations, 'location_id');
                    temp = _.unique(temp);
                    let result = [];
                    temp.map(t => {
                        result.push({
                            location_id: t,
                            location: role.locations.find(x => x.location_id == t).location,
                            departments: role.locations.filter(x => x.location_id == t && x.department_id != null)
                        });
                    })
                    role.locations = result;
                }
                role.permission = role.permission ? JSON.parse(role.permission) : { "read": 1, "write": 0, "delete": 0, "send_mail": 1 }
                role.departments = audience.filter(obj => { return obj.role_id === role.id && obj.department_id != null && obj.location_id == null });
            })
            actionsTracker(req, 'Role %i updated.', [role_id]);
            return res.json({ code: 200, data: roles, message: rolePermissionMessages.find(x => x.id === "4")[language] || rolePermissionMessages.find(x => x.id === "4")["en"], error: null });

        } catch (err) {
            console.log('-------', err);
            return res.json({ code: 400, data: null, message: translate(shiftMessages, '5', language), error: null });
        }
    }
    async postHRMSPermission(req, res) {
        try {
            const organization_id = req.decoded.organization_id;
            const created_by = req.decoded.user_id;
            let validation
            try {
                validation = await RoleValidator.addHRMSRole().validateAsync(req.body);
            } catch (errors) {
                return res.json({ code: 401, data: null, message: errors.message, error: errors.message });
            }
            let { role_id, permission_id, status } = validation;
            let data = await RoleModel.getHrmsId(role_id, permission_id);
            if (!data.length == 0 && status != 2) {
                return res.json({ code: 200, data: null, message: "Id Already exist", error: null });
            }
            if (status == 1) {
                await RoleModel.addPermissionRole(role_id, permission_id, organization_id, created_by);
                return res.json({ code: 200, data: null, message: "Activated for the Role", error: null });
            }
            if (status == 2 && !data.length == 0) {
                RoleModel.deletePermissionRole({ role_id, organization_id, permission_id })
                return res.json({ code: 200, data: null, message: "Deactivated for the Role", error: null });
            }
            else {
                return res.json({ code: 200, data: null, message: "Id does not exist", error: null });
            }
        } catch (err) {
            console.log(err)
            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }

    async rolesCopy(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { name, role_id } = req.body;

            let dataRoles = await RoleModel.getRolesById(role_id);
            const inserted = await RoleModel.insertRole({ name, organization_id, type: 0, permission: dataRoles[0].permission });
            let roles_location_department = await RoleModel.getRolesLocationDepartment(role_id);
            let role_data = [];
            roles_location_department.map((item) => {
                role_data.push([inserted.insertId, item.location_id, item.department_id]);
            })
            if (role_data.length === 0) return res.send("Error");

            await RoleModel.addAudience({ role_data });
    
            const roles = await RoleModel.getRolesWithPermissions(organization_id, inserted.insertId, 0, 1, null, null);
            const roleIds = _.pluck(roles, 'id');
            const audience = await RoleModel.listRoleAudience({ role_ids: roleIds });
            roles.map((role) => {
                role.locations = audience.filter(obj => { return obj.role_id === role.id && obj.location_id != null });
                if (role.locations.length > 0) {
                    let temp = _.pluck(role.locations, 'location_id');
                    temp = _.unique(temp);
                    let result = [];
                    temp.map(t => {
                        result.push({
                            location_id: t,
                            location: role.locations.find(x => x.location_id == t).location,
                            departments: role.locations.filter(x => x.location_id == t && x.department_id != null)
                        });
                    })
                    role.locations = result;
                }
                role.permission = role.permission ? JSON.parse(role.permission) : { "read": 1, "write": 0, "delete": 0, "send_mail": 1 }
                role.departments = audience.filter(obj => { return obj.role_id === role.id && obj.department_id != null && obj.location_id == null });
            });

            let permission_ids = await RoleModel.getRolesPermission(role_id);
            permission_ids = _.pluck(permission_ids, "permission_id");
            role_id = inserted.insertId;

            let type = 1;

            if (permission_ids.length > 0) {
                const permissionRoles = await RoleModel.getPermissionRolesByRoleId(role_id, organization_id);
                type = type == 2 ? 1 : 2;
                permission_ids = _.unique([...permission_ids, ..._.pluck(permissionRoles.filter(x => x.type == type), 'permission_id')]);
                const permissionRoleIds = _.pluck(permissionRoles, 'permission_id');

                const toBeInsertedPermissions = permission_ids.filter(item => !permissionRoleIds.includes(item));
                let toBeDeletedPermissions = permissionRoleIds.filter(item => !permission_ids.includes(item));
                toBeDeletedPermissions = toBeDeletedPermissions.filter(item => item != 203);
                await Promise.all([
                    RoleModel.deletePermissionRoleByPermissionIds({ role_id, organization_id, permission_ids: toBeDeletedPermissions }),
                    RoleModel.insertPermissionRole({ role_id, permission_ids: toBeInsertedPermissions, organization_id, created_by: req.decoded.user_id })
                ]);
            }

            if (permission_ids.length == 0) {
                const permissionRoles = await RoleModel.getPermissionRolesByRoleId(role_id, organization_id);
                type = type == 2 ? 1 : 2;
                permission_ids = _.unique([...permission_ids, ..._.pluck(permissionRoles.filter(x => x.type == type), 'permission_id')]);
                const permissionRoleIds = _.pluck(permissionRoles, 'permission_id');

                let toBeDeletedPermissions = permissionRoleIds.filter(item => !permission_ids.includes(item));
                toBeDeletedPermissions = toBeDeletedPermissions.filter(item => item != 203);
                await Promise.all([
                    RoleModel.deletePermissionRoleByPermissionIds({ role_id, organization_id, permission_ids: toBeDeletedPermissions }),
                ]);
            }
            return res.json({ code: 200, data: roles, message: rolePermissionMessages.find(x => x.id === "12")[language] || rolePermissionMessages.find(x => x.id === "12")["en"], error: null });
        }
        catch (error) {
            return res.json({ code: 400, data: null, message: translate(productivityMessages, '16', language), error: null });
        }
    }

}

module.exports = new RoleController;