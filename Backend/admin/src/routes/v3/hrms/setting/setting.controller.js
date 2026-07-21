const SettingModel = require('./setting.model');
const settingValidation = require('./setting.validation');
const sendResponse = require('../../../../utils/myService').sendResponse;
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { AttendanceSettingMessages } = require("../../../../utils/helpers/LanguageTranslate");

class SettingController {

    /**
    * Update Setting
    *
    * @function updateSetting
    * @memberof  SettingController
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateSetting(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { value, error } = settingValidation.updateSetting(req.body);
            if (error) return sendResponse(res, 404, null, translate(AttendanceSettingMessages, "2", language), error.details[0].message);

            let { name, type, values, manual_hours, colors } = value;
            values = JSON.stringify({ type, values, manual_hours });
            let attendance_colors = JSON.stringify({ ...colors });
            let setting = await SettingModel.updateSetting(name, values, attendance_colors, organization_id);
            if (setting.affectedRows === 0) setting = await SettingModel.createSetting(name, values, attendance_colors, organization_id);

            return sendResponse(res, 200, { ...value }, translate(AttendanceSettingMessages, "3", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(AttendanceSettingMessages, "5", language), err);
        }
    }

    /**
    * Get Setting
    *
    * @function getSetting
    * @memberof  SettingController
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getSetting(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let setting = await SettingModel.getSetting(req.query.name, organization_id);
            if (setting.length > 0) {
                const value = JSON.parse(setting[0].value);
                setting[0].attendance_colors = setting[0].attendance_colors ? JSON.parse(setting[0].attendance_colors) : null;
                setting[0].value = Number(value.values);
                setting[0].type = Number(value.type);
                setting[0].manual_hours = value.manual_hours ? Number(value.manual_hours) : 0;
                return sendResponse(res, 200, setting, translate(AttendanceSettingMessages, "6", language), null);
            }
            return sendResponse(res, 400, null, translate(AttendanceSettingMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(AttendanceSettingMessages, "8", language), err);
        }
    }
}

module.exports = new SettingController;