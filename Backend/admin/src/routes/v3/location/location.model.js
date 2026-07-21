const mySql = require('../../../database/MySqlConnection').getInstance();

class LocationModel {
    async getLocations(admin_id) {
        let query = `SELECT id AS location_id,name As location,timezone
                    FROM organization_locations 
                    WHERE organization_id=${admin_id}`
        return mySql.query(query);
    }

    orgSetting(organization_id) {
        const query = `SELECT  timezone
                    FROM organizations
                    WHERE id=${organization_id};`

        return mySql.query(query);
    }

    getlocationToDepartment(location_id) {
        let query = `SELECT odl.department_id AS department_id,d.name
                FROM organization_department_location_relation odl
                INNER JOIN organization_departments d ON d.id = odl.department_id
                WHERE location_id=${location_id}`;
        return mySql.query(query);
    }

    addLocation(name, timezone, organization_id) {
        let query = `INSERT INTO organization_locations (name,timezone,organization_id)
        VALUES ('${name}','${timezone}',${organization_id})`;
        return mySql.query(query);
    }

    addDepartmentToLocationByName(department) {
        return mySql.query(`INSERT INTO organization_departments (name,organization_id)
        VALUES ?`, [department]);
    }

    addDepartmentToLocationByIds(location_depatment_list) {
        return mySql.query(`
        INSERT INTO organization_department_location_relation (department_id,location_id)
        VALUES ?`, [location_depatment_list]);
    }

    // checkLocationName(name, organization_id, location_id = null) {
    //     let query = `select id , name FROM  organization_locations  
    //     WHERE  name ='${name}' AND organization_id=${organization_id}`;
    //     return mySql.query(query);
    // }
    checkLocationName(name, organization_id, location_id = null) {
        let condition = `name ='${name}' AND organization_id=${organization_id}`;
        if (location_id) condition += ` AND id !=${location_id}`

        let query = `select id , name FROM  organization_locations  
        WHERE  ${condition}`;
        return mySql.query(query);
    }

    UpdateLocation(values, location_id, organization_id) {
        let query = `UPDATE  organization_locations  SET ${values}
            WHERE  id =${location_id} AND organization_id=${organization_id} `;
        return mySql.query(query);
    }

    deleteLocation(location_id, organization_id) {
        let query = `DELETE FROM organization_locations
            WHERE  id =${location_id} AND organization_id=${organization_id}`;
        return mySql.query(query);
    }

    checkDepartmentName(department_name, organization_id, is_deleted) {
        department_name = department_name.map(x => `"${x}"`)
        let query = `SELECT id, name, is_deleted FROM organization_departments 
            WHERE  name IN (${department_name}) AND organization_id=${organization_id} `;
        if (is_deleted) query += `AND is_deleted = 0;`
        return mySql.query(query);
    }

    updateDeptIsdeleted(department_ids, organization_id) {
        return mySql.query(`UPDATE organization_departments SET is_deleted = 0 WHERE organization_id = ${organization_id} AND id IN (${department_ids})`);
    }

    checkLocationUsers(location_id, organization_id) {
        let query = `SELECT id  FROM employees 
            WHERE  location_id =${location_id} AND organization_id=${organization_id} `;
        return mySql.query(query);
    }

    getLocationById(location_id, organization_id) {
        let query = `SELECT id FROM organization_locations
                    WHERE id=${location_id} AND  organization_id=${organization_id} `;
        return mySql.query(query);
    }

    checkLocationDepartment(location_id, department_ids) {
        let query = `
            SELECT od.id, od.name  FROM organization_department_location_relation odl
            INNER JOIN organization_departments od on od.id=odl.department_id
            WHERE odl.location_id=${location_id} AND  odl.department_id IN (${department_ids}) `;
        return mySql.query(query);
    }

    checkDepartmentUserById(department_id) {
        let query = `
            SELECT DISTINCT(od.name), od.id  
            FROM employees e 
            INNER JOIN organization_departments od  ON od.id=e.department_id
            WHERE od.id IN (${department_id})`;
        return mySql.query(query);
    }
    checkDepartmentUserByIdToDelete(department_id, location_id, organization_id) {
        let query = `
            SELECT DISTINCT(od.name), od.id  
            FROM employees e 
            INNER JOIN organization_departments od  ON od.id=e.department_id
             WHERE e.department_id  IN (${department_id}) AND e.location_id=${location_id} AND e.organization_id=${organization_id} `;
        return mySql.query(query);
    }

    deleteLocationDepartmets(department_id, location_id) {
        let query = `
            DELETE FROM organization_department_location_relation
            WHERE location_id=${location_id} AND department_id IN (${department_id})`;
        return mySql.query(query);
    }

    // getDepartmentByLocation(location_id, organization_id) {
    //     let query;
    //     if (parseInt(location_id) !== 0) {
    //         query = `
    //         SELECT od.id AS department_id ,od.name  
    //         FROM organization_departments od
    //         INNER JOIN organization_department_location_relation odl ON odl.department_id=od.id
    //         WHERE odl.location_id=${location_id}
    //         `;
    //     } else {
    //         query = `
    //             SELECT od.id AS department_id ,od.name  
    //             FROM organization_departments od
    //             WHERE od.organization_id=${organization_id} `;
    //     }

    //     return mySql.query(query);
    // }

    getDepartmentByLocation(location_id, organization_id, manager_id, role_id) {
        let query;
        if (!manager_id) {
            if (parseInt(location_id) !== 0) {
                query = `
                SELECT od.id AS department_id ,od.name  
                FROM organization_departments od
                INNER JOIN organization_department_location_relation odl ON odl.department_id=od.id
                WHERE odl.location_id=${location_id}`;
            } else {
                query = `
                    SELECT od.id AS department_id ,od.name  
                    FROM organization_departments od
                    WHERE od.organization_id=${organization_id} `;
            }
        } else {
            if (parseInt(location_id) !== 0) {
                query = `
                SELECT DISTINCT(e.department_id) AS department_id ,od.name
                FROM assigned_employees ae 
                INNER JOIN employees e ON e.id =ae.employee_id 
                INNER JOIN organization_departments od ON od.id = e.department_id
                INNER JOIN organization_department_location_relation odl ON odl.department_id=od.id
                WHERE ae.to_assigned_id=${manager_id} AND ae.role_id=${role_id} AND odl.location_id=${location_id}`;
            } else {
                query = `
                SELECT DISTINCT(e.department_id) AS department_id ,od.name
                FROM assigned_employees ae 
                INNER JOIN employees e ON e.id =ae.employee_id 
                INNER JOIN organization_departments od ON od.id = e.department_id
                WHERE ae.to_assigned_id=${manager_id} AND ae.role_id=${role_id}`;
            }
        }
        query += ` AND od.is_deleted = 0;`;
        return mySql.query(query);
    }

    // fetchLocations(skip, limit, organization_id) {
    //     let query = `
    //         SELECT id,name ,timezone FROM  organization_locations 
    //         WHERE organization_id =${organization_id}
    //         LIMIT ${skip}, ${limit}           
    //         `;

    //     return mySql.query(query);
    // }
    departments(organization_id, manager_id, login_role_id) {
        let query = `SELECT id,name  FROM  organization_departments WHERE organization_id =${organization_id}`;
        if (manager_id) {
            query = `
                SELECT DISTINCT(e.department_id) AS id,od.name
                FROM assigned_employees ae 
                INNER JOIN employees e ON e.id =ae.employee_id 
                INNER JOIN organization_departments  od ON od.id=e.department_id
                WHERE ae.to_assigned_id=${manager_id} AND ae.role_id=${login_role_id};`
        }
        return mySql.query(query);
    }

    fetchLocations(organization_id, manager_id, login_role_id) {
        let query = `
            SELECT id,name ,timezone FROM  organization_locations WHERE organization_id =${organization_id}`;

        if (manager_id) {
            query = `
                SELECT DISTINCT(e.location_id) AS id  ,ol.name,ol.timezone
                FROM assigned_employees ae 
                INNER JOIN employees e ON e.id =ae.employee_id 
                INNER JOIN organization_locations  ol ON ol.id=e.location_id
                WHERE ae.to_assigned_id=${manager_id} AND ae.role_id=${login_role_id};`
        }
        return mySql.query(query);
    }

    role(organization_id, manager_id, login_role_id) {
        let query = `SELECT id ,name,type
                    FROM roles
                    WHERE organization_id=${organization_id}`;
        if (manager_id) {
            query = `SELECT DISTINCT(r.id),r.name,r.type
                    FROM roles r
                    INNER JOIN user_role ur ON ur.role_id=r.id
                    INNER JOIN employees e ON e.user_id=ur.user_id
                    INNER JOIN assigned_employees ae ON ae.employee_id=e.id
                    WHERE r.organization_id=${organization_id} AND ae.to_assigned_id=${manager_id} AND ae.role_id=${login_role_id}`;
        }
        return mySql.query(query);
    }

    roleLocations(role_id, manager_id, login_role_id) {
        let query = `SELECT DISTINCT(e.location_id) AS id  ,ol.name,ol.timezone
                    FROM employees e
                    INNER JOIN user_role ur ON e.user_id =ur.user_id 
                    INNER JOIN organization_locations  ol ON ol.id=e.location_id
                    WHERE ur.role_id=${role_id}`;

        if (manager_id) {
            query = `SELECT DISTINCT(e.location_id) AS id  ,ol.name,ol.timezone
                    FROM assigned_employees ae 
                    INNER JOIN employees e ON e.id =ae.employee_id 
                    INNER JOIN user_role ur ON e.user_id=ur.user_id
                    INNER JOIN organization_locations  ol ON ol.id=e.location_id
                    WHERE ae.to_assigned_id=${manager_id} AND ae.role_id=${login_role_id} AND ur.role_id=${role_id}`;
        }
        return mySql.query(query);
    }
    roleDepartment(role_id, manager_id, location_id, login_role_id) {
        let query = `SELECT DISTINCT(e.department_id),od.name
                    FROM employees e 
                    INNER JOIN user_role ur ON e.user_id=ur.user_id
                    INNER JOIN organization_departments  od ON od.id=e.department_id
                    WHERE ur.role_id=${role_id}`;

        if (manager_id) {
            query = `SELECT DISTINCT(e.department_id),od.name
                    FROM assigned_employees ae
                    INNER JOIN employees e ON e.id =ae.employee_id
                    INNER JOIN user_role ur ON e.user_id=ur.user_id
                    INNER JOIN organization_departments  od ON od.id=e.department_id
                    WHERE ae.to_assigned_id=${manager_id} AND ae.role_id=${login_role_id} AND ur.role_id=${role_id}`
        }
        if (location_id && location_id != 0) query += ` AND e.location_id=${location_id}`;

        return mySql.query(query);
    }

    roleLocation(role_id) {
        const query = `SELECT DISTINCT  rld.location_id,ol.name
                FROM roles_location_department rld
                INNER JOIN organization_locations ol ON ol.id=rld.location_id
                WHERE role_id=${role_id}`;

        return mySql.query(query);

    }
    roleDepartments(role_id) {
        const query = `SELECT DISTINCT  rld.department_id,od.name
                    FROM roles_location_department rld
                    INNER JOIN organization_departments od ON od.id=rld.department_id
                    WHERE role_id=${role_id}`;

        return mySql.query(query);
    }
    roleLocationWithDepartment(role_id, location_id) {
        const query = `SELECT rld.department_id,od.name
                    FROM roles_location_department rld
                    INNER JOIN organization_departments od ON od.id=rld.department_id
                    WHERE rld.role_id=${role_id} AND rld.location_id=${location_id} AND rld.department_id IS NOT NULL`

        return mySql.query(query);
    }

    /*
        * sql query for fetiching user geolocation
        *
        * @function getGeoLocation
        * @param {*} admin_id or organization_id
        * @returns {object} - location object or null . 
    */
    async getGeoLocation(admin_id, employee_id) {
        let query = `SELECT geolocation
                    FROM employees 
                    WHERE organization_id=${admin_id} AND id=${employee_id}`;
        return mySql.query(query);
    }

    async getLocationBasedOnNonAdmin (employee_id) {
        let query = `
            SELECT DISTINCT(e.location_id) AS id ,ol.name, ol.timezone
                FROM assigned_employees ae 
                INNER JOIN employees e ON e.id =ae.employee_id 
                INNER JOIN organization_locations ol ON ol.id = e.location_id
                WHERE ae.to_assigned_id=${employee_id}
        `;
        return mySql.query(query);
    }
    
    async getlocationToDepartmentOnNonAdmin(location_id, employee_id) {
        let query = `
            SELECT odl.department_id AS department_id,d.name
                FROM organization_department_location_relation odl
                INNER JOIN organization_departments d ON d.id = odl.department_id
                INNER JOIN employees e ON e.department_id = d.id
                INNER JOIN assigned_employees ae ON e.id =ae.employee_id
                WHERE odl.location_id=${location_id} AND ae.to_assigned_id=${employee_id}
        `;
        return mySql.query(query);
    }
}

module.exports = new LocationModel;