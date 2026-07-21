const mySql = require('../../../../database/MySqlConnection').getInstance();

class RoleModel {
    // ROLE
    /**
     * @param {Object} dataObj
     * @param {String} dataObj.name
     * @param {Number} dataObj.organization_id
     */
    insertRole(dataObj) {
        const query = `INSERT INTO roles SET ?`;

        return mySql.query(query, dataObj);
    }
    getRoles(organization_id) {
        const query = `
            SELECT id, name, status, type
            FROM roles
            WHERE (organization_id = ?) OR (organization_id IS NULL)
        `;
        return mySql.query(query, organization_id);
    }
    getRolesWithPermissions(organization_id, role_id, skip, limit, name, sortOrder) {
        let params = [organization_id, organization_id];
        let query = `
            SELECT
                r.id AS id,
                name,
                status,
                type,
                permission,
                GROUP_CONCAT(pr.permission_id) as permission_ids,(COUNT( r.id ) OVER()) AS total_count
            FROM roles AS r
            LEFT JOIN permission_role AS pr
            ON pr.role_id=r.id  AND pr.organization_id=?

            WHERE
                (r.organization_id=?)
                AND r.status = 1
                AND r.name != "Admin"`;
        if (role_id) { query += ` AND r.id=?`; params.push(role_id); }
        if (name) { query += ` AND (name LIKE ?)`; params.push(`%${name}%`); }
        query += ` GROUP BY r.id `;
        if (sortOrder) query += ` ORDER BY name ${sortOrder == 'A' ? 'ASC' : 'DESC'} `;
        query += `LIMIT ?, ?`;
        params.push(skip, limit);

        return mySql.query(query, params);
    }
    getRole(role_id) {
        return mySql.query(`SELECT id, organization_id FROM roles WHERE id=?`, [role_id]);
    }
    getRoleByName(name, organization_id) {
        const query = `
            SELECT id, name
            FROM roles
            WHERE name LIKE ? AND (organization_id=? OR organization_id IS NULL);
        `;

        return mySql.query(query, [`${name}%`, organization_id]);
    }
    /**
     * @param {Object} dataObj
     * @param {String} dataObj.name
     * @param {Number} dataObj.role_id
     * @param {Number} dataObj.organization_id
     */
    updateRole(dataObj) {
        const { name, role_id, organization_id, permission } = dataObj;

        let updates = [];
        let params = [];
        if (name) { updates.push(`name=?`); params.push(name); }
        if (permission) { updates.push(`permission=?`); params.push(permission); }

        if (updates.length === 0) {
            return Promise.resolve()
        }
        const query = `
            UPDATE roles
            SET ${updates.join(', ')}
            WHERE id=? AND organization_id=?
        `;
        params.push(role_id, organization_id);

        return mySql.query(query, params);
    }
    employeeExistedWithRole(role_id, organization_id) {
        const query = `SELECT e.id,u.first_name,u.last_name,u.a_email
                    FROM employees e
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    WHERE ur.role_id=? AND e.organization_id=?`;

        return mySql.query(query, [role_id, organization_id]);
    }

    deleteRole(role_id, organization_id) {
        return mySql.query(`DELETE FROM roles WHERE id=? AND organization_id=?`, [role_id, organization_id]);
    }

    deleteRoleAssigned(role_id) {
        const query = `DELETE FROM assigned_employees WHERE role_id=?`;

        return mySql.query(query, [role_id]);
    }

    // Permission_Role
    /**
     * @param {Object} dataObj
     * @param {Number} dataObj.role_id
     * @param {Array<Number>} dataObj.permission_ids
     * @param {Array<Number>} dataObj.organization_id
     * @param {Number} dataObj.created_by
     */
    insertPermissionRole(dataObj) {
        const values = dataObj.permission_ids.map(permission_id => [dataObj.role_id, permission_id, dataObj.organization_id, dataObj.created_by]);

        if (values.length === 0) return Promise.resolve();
        return mySql.query(`INSERT INTO permission_role (role_id, permission_id, organization_id, created_by) VALUES ?`, [values]);
    }
    // getPermissionRolesByRoleId(role_id, organization_id) {
    //     return mySql.query(`SELECT id, permission_id FROM permission_role WHERE role_id=? AND organization_id=?`, [role_id, organization_id]);
    // }
    getPermissionRolesByRoleId(role_id, organization_id) {
        return mySql.query(`SELECT pr.id, pr.permission_id, p.type 
                            FROM permission_role pr
                            JOIN permissions p ON pr.permission_id=p.id
                            WHERE pr.role_id=? AND pr.organization_id=?`
            , [role_id, organization_id]);
    }
    /**
     * 
     * @param {Object} dataObj
     * @param {Number} dataObj.role_id
     * @param {Number} dataObj.organization_id
     * @param {Array<Number>} dataObj.permission_ids
     */
    deletePermissionRoleByPermissionIds(dataObj) {
        const { role_id, organization_id, permission_ids } = dataObj;

        if (permission_ids.length === 0) return Promise.resolve();
        return mySql.query(`DELETE FROM permission_role WHERE role_id=? AND organization_id=? AND permission_id IN (?)`, [role_id, organization_id, permission_ids]);
    }
    deleteAllRolePermissions(role_id, organization_id) {
        return mySql.query(`DELETE FROM permission_role WHERE role_id=? AND organization_id=?`, [role_id, organization_id]);
    }

