const mySql = require('../../../../database/MySqlConnection').getInstance();

class DepartmentModel {

    checkDepartmentId(department_id, organization_id) {
        let query = `SELECT id, name FROM organization_departments 
                     WHERE id=(?) AND organization_id =(?)`;
        return mySql.query(query, [department_id, organization_id]);
    }

    addDepartmentDetails(department_id, location_id, department_head_id) {
        let query = `INSERT INTO organization_department_location_relation (department_id, location_id, department_head_id)
                     VALUES (?, ?, ?)`;
        return mySql.query(query, [department_id, location_id, department_head_id]);
    }

    udpateDepartmentDetails(location_id, department_head_id, department_id) {
        let query = `UPDATE organization_department_location_relation SET location_id=(?), department_head_id=(?)
                    WHERE department_id =(?)`;
        return mySql.query(query, [location_id, department_head_id, department_id]);
    }

    deleteDepartmentDetails(department_id) {
        let query = `DELETE FROM organization_department_location_relation WHERE department_id=(?)`;
        return mySql.query(query, [department_id]);
    }

    fetchLocationDepartments(department_id, organization_id) {
        let query = `SELECT od.id,od.name,odl.department_head_id,odl.location_id FROM organization_departments od
                     LEFT JOIN organization_department_location_relation odl ON odl.department_id=od.id 
                     WHERE od.organization_id='${organization_id}'`;
        if (department_id) query += ` AND od.id='${department_id}'`;
        return mySql.query(query);
    }

    fetchDepartments(ids) {
        let query = `SELECT id, name FROM organization_departments WHERE id IN (?)`;
        return mySql.query(query, [ids]);
    }

    fetchLocations(ids) {
        let query = `SELECT id, name FROM organization_locations WHERE id IN (?)`;
        return mySql.query(query, [ids]);
    }
}

module.exports = new DepartmentModel;