const mySql = require('../../../../database/MySqlConnection').getInstance();


class TravelModel {

    /**
    * Checking travel with Id
    *
    * @function checkTravelId
    * @memberof  TravelModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    checkTravelId(travel_id, organization_id) {
        let query = `SELECT id, employee_id FROM organization_travels WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [travel_id, organization_id]);
    }

    /**
    * Add travel
    *
    * @function addTravel
    * @memberof  TravelModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    addTravel(employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description, organization_id) {
        let query = `INSERT INTO organization_travels (employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description, status, organization_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        return mySql.query(query, [employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description, 0, organization_id]);
    }

    /**
    * Get travel
    *
    * @function getTravel
    * @memberof  TravelModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    getTravel(travel_id, organization_id) {
        let query = `SELECT ot.id,ot.employee_id,concat(u.first_name,' ',u.last_name) AS employee_name,
                     ot.start_date,ot.end_date,ot.purpose,ot.place,ot.travel_mode,ot.arrangement_type,ot.expected_travel_budget,
                     ot.actual_travel_budget,ot.description,ot.status 
                     FROM organization_travels ot 
                     LEFT JOIN users u ON u.id=ot.employee_id 
                     WHERE organization_id='${organization_id}'`;
        if (travel_id) query += ` AND ot.id='${travel_id}'`;
        return mySql.query(query);
    }

    /**
    * Update travel by Id
    *
    * @function updateTravel
    * @memberof  TravelModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    updateTravel(travel_id, employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description, status, organization_id) {
        let query = `UPDATE organization_travels SET employee_id=(?), start_date=(?), end_date=(?), purpose=(?),
                     place=(?), travel_mode=(?), arrangement_type=(?),
                     expected_travel_budget=(?), actual_travel_budget=(?), description=(?), status=(?)
                     WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [employee_id, start_date, end_date, purpose, place, travel_mode, arrangement_type, expected_travel_budget, actual_travel_budget, description, status, travel_id, organization_id]);
    }

    /**
    * Update travel status
    *
    * @function updateTravelStatus
    * @memberof  TravelModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    updateTravelStatus(travel_id, status, organization_id) {
        let query = `UPDATE organization_travels SET status=(?)
                     WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [status, travel_id, organization_id]);
    }

    /**
    * Delete travel with Id
    *
    * @function deleteTravel
    * @memberof  TravelModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    deleteTravel(travel_id, organization_id) {
        let query = `DELETE FROM organization_travels WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [travel_id, organization_id]);
    }

}

module.exports = new TravelModel;