    // Permission
    getAllPermissions() {
        return mySql.query(`SELECT id, name, status, type FROM permissions`);
    }
    getRolePermissions() {

    }

    // New
    roleByName(name, organization_id) {
        const query = `
            SELECT id, name
            FROM roles
            WHERE name=? AND organization_id=?;
        `;

        return mySql.query(query, [name, organization_id]);
    }
    addAudience({ role_data }) {
        return mySql.query(`
            INSERT INTO roles_location_department (role_id,location_id,department_id)
            VALUES ?`, [role_data]);
    }

    listRoleAudience({ role_ids }) {
        const query = `SELECT rld.role_id,rld.location_id,rld.department_id,od.name department,ol.name location
                    FROM roles_location_department rld
                    LEFT JOIN organization_departments od ON rld.department_id=od.id
                    LEFT JOIN organization_locations ol ON rld.location_id=ol.id
                    WHERE rld.role_id IN(?);`;

        return mySql.query(query, [role_ids]);
    }

    deleteRoleWithLocAndDept({ role_id }) {
        return mySql.query(`DELETE FROM roles_location_department WHERE role_id=?`, [role_id]);
    }

    employees({ select, where }) {
        const query = `SELECT ${select}
                    FROM employees
                    WHERE ${where};`;

        return mySql.query(query);
    }

    getRoleWithDeptAndLoc({ where }) {
        const query = `SELECT *
                    FROM roles_location_department
                    WHERE ${where}`;

        return mySql.query(query);
    }
    roleByNameWithId(name, role_id, organization_id) {
        const query = `
            SELECT id, name
            FROM roles
            WHERE name=? AND organization_id=? AND id!=?;
        `;

        return mySql.query(query, [name, organization_id, role_id]);
    }

    listRoleAudienceWithLocation({ role_id, location_id }) {
        const query = `SELECT rld.role_id,rld.location_id,rld.department_id,od.name department,ol.name location
                    FROM roles_location_department rld
                    LEFT JOIN organization_departments od ON rld.department_id=od.id
                    LEFT JOIN organization_locations ol ON rld.location_id=ol.id
                    WHERE rld.role_id=? AND location_id=?;`;

        return mySql.query(query, [role_id, location_id]);
    }

    getGroupWithDeptAndLoc({ where }) {
        const query = `SELECT group_id
                    FROM organization_groups_properties
                    WHERE ${where} LIMIT 1`;

        return mySql.query(query);
    }

    getHrmsId(role_id, permission_id) {
        const query = `SELECT permission_id,role_id FROM permission_role 
                    WHERE role_id=(?) AND permission_id=(?)`;

        return mySql.query(query, [role_id, permission_id,]);
    }

    addPermissionRole(role_id, permission_id, organization_id, created_by) {
        let query = `INSERT INTO permission_role(role_id,permission_id,organization_id,created_by)VALUES (?,?,?,?)`;

        return mySql.query(query, [role_id, permission_id, organization_id, created_by]);
    }
    
    deletePermissionRole({ role_id, organization_id, permission_id }) {

        return mySql.query(`DELETE FROM permission_role WHERE role_id=? AND organization_id=? AND permission_id=?`, [role_id, organization_id, permission_id]);
    }
    
    getAdminIdByRoles (role_id, organization_id) {
        let query = `
            SELECT u.id as user_id, e.id as emp_id
            FROM user_role ur
            JOIN users u ON u.id = ur.user_id
            JOIN employees e ON u.id = e.user_id AND e.organization_id = ?
            WHERE ur.role_id = ?
        `;
        return mySql.query(query, [organization_id, role_id]);
    }

    updateAutoAccept (user_id) {
        let query = `
            UPDATE users SET auto_time_claim = 'true'
            WHERE id IN (?)
        `;
        return mySql.query(query, [user_id]);
    }


    getRolesById(role_id) {
        return mySql.query(`SELECT type, status, permission FROM roles WHERE id = ?`, [role_id]);
    }

    getRolesLocationDepartment (role_id) {
        return mySql.query(`SELECT location_id, department_id FROM roles_location_department WHERE role_id = ?`, [role_id]);
    }

    getRolesPermission (role_id) {
        return mySql.query(`SELECT permission_id FROM permission_role WHERE role_id = ?`, [role_id]);
    }
    
}
module.exports = new RoleModel;

// const query = `
//     SELECT *
//     FROM roles
//     WHERE name LIKE 'admin%' AND (organization_id=1 OR organization_id IS NULL);
// `;
// ALTER TABLE `roles`
//     ADD CONSTRAINT `UC_roles_name_organization_id` UNIQUE (name, organization_id)

// const query = `
//     SELECT
//         *
//     FROM roles AS r
//     LEFT JOIN permission_role AS pr
//     ON pr.role_id=r.id  AND pr.organization_id=1

//     WHERE (r.organization_id = 1 OR r.organization_id IS NULL)
// `;
// const query = `
//     SELECT
//         r.id AS role_id,
//         name,
//         status,
//         type,
//         GROUP_CONCAT(pr.permission_id) as permission_ids
//     FROM roles AS r
//     LEFT JOIN permission_role AS pr
//     ON pr.role_id=r.id  AND pr.organization_id=1

//     WHERE (r.organization_id = 1 OR r.organization_id IS NULL)
//     GROUP BY r.id
// `;

// mySql.query(query).then(console.log).catch(console.log)

const _ = require('underscore');
(async () => {
    const organizations = await mySql.query(`SELECT o.id as organization_id,u.id as user_id FROM organizations o INNER JOIN users u ON u.id=o.user_id where o.id=1 LIMIT 1`);
    for (const { organization_id, user_id } of organizations) {
        const roles = await mySql.query(`SELECT id as role_id,name,type FROM roles WHERE organization_id=? AND name IN('Employee','Manager','Team Lead')`, [organization_id]);
        for (const { role_id, name, type } of roles) {
            if (name == 'Employee') {
                const permission_ids = [56, 57, 58, 59, 60, 61];
                await updateRolesPermision(organization_id, role_id, permission_ids, user_id);
            }
            if (name == 'Team Lead') {
                const permission_ids = [1, 4, 8, 11, 13, 14, 16, 17, 27, 32, 56, 57, 58, 59, 60, 61, 70];
                await updateRolesPermision(organization_id, role_id, permission_ids, user_id);
            }
            if (name == 'Manager') {
                const permission_ids = [1, 4, 8, 11, 13, 14, 16, 17, 27, 32, 56, 57, 58, 59, 60, 61, 70];
                await updateRolesPermision(organization_id, role_id, permission_ids, user_id);
            }
        }
    }
})
async function updateRolesPermision(organization_id, role_id, permission_ids, user_id) {
    console.log('----', organization_id, role_id);
    const permission = JSON.stringify({ "read": 1, "write": 0, "delete": 0 });
    const update = await mySql.query(`UPDATE roles SET permission = ? WHERE id=? AND organization_id=?`, [permission, role_id, organization_id]);

    const permissionRoles = await mySql.query(`SELECT id, permission_id FROM permission_role WHERE role_id=? AND organization_id=?`, [role_id, organization_id]);
    const permissionRoleIds = _.pluck(permissionRoles, 'permission_id');

    const toBeInsertedPermissions = permission_ids.filter(item => !permissionRoleIds.includes(item));
    const toBeDeletedPermissions = permissionRoleIds.filter(item => !permission_ids.includes(item));

    const values = toBeInsertedPermissions.map(permission_id => [role_id, permission_id, organization_id, user_id]);
    if (toBeDeletedPermissions.length > 0) {
        await mySql.query(`DELETE FROM permission_role WHERE role_id=? AND organization_id=? AND permission_id IN (?)`, [role_id, organization_id, toBeDeletedPermissions]);
    }
    if (values.length > 0) {
        await mySql.query(`INSERT INTO permission_role (role_id, permission_id, organization_id, created_by) VALUES ?`, [values]);
    }
    return;
}
// let group_audience = [{ role_id: 1, location_id: 2, department_id: 3, employee_id: [1, 23] }, { role_id: 1, location_id: 2, department_id: 3, employee_id: [1, 5, 6, 7] }]

// let result = [];
// let newdata = []
// group_audience.map(x => {
//     const temp = newdata.find(element => (element.location_id === x.location_id && element.role_id === x.role_id && element.department_id === x.department_id))
//     if (!temp) {
//         newdata.push(x);
//     }
// })

// newdata.map(x => {
//     let temp = group_audience.filter(t => t.location_id == x.location_id && t.department_id == x.department_id && t.role_id == x.role_id);
//     let empIds = [];
//     temp.map(itr => {
//         empIds.push(...itr.employee_id);
//     })
//     result.push({ ...x, employee_id: empIds })
// })
// console.log('-------++---', result);