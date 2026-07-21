const mysql = require('../../../../database/MySqlConnection').getInstance();

class GroupsModel {
    static orgnizationSetting(organization_id) {
        const query = `SELECT os.rules,o.timezone,o.id 
                        FROM organizations as o
                        JOIN organization_settings os ON os.organization_id = o.id
                        WHERE o.id = ${organization_id}`;

        return mysql.query(query);
    }

    static groupSetting(group_id) {
        const query = `SELECT o.rules
                        FROM organization_groups as o
                        WHERE o.id = ${group_id}`;

        return mysql.query(query);
    }

    static getGroupByName({ name, organization_id }) {
        const query = `SELECT id FROM organization_groups WHERE name='${name}' AND organization_id=${organization_id}`;

        return mysql.query(query);
    }

    static createGroup({ organization_id, name, note, rules, user_id, }) {
        const query = `INSERT INTO organization_groups (organization_id, name, note, rules, created_by, updated_by)
                    VALUES (${organization_id},'${name}', '${note}', '${rules}', ${user_id}, ${user_id});`;

        return mysql.query(query);
    }

    static addAudience({ group_data }) {
        return mysql.query(`
            INSERT INTO organization_groups_properties (group_id,employee_id,location_id,department_id,role_id)
            VALUES ?`, [group_data]);
    }

    static listGroup({ organization_id, skip, limit, group_id,sortOrder,name ,sortColumn }) {
        let order;
        if (sortOrder === 'A') {
            order = `ASC`;
        } else {
            order = `DESC`;
        }
        let query =
            `SELECT
                    og.organization_id,og.id AS group_id,og.name,og.note,og.rules
                    FROM organization_groups og
                    WHERE og.organization_id=${organization_id}`;

        if (group_id!=null) query += ` AND id=${group_id}`;
        if (name!=null) query += ` AND og.name LIKE '%${name}%'`
        // if(sortOrder!=null) query += ` ORDER BY og.created_at ${order}`;
        if(sortOrder!=null && sortColumn==null)query += ` ORDER BY og.created_at ${order}`;
        if(sortOrder!=null && sortColumn!=null)query += ` ORDER BY ${sortColumn} ${ order}`;
        if(sortOrder==null && sortColumn!=null)query += ` ORDER BY ${sortColumn}`;
        if(skip!=null && limit!=null) query+=` LIMIT ${skip}, ${limit}`;
        return mysql.query(query);
    }
    static deleteGroups({ group_id, organization_id }) {
        const query = `DELETE FROM organization_groups WHERE id IN(${group_id}) AND organization_id=${organization_id};`
        return mysql.query(query);
    }

    static checkGroupExists({ name, organization_id, group_id }) {
        const query = `SELECT id FROM organization_groups WHERE id!=${group_id} AND name='${name}' AND organization_id=${organization_id}`;

        return mysql.query(query);
    }

    static updateGroup({ name, note, group_id, rules, organization_id }) {
        let update = '';
        if (name) update += `name = '${name}'`;
        if (note) { update += update ? `, note='${note}'` : `note='${note}'`; }
        if (rules) { update += update ? `, rules='${rules}'` : `rules='${rules}'`; }

        const query = `UPDATE organization_groups
                    SET ${update}
                    WHERE id=${group_id} AND organization_id=${organization_id};`;

        return mysql.query(query);
    }

    static deleteGroupsAudiance({ where }) {
        const query = `DELETE FROM organization_groups_properties 
                        WHERE ${where};`

        return mysql.query(query);
    }

    static updateEmplyeeSetting({ set, where }) {
        const query = `UPDATE employees SET ${set} WHERE ${where};`;

        return mysql.query(query);
    }
    static employees({ select, where }) {
        const query = `SELECT ${select}
                    FROM employees
                    WHERE ${where};`;
        return mysql.query(query);
    }

    static updateEmployeeSettings({ set, where }) {
        const query = `UPDATE employees SET ${set} WHERE ${where}`;
        return mysql.query(query);
    }

    static listAudience({ where }) {
        // const query = `SELECT group_id,employee_id,location_id,department_id
        //             FROM organization_groups_properties 
        //             WHERE ${where};`;

        // return mysql.query(query);
        const query = `SELECT group_id,employee_id,location_id,department_id,role_id
                    FROM organization_groups_properties 
                    WHERE ${where};`;

                    return mysql.query(query);
    }
    static listGroupAudienceIds({ group_ids }) {
        const query = `SELECT ogp.group_id,ogp.employee_id,ogp.location_id,ogp.department_id
                    FROM organization_groups_properties ogp
                    WHERE ogp.group_id IN(${group_ids});`;

        return mysql.query(query);
    }
    static getemployeeBasedOnRole(role_id, organization_id) {
        const query = `SELECT e.id
                FROM employees e
                INNER JOIN users u ON u.id=e.user_id
                INNER JOIN user_role ur ON ur.user_id=u.id
                WHERE ur.role_id=${role_id} AND e.organization_id=${organization_id};`;

        return mysql.query(query);
    }

    static getemployeeBasedOnRoleAndLocationDept(role_id, location_id, organization_id, department_ids) {
        const query = `SELECT e.id
                FROM employees e
                INNER JOIN users u ON u.id=e.user_id
                INNER JOIN user_role ur ON ur.user_id=u.id
                WHERE ur.role_id=${role_id} AND e.location_id=${location_id} AND e.organization_id=${organization_id} AND e.department_id IN(${department_ids});`;

        return mysql.query(query);
    }
    static getemployeeBasedOnRoleAndLocation(role_id, location_id, organization_id) {
        const query = `SELECT e.id
                FROM employees e
                INNER JOIN users u ON u.id=e.user_id
                INNER JOIN user_role ur ON ur.user_id=u.id
                WHERE ur.role_id=${role_id} AND e.location_id=${location_id} AND e.organization_id=${organization_id};`;

        return mysql.query(query);
    }
    
    static listGroupAudience({ grp_id }) {
        const query = `SELECT ogp.group_id,ogp.employee_id,ogp.location_id,ogp.department_id,CONCAT(u.first_name,' ', u.last_name) AS full_name,od.name department,ol.name location,r.id as role_id,r.name role_name
                    FROM organization_groups_properties ogp
                    LEFT JOIN employees e ON e.id=ogp.employee_id
                    LEFT JOIN users u ON e.user_id=u.id
                    LEFT JOIN organization_departments od ON ogp.department_id=od.id
                    LEFT JOIN organization_locations ol ON ogp.location_id=ol.id
                    LEFT JOIN roles r ON r.id =ogp.role_id
                    WHERE ogp.group_id IN(${grp_id});`;
        return mysql.query(query);
    }
    
    static getemployeeBasedOnRoleAndDepartment(role_id , organization_id, department_ids ) {
        const query = `SELECT e.id
                FROM employees e
                INNER JOIN users u ON u.id=e.user_id
                INNER JOIN user_role ur ON ur.user_id=u.id
                WHERE ur.role_id=${role_id} AND e.organization_id=${organization_id} AND e.department_id IN(${department_ids});`;
        return mysql.query(query);
    }

    static getGroupName({ group_id, organization_id }) {
        const query = `SELECT name FROM organization_groups WHERE id='${group_id}' AND organization_id=${organization_id}`;

        return mysql.query(query);
    }
    
    static updateGroupName({ name,group_id, organization_id }) {
        const query = `UPDATE organization_groups og SET og.name='${name}' WHERE og.id=${group_id} AND organization_id=${organization_id}`;

        return mysql.query(query);
    }
    // static employeeswithrole({ select, where }) {
    //     const query = `SELECT e.id FROM employees e
    //                 FROM employees
    //                 INNER JOIN user_role ur ON ur.user_id= e.user_id
    //                 WHERE ur.role_id=${role_id} AND e.location_id=${location_id} AND e.organization_id=${organization_id} AND e.department_id = ${department_id};`;
    // }
    static roleEmployees({ select, where }) {
        const query = `SELECT ${select}
                    FROM employees e
                    INNER JOIN users u ON u.id=e.user_id
                    INNER JOIN user_role ur ON ur.user_id=u.id
                    WHERE ${where};`;
        return mysql.query(query);
    }
    
    static checkEmployeeGroup(empIds) {
        const query = `SELECT e.id ,CONCAT (u.first_name,' ',u.last_name) name FROM employees e
                    INNER JOIN users u ON u.id=e.user_id
                    WHERE e.group_id IS NOT NULL AND e.id IN (${empIds})`;
        return mysql.query(query);
    }

    static checkGroupNameAlreadyExits(name,organization_id,group_id) {
        const query = `SELECT name FROM organization_groups WHERE name='${name}' AND organization_id=${organization_id} AND id!=${group_id}`;

        return mysql.query(query);
    }

    static updateGroupNote({ note,group_id, organization_id }) {
        const query = `UPDATE organization_groups og SET og.note='${note}' WHERE og.id=${group_id} AND organization_id=${organization_id}`;

        return mysql.query(query);
    }

    static listGroupCount({ organization_id, skip, limit, group_id,sortOrder,name  }) {
        let order;
        if (sortOrder === 'A') {
            order = `ASC`;
        } else {
            order = `DESC`;
        }
        let query =
            `SELECT
                    Count(*) as count
                    FROM organization_groups og
                    WHERE og.organization_id=${organization_id}`;

        if (group_id!=null) query += ` AND id=${group_id}`;
        if (name!=null) query += ` AND og.name LIKE '%${name}%'`
        return mysql.query(query);
    }
    
    static removeUserFromGroup(empIds) {
        const query = `DELETE FROM organization_groups_properties WHERE employee_id IN (${empIds})`;
        return mysql.query(query);
    }
}

module.exports.GroupsModel = GroupsModel;