const mySql = require('../../../../database/MySqlConnection').getInstance();

class LocationModel {
    async getLocations(location_id, organization_id) {
        let query = "";
        query = `SELECT ol.id,ol.name,ol.location_head_id,ol.location_hr_id,
                 concat( u.first_name," ", u.last_name) AS headName, ol.details
                 FROM organization_locations ol LEFT JOIN users u ON u.id=ol.location_head_id 
                 WHERE ol.organization_id='${organization_id}'`;
        if (location_id) query += ` AND ol.id ='${location_id}'`;
        return mySql.query(query);
    }

    async getUsers(userIds) {
        let query = `SELECT e.id ,concat( u.first_name," ", u.last_name) AS name 
                     FROM employees e 
                     INNER JOIN users u ON u.id=e.user_id 
                     WHERE e.id IN (${userIds})`;
        return mySql.query(query);
    }

    async getUsersWithUid(userIds) {
        let query = `SELECT u.id ,concat( u.first_name," ", u.last_name) AS name
                     FROM users u 
                     WHERE u.id IN (${userIds})`;
        return mySql.query(query);
    }

    addLocation(location, timezone, location_head_id, location_hr_id, details, organization_id) {
        let query = `INSERT INTO organization_locations (name, timezone, location_head_id, location_hr_id, details, organization_id)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        return mySql.query(query, [location, timezone, location_head_id, location_hr_id, details, organization_id]);
    }

    updateLocation(location, timezone, location_head_id, location_hr_id, details, location_id, organization_id) {
        let query = `UPDATE organization_locations SET name=(?), timezone=(?), location_head_id=(?), location_hr_id=(?), details=(?)
                     WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [location, timezone, location_head_id, location_hr_id, details, location_id, organization_id]);
    }

    deleteLocation(location_id, organization_id) {
        let query = `DELETE FROM organization_locations 
                     WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [location_id, organization_id]);
    }

    deleteLocationDetails(location_id) {
        let query = `DELETE FROM location_properties 
                     WHERE  location_id =(?)`;
        return mySql.query(query, [location_id]);
    }
}

module.exports = new LocationModel;