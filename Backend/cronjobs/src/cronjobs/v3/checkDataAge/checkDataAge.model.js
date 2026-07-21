const moment = require('moment');
const mySql = require("../../../database/MySqlConnection").getInstance();
const UserActivityDataModel = require('../models/user_activity_data.schema');
const EmpProductivityReportModel = require("../models/employee_productivity.schema");
class CheckDataAgeModel {
    /**
    * Get user activity
    *
    * @function getUserActivity
    * @memberof CheckDataAgeModel
    * @param {String} date
    * @return {Promise<Object>} data or Error.
    */
    static getUserActivity({ date }) {
        return UserActivityDataModel.find({ dataId: date });
    }

    /**
   * Delete user activity
   *
   * @function deleteUserActivity
   * @memberof CheckDataAgeModel
   * @param {String} date
   * @return {Promise<Object>} data or Error.
   */
    static deleteUserActivity({ date }) {
        return UserActivityDataModel.deleteMany({ dataId: { $lte: date } });
    }

    /**
     * Get all employees id
     * @memberof CheckDataAgeModel
     * @param {*} organization_id 
     * @return {Promise<Object>} data or Error.
     */
    static getAllEmployeesList(organization_id) {
        const query = `SELECT GROUP_CONCAT(id) as allEmployee_ids FROM employees 
                        WHERE organization_id = ?`;

        return mySql.query(query, [organization_id]);
    }

    /**
     * Get list of all employees which are
     * active last 1 month
     * @memberof CheckDataAgeModel
     * @param {*} param0 
     * @returns 
     */
    static checkEmployeeForSuspend({ organization_id, date }) {
        return EmpProductivityReportModel.aggregate([
            { $match: { organization_id, date: { $gte: date } } },
            {
                $group: {
                    _id: null,
                    employee_ids: { $addToSet: "$employee_id" }
                }
            }
        ]);
    }

    /**
     * Suspend all employees who are not active since last 1 month
     * @memberof CheckDataAgeModel
     * @param {*} param0 
     * @returns 
     */
    static suspendEmployees({ employee_ids, organization_id, status = 2 }) {
        const query = `UPDATE users u 
                    INNER JOIN employees e ON e.user_id = u.id 
                    SET u.status = ? 
                    WHERE e.id IN (?) AND e.organization_id = ?`;

        return mySql.query(query, [status, employee_ids, organization_id]);
    }
}

module.exports.CheckDataAgeModel = CheckDataAgeModel;