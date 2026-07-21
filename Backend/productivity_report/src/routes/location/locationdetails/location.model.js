const mySql = require('../../../database/MySqlConnection').getInstance();

class LocationModel {
    async getLocations(admin_id) {
        let query = `SELECT id AS location_id,name As location,timezone
                    FROM organization_locations 
                    WHERE orgranization_id=${admin_id}`

        return mySql.query(query);
    }

    getlocationToDepartment(location_id) {
        let query = `SELECT odl.department_id AS department_id,d.name
                FROM organization_department_location_relation odl
                INNER JOIN organization_departments d ON d.id = odl.department_id
                WHERE location_id=${location_id}`;

        return mySql.query(query);
    }
}

module.exports = new LocationModel;