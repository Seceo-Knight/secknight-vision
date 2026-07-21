const mySql = require('../../../database/MySqlConnection').getInstance();

class DepartmentModel {

    async getDepartmentByname(organization_id, name) {
        let query = `SELECT id,name FROM organization_departments 
                    WHERE organization_id=${organization_id} AND name='${name}'`

        return mySql.query(query);
    }

    // fetchDepartments(organization_id, skip, limit) {
    //     let query = `SELECT id,name FROM organization_departments 
    //                 WHERE organization_id=${organization_id}
    //                 LIMIT ${skip}, ${limit}
    //                 `
    //     return mySql.query(query);
    // }



    fetchDepartments(organization_id, skip, limit, manager_id, name) {
        let query = `SELECT id,name FROM organization_departments 
                    WHERE organization_id=${organization_id}`;


        if (manager_id) {
            query = `SELECT DISTINCT(e.department_id) AS id ,od.name
                        FROM assigned_employees ae 
                        INNER JOIN employees e ON e.id =ae.employee_id 
                        INNER JOIN organization_departments od ON od.id = e.department_id
                        WHERE ae.to_assigned_id=${manager_id}`;
        }
        query += ` AND is_deleted = 0`;
        if (name) query += ` AND name LIKE '%${name}%'`;

        return mySql.query(query);
    }



    addDepartment(name, organization_id) {
        let query = `INSERT INTO  organization_departments (name ,organization_id) 
                     VALUES ('${name}',${organization_id})
                    `

        return mySql.query(query);
    }

    checkDepartmentUsers(department_id, organization_id) {
        let query = `SELECT id  FROM employees 
        WHERE organization_id=${organization_id} AND department_id=${department_id}`

        return mySql.query(query);
    }

    updateDepartment(name, department_id, organization_id) {
        let query = `UPDATE organization_departments SET name='${name}'
        WHERE organization_id=${organization_id} AND id=${department_id}`

        return mySql.query(query);
    }

    deleteDepartment(department_id, organization_id) {
        let query = `DELETE FROM organization_departments
        WHERE organization_id=${organization_id} AND id=${department_id}`

        return mySql.query(query);
    }
    
    deleteDepartmentNew({ department_id }) {
        return mySql.query(`UPDATE organization_departments SET is_deleted = 1 WHERE id=${department_id};`);
    }

    checkAssignedDepartment({ organization_id, department_id }) {
        let query = `
            SELECT
            	e.id AS employees_id,
            	od.id,
            	odlr.location_id AS organization_department_location_relation_id,
            	a.id AS announcements_id,
            	t.id AS transfer_id,
            	oaw.id AS organization_apps_web_id,
            	otr.id AS organization_tracking_rules_id,
            	ed.id AS employee_dept_email_reports_id,
            	ogp.group_id AS organization_groups_properties_id
            FROM organization_departments od
            LEFT JOIN organizations o ON od.organization_id = o.id
            LEFT JOIN employees e ON od.id = e.department_id
            LEFT JOIN organization_department_location_relation odlr ON odlr.department_id = od.id
            LEFT JOIN announcements a ON od.id = a.department_id
            LEFT JOIN transfer t ON od.id = t.transfer_department
            LEFT JOIN organization_apps_web oaw ON od.id = oaw.department_id
            LEFT JOIN employee_dept_email_reports  ed ON od.id = ed.department_id
            LEFT JOIN organization_groups_properties ogp ON od.id = ogp.department_id
            LEFT JOIN roles_location_department rld ON od.id = rld.department_id
            LEFT JOIN organization_tracking_rules otr ON od.id = otr.department_id
            WHERE e.id IS NULL AND odlr.location_id IS NULL AND a.id IS NULL AND t.id IS NULL 
            AND oaw.id IS NULL AND ogp.group_id IS NULL AND otr.id IS NULL AND o.id = ${organization_id} AND od.id = ${department_id};
        `;
        return mySql.query(query);
    }

    getDepartmentById({ department_id }) {
        return mySql.query(`SELECT id FROM organization_departments WHERE id = ${department_id} AND is_deleted = 0;`);
    }

    checkDepartmentLocationRelation({ department_id }) {
        return mySql.query(`SELECT department_id FROM organization_department_location_relation WHERE department_id = ${department_id};`);
    }

    getDepartmentByManager(employee_id, role_id) {
        return mySql.query(`
            SELECT od.id as department_id
                FROM employees e 
                JOIN assigned_employees ae ON ae.to_assigned_id = e.id
                JOIN employees aae ON aae.id = ae.employee_id 
                JOIN organization_departments od ON od.id = aae.department_id 
                JOIN user_role ur ON ur.role_id  = ae.role_id 
                JOIN roles r ON r.id = ur.role_id 
                WHERE e.id = ${employee_id} AND r.id = ${role_id}
        `)
    }

}
module.exports = new DepartmentModel;