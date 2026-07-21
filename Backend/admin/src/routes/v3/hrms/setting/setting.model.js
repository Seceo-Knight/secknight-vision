const mySql = require('../../../../database/MySqlConnection').getInstance();

class SettingModel {

    /**
    * Create setting
    *
    * @function createSetting
    * @memberof  SettingModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    createSetting(name, value, attendance_colors, organization_id) {
        let query = `INSERT INTO organization_hrms_settings (name, value, attendance_colors, organization_id)
                     VALUES(?, ?, ?, ?)`;
        return mySql.query(query, [name, value, attendance_colors, organization_id]);
    }

    /**
    * Update setting
    *
    * @function updateSetting
    * @memberof  SettingModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    updateSetting(name, value, attendance_colors, organization_id) {
        let query = `UPDATE organization_hrms_settings SET value=(?), attendance_colors = (?)
                     WHERE name=(?) AND organization_id=(?)`;
        return mySql.query(query, [value, attendance_colors, name, organization_id]);
    }

    /**
    * Get setting list
    *
    * @function getSetting
    * @memberof  SettingModel
    * @param {*} req
    * @param {*} res
    * @returns {Array} -  return promise.
    */
    getSetting(name, organization_id) {
        let query = `SELECT id, name, value, attendance_colors FROM organization_hrms_settings
                     WHERE organization_id='${organization_id}'`;
        if (name) query += ` AND name='${name}'`;
        return mySql.query(query);
    }
}

module.exports = new SettingModel;