const mySql = require('../../../../database/MySqlConnection').getInstance();

class TerminationModel {

    /**
    * Checking termination with Id
    *
    * @function checkTerminationId
    * @memberof  TerminationModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    checkTerminationId(termination_id, organization_id) {
        let query = `SELECT id, employee_id FROM organization_terminations WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [termination_id, organization_id]);
    }

    /**
    * Insert termination
    *
    * @function addTermination
    * @memberof  TerminationModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    addTermination(type, employee_id, notice, termination, reason, status, description, organization_id) {
        let query = `INSERT INTO organization_terminations (type,employee_id, notice, termination, reason, status, description, organization_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        return mySql.query(query, [type, employee_id, notice, termination, reason, status, description, organization_id]);
    }

    /**
    * Get termination
    *
    * @function getTermination
    * @memberof  TerminationModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    getTermination(termination_id, type, organization_id) {
        let query = `SELECT ot.id,ot.employee_id,concat(u.first_name,' ',u.last_name) AS employee_name, 
                     ot.notice,ot.termination,ot.reason,ot.status,ot.description 
                     FROM organization_terminations ot 
                     LEFT JOIN employees e ON e.id=ot.employee_id 
                     INNER JOIN users u ON u.id=e.user_id 
                     WHERE ot.organization_id='${organization_id}' AND ot.type='${type}'`;
        if (termination_id) query += ` AND ot.id='${termination_id}'`;
        return mySql.query(query);
    }

    /**
    * Update termination
    *
    * @function updateTermination
    * @memberof  TerminationModel
    * @param {*} req
    * @param {*} res
   * @returns {Array} -  return promise.
    */
    updateTermination(type, termination_id, employee_id, notice, termination, reason, status, description, organization_id) {
        let query = `UPDATE organization_terminations SET type=(?), employee_id=(?), notice=(?), termination=(?),
                     reason=(?), status=(?), description=(?)
                     WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [type, employee_id, notice, termination, reason, status, description, termination_id, organization_id]);
    }

    /**
    * Delete termination
    *
    * @function deleteTermination
    * @memberof  TerminationModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    deleteTermination(termination_id, organization_id) {
        let query = `DELETE FROM organization_terminations WHERE id =(?) AND organization_id=(?)`;
        return mySql.query(query, [termination_id, organization_id]);
    }
}

module.exports = new TerminationModel